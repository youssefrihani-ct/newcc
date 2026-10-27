-- Phase 0 / identity, role model, 2FA policy and the aal2 gate (spec 3, 17b)

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum
  ('admin', 'study_manager', 'site_manager', 'crc', 'finance', 'participant', 'auditor', 'sponsor');

create type public.mfa_policy as enum ('off', 'optional', 'required');

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Business records are never hard-deleted: void or supersede with a reason (spec 17b).
create or replace function public.forbid_hard_delete()
returns trigger language plpgsql as $$
begin
  raise exception 'record.hard_delete_forbidden' using errcode = 'P0001',
    detail = json_build_object('table', tg_table_name)::text;
end $$;

-- Server code returns a message code plus parameters, never display text (spec 5d).
create or replace function public.app_error(code text, params jsonb default '{}'::jsonb)
returns void language plpgsql as $$
begin
  raise exception '%', code using errcode = 'P0001', detail = params::text;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null default '',
  email text,
  phone text,
  language text not null default 'en-GB',
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  avatar_path text,
  -- a per-user override may only make the role's 2FA policy stricter (spec 17b)
  mfa_policy_override public.mfa_policy,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  role public.app_role not null,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index user_roles_active_uq on public.user_roles (user_id, role) where revoked_at is null;
create index user_roles_user_idx on public.user_roles (user_id) where revoked_at is null;

-- Permissions that are not roles (the Translator permission, spec 3)
create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  permission text not null check (permission in ('translator')),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index user_permissions_active_uq on public.user_permissions (user_id, permission) where revoked_at is null;

-- 2FA policy per role (spec 17b): off / optional / required
create table public.role_mfa_policies (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null unique,
  policy public.mfa_policy not null default 'optional',
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.role_mfa_policies (role, policy) values
  ('admin', 'optional'), ('study_manager', 'optional'), ('site_manager', 'optional'),
  ('crc', 'optional'), ('finance', 'optional'), ('auditor', 'optional'),
  ('participant', 'off'), ('sponsor', 'off');

-- Platform switches (demo mode, go-live gate); settings data, admin only
create table public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('demo_mode', 'true'),
  ('go_live_signed', 'false'),
  ('default_locale', '"en-GB"'),
  ('default_currency', '"GBP"');

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger user_roles_updated before update on public.user_roles for each row execute function public.set_updated_at();
create trigger user_permissions_updated before update on public.user_permissions for each row execute function public.set_updated_at();
create trigger role_mfa_policies_updated before update on public.role_mfa_policies for each row execute function public.set_updated_at();
create trigger platform_settings_updated before update on public.platform_settings for each row execute function public.set_updated_at();

create trigger profiles_no_delete before delete on public.profiles for each row execute function public.forbid_hard_delete();
create trigger user_roles_no_delete before delete on public.user_roles for each row execute function public.forbid_hard_delete();
create trigger user_permissions_no_delete before delete on public.user_permissions for each row execute function public.forbid_hard_delete();
create trigger role_mfa_policies_no_delete before delete on public.role_mfa_policies for each row execute function public.forbid_hard_delete();
create trigger platform_settings_no_delete before delete on public.platform_settings for each row execute function public.forbid_hard_delete();

-- A new auth user gets a profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role and 2FA helpers (security definer so policies never recurse into RLS)
-- ---------------------------------------------------------------------------

create or replace function public.has_role(uid uuid, r public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = uid and ur.role = r and ur.revoked_at is null
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = uid and ur.revoked_at is null
      and ur.role in ('admin', 'study_manager', 'site_manager', 'crc', 'finance', 'auditor')
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_role(uid, 'admin');
$$;

create or replace function public.is_translator(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_permissions up
    where up.user_id = uid and up.permission = 'translator' and up.revoked_at is null
  );
$$;

create or replace function public.mfa_policy_rank(p public.mfa_policy)
returns int language sql immutable as $$
  select case p when 'required' then 2 when 'optional' then 1 else 0 end;
$$;

-- The strictest of the user's role policies and their personal override.
create or replace function public.effective_mfa_policy(uid uuid)
returns public.mfa_policy language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.p from (
       select rp.policy as p
         from public.user_roles ur
         join public.role_mfa_policies rp on rp.role = ur.role
        where ur.user_id = uid and ur.revoked_at is null
       union all
       select pr.mfa_policy_override from public.profiles pr
        where pr.id = uid and pr.mfa_policy_override is not null
     ) s
     order by public.mfa_policy_rank(s.p) desc
     limit 1),
    'off'::public.mfa_policy);
