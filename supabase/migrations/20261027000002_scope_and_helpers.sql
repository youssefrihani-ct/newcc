-- Phase 0 / minimal scope tables and the RLS scope helpers (spec 3, 7)
-- Later phases add columns; only what the helpers need exists now.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'GB',
  timezone text not null default 'Europe/London',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  client_id uuid references public.clients (id),
  status text not null default 'setup' check (status in
    ('setup', 'pending_activation', 'recruiting', 'recruitment_closed', 'on_hold',
     'suspended', 'completed', 'closed', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trial_sites (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid not null references public.trials (id),
  site_id uuid not null references public.sites (id),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trial_id, site_id)
);

create table public.study_team_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  trial_id uuid not null references public.trials (id),
  role public.app_role not null default 'study_manager' check (role = 'study_manager'),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index study_team_active_uq on public.study_team_assignments (user_id, trial_id) where revoked_at is null;

create table public.site_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  trial_id uuid not null references public.trials (id),
  site_id uuid not null references public.sites (id),
  role public.app_role not null check (role in ('site_manager', 'crc')),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index site_staff_active_uq on public.site_staff_assignments (user_id, trial_id, site_id, role) where revoked_at is null;

-- Finance sees all studies, or only the clients listed here (client_id null = all)
create table public.finance_scopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  client_id uuid references public.clients (id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.participant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  trial_id uuid not null references public.trials (id),
  site_id uuid not null references public.sites (id),
  subject_code text not null,
  status text not null default 'invited' check (status in
    ('invited', 'active', 'screen_failed', 'withdrawn', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trial_id, subject_code)
);

do $$
declare t text;
begin
  foreach t in array array['clients', 'sites', 'trials', 'trial_sites', 'study_team_assignments',
                           'site_staff_assignments', 'finance_scopes', 'participant_profiles'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('create trigger %I before delete on public.%I for each row execute function public.forbid_hard_delete()', t || '_no_delete', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create index trial_sites_site_idx on public.trial_sites (site_id);
create index site_staff_user_idx on public.site_staff_assignments (user_id) where revoked_at is null;
create index participant_profiles_user_idx on public.participant_profiles (user_id);
create index participant_profiles_site_idx on public.participant_profiles (trial_id, site_id);

-- ---------------------------------------------------------------------------
-- Scope helpers (spec 3): used by every policy. Security definer so they read
-- the assignment tables without recursing into those tables' own policies.
-- ---------------------------------------------------------------------------

-- Admin, or a Study Manager assigned to the study.
create or replace function public.manages_trial(uid uuid, trial uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin(uid)
      or exists (
        select 1 from public.study_team_assignments sta
         where sta.user_id = uid and sta.trial_id = trial and sta.revoked_at is null
           and public.has_role(uid, 'study_manager'));
$$;

-- Admin; a Study Manager of any study the site belongs to; or staff assigned to the site.
create or replace function public.manages_site(uid uuid, site uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin(uid)
      or exists (
        select 1 from public.trial_sites ts
          join public.study_team_assignments sta on sta.trial_id = ts.trial_id
         where ts.site_id = site and sta.user_id = uid and sta.revoked_at is null
           and public.has_role(uid, 'study_manager'))
      or exists (
        select 1 from public.site_staff_assignments ssa
         where ssa.user_id = uid and ssa.site_id = site and ssa.revoked_at is null
           and public.has_role(uid, ssa.role));
$$;

-- Admin; the study's Study Manager; staff of the participant's site in that study; or the participant.
create or replace function public.manages_participant(uid uuid, participant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.participant_profiles pp
     where pp.id = participant
       and (public.manages_trial(uid, pp.trial_id)
            or pp.user_id = uid
            or exists (
              select 1 from public.site_staff_assignments ssa
               where ssa.user_id = uid and ssa.trial_id = pp.trial_id and ssa.site_id = pp.site_id
                 and ssa.revoked_at is null and public.has_role(uid, ssa.role))));
$$;

-- Anyone assigned to the study in any capacity (used to let them see the study row itself).
create or replace function public.works_on_trial(uid uuid, trial uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.manages_trial(uid, trial)
      or exists (
        select 1 from public.site_staff_assignments ssa
         where ssa.user_id = uid and ssa.trial_id = trial and ssa.revoked_at is null
           and public.has_role(uid, ssa.role))
      or exists (
        select 1 from public.participant_profiles pp
         where pp.user_id = uid and pp.trial_id = trial)
      or exists (
        select 1 from public.finance_scopes fs
          join public.trials t on t.id = trial
         where fs.user_id = uid and fs.revoked_at is null
           and (fs.client_id is null or fs.client_id = t.client_id)
           and public.has_role(uid, 'finance'));
$$;

-- ---------------------------------------------------------------------------
-- Policies. Every one includes mfa_satisfied().
-- ---------------------------------------------------------------------------

create policy clients_admin on public.clients for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy clients_select_scoped on public.clients for select to authenticated
  using (public.mfa_satisfied() and exists (
    select 1 from public.trials t where t.client_id = clients.id and public.works_on_trial(auth.uid(), t.id)));

create policy sites_admin on public.sites for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy sites_select_scoped on public.sites for select to authenticated
  using (public.mfa_satisfied() and public.manages_site(auth.uid(), id));

create policy trials_admin on public.trials for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy trials_select_scoped on public.trials for select to authenticated
  using (public.mfa_satisfied() and public.works_on_trial(auth.uid(), id));

create policy trial_sites_admin on public.trial_sites for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy trial_sites_select_scoped on public.trial_sites for select to authenticated
  using (public.mfa_satisfied() and (public.manages_trial(auth.uid(), trial_id) or public.manages_site(auth.uid(), site_id)));

create policy study_team_admin on public.study_team_assignments for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy study_team_select_scoped on public.study_team_assignments for select to authenticated
  using (public.mfa_satisfied() and (user_id = auth.uid() or public.manages_trial(auth.uid(), trial_id)));

create policy site_staff_admin on public.site_staff_assignments for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
-- A Study Manager assigns Site Managers and CRCs inside their own studies only (spec 3)
create policy site_staff_manage_trial on public.site_staff_assignments for all to authenticated
  using (public.mfa_satisfied() and public.manages_trial(auth.uid(), trial_id))
  with check (public.mfa_satisfied() and public.manages_trial(auth.uid(), trial_id));
create policy site_staff_select_self on public.site_staff_assignments for select to authenticated
  using (public.mfa_satisfied() and user_id = auth.uid());

create policy finance_scopes_admin on public.finance_scopes for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy finance_scopes_select_self on public.finance_scopes for select to authenticated
  using (public.mfa_satisfied() and user_id = auth.uid());

create policy participant_profiles_select_scoped on public.participant_profiles for select to authenticated
  using (public.mfa_satisfied() and public.manages_participant(auth.uid(), id));
create policy participant_profiles_admin on public.participant_profiles for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());

grant select, insert, update on
  public.clients, public.sites, public.trials, public.trial_sites,
  public.study_team_assignments, public.site_staff_assignments,
  public.finance_scopes, public.participant_profiles
  to authenticated;