$$;

create or replace function public.current_aal()
returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1');
$$;

-- True when the caller's role policy is not `required`, or the session is aal2.
-- Included in every RLS policy, RPC and storage policy that touches study,
-- participant, claim, money, audit or settings data (spec 17b).
create or replace function public.mfa_satisfied()
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when auth.uid() is null then false
    else public.effective_mfa_policy(auth.uid()) <> 'required' or public.current_aal() = 'aal2'
  end;
$$;

-- What the client needs before it can reach any data: callable at aal1, returns only the caller's own state.
create or replace function public.my_security_state()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'roles', coalesce((select jsonb_agg(ur.role order by ur.role) from public.user_roles ur
                        where ur.user_id = auth.uid() and ur.revoked_at is null), '[]'::jsonb),
    'mfa_policy', public.effective_mfa_policy(auth.uid()),
    'aal', public.current_aal(),
    'mfa_satisfied', public.mfa_satisfied(),
    'demo_mode', coalesce((select (value)::boolean from public.platform_settings where key = 'demo_mode'), true)
  );
$$;

-- Production never loosens a staff role's policy (spec 17b, go-live gate).
create or replace function public.guard_mfa_policy_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  live boolean;
begin
  select coalesce((value)::boolean, false) into live from public.platform_settings where key = 'go_live_signed';
  if live and new.role not in ('participant', 'sponsor')
     and public.mfa_policy_rank(new.policy) < public.mfa_policy_rank(old.policy) then
    perform public.app_error('security.mfa_policy_cannot_be_loosened', jsonb_build_object('role', new.role));
  end if;
  if live and new.role not in ('participant', 'sponsor') and new.policy <> 'required' then
    perform public.app_error('security.mfa_policy_must_be_required', jsonb_build_object('role', new.role));
  end if;
  return new;
end $$;

create trigger role_mfa_policies_guard before update on public.role_mfa_policies
  for each row execute function public.guard_mfa_policy_change();

-- Users may edit their own display fields only; status and the 2FA override belong to Admin.
create or replace function public.guard_profile_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    if new.id <> old.id or new.email is distinct from old.email
       or new.status <> old.status
       or new.mfa_policy_override is distinct from old.mfa_policy_override then
      perform public.app_error('profile.field_not_editable');
    end if;
  end if;
  if new.mfa_policy_override is not null and old.mfa_policy_override is distinct from new.mfa_policy_override then
    -- a personal override may only be stricter than the role policy
    if public.mfa_policy_rank(new.mfa_policy_override) <
       coalesce((select max(public.mfa_policy_rank(rp.policy)) from public.user_roles ur
                  join public.role_mfa_policies rp on rp.role = ur.role
                 where ur.user_id = new.id and ur.revoked_at is null), 0) then
      perform public.app_error('security.mfa_override_must_be_stricter');
    end if;
  end if;
  return new;
end $$;

create trigger profiles_write_guard before update on public.profiles
  for each row execute function public.guard_profile_write();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.role_mfa_policies enable row level security;
alter table public.platform_settings enable row level security;

-- A user can always read their own identity rows, so the client can tell what to do at aal1.
create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() and public.mfa_satisfied())
  with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy profiles_insert_admin on public.profiles for insert to authenticated
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());

create policy user_roles_select_self on public.user_roles for select to authenticated
  using (user_id = auth.uid());
create policy user_roles_select_admin on public.user_roles for select to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy user_roles_write_admin on public.user_roles for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());

create policy user_permissions_select_self on public.user_permissions for select to authenticated
  using (user_id = auth.uid() and public.mfa_satisfied());
create policy user_permissions_write_admin on public.user_permissions for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());

create policy role_mfa_policies_admin on public.role_mfa_policies for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());

create policy platform_settings_admin on public.platform_settings for all to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied())
  with check (public.is_admin(auth.uid()) and public.mfa_satisfied());

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_roles to authenticated;
grant select, insert, update on public.user_permissions to authenticated;
grant select, update on public.role_mfa_policies to authenticated;
grant select, insert, update on public.platform_settings to authenticated;

grant execute on function public.my_security_state() to authenticated;
grant execute on function public.mfa_satisfied() to authenticated;
