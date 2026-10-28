-- Phase 1 / signature engine (spec 17d), signed role and assignment grants,
-- staff user creation, Study Manager scoping.

-- ---------------------------------------------------------------------------
-- Signature policy, signatures, acknowledgements, attempts
-- ---------------------------------------------------------------------------

create table public.signature_policies (
  id uuid primary key default gen_random_uuid(),
  action text not null unique,
  required boolean not null default true,
  meaning text not null default 'approved'
    check (meaning in ('authored', 'reviewed', 'approved', 'responsible', 'consent')),
  second_signer_above_amount bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Defaults from spec 17d. Later phases use these actions; the policy screen comes in Phase 13.
insert into public.signature_policies (action, meaning) values
  ('study.status_change', 'approved'), ('study.activation', 'approved'),
  ('contract.create', 'approved'), ('contract.amend', 'approved'), ('contract.top_up', 'approved'),
  ('contract.budget_override', 'approved'), ('vendor_contract.approve', 'approved'),
  ('visit_schedule.publish', 'approved'), ('claim_rules.publish', 'approved'),
  ('claim.final_approval', 'approved'), ('claim.partial_approval', 'approved'),
  ('claim.decline', 'approved'), ('claim.send_back', 'reviewed'),
  ('payment.approve', 'approved'), ('payment_run.release', 'approved'),
  ('role.grant', 'approved'), ('role.revoke', 'approved'),
  ('assignment.grant', 'approved'), ('assignment.revoke', 'approved'),
  ('user.status_change', 'approved'), ('mfa.reset', 'approved'),
  ('break_glass.use', 'responsible'), ('record.void_or_correct', 'approved'),
  ('export.participant_dataset', 'approved'), ('consent.update', 'consent');

create table public.signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  full_name text not null,
  role_title text not null,
  meaning text not null check (meaning in ('authored', 'reviewed', 'approved', 'responsible', 'consent')),
  action text not null,
  record_type text not null,
  record_id uuid not null,
  record_version integer not null default 1,
  content_hash text not null,
  signed_at timestamptz not null default now(),
  auth_method text not null,
  ip_address text,
  device text,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index signatures_record_idx on public.signatures (record_type, record_id);
create index signatures_user_idx on public.signatures (user_id);

create table public.signature_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Failed and cancelled signing attempts are logged; repeated failures lock signing.
create table public.signature_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  outcome text not null check (outcome in ('failed', 'cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index signature_attempts_user_idx on public.signature_attempts (user_id, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['signature_policies', 'signatures', 'signature_acknowledgements', 'signature_attempts'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('create trigger %I before delete on public.%I for each row execute function public.forbid_hard_delete()', t || '_no_delete', t);
    execute format('alter table public.%I enable row level security', t);
    perform public.audit_attach(('public.' || t)::regclass);
  end loop;
end $$;

-- A signature is never edited: only superseded_at may be set, by the engine.
create or replace function public.guard_signature_write()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'superseded_at' - 'updated_at') is distinct from (to_jsonb(old) - 'superseded_at' - 'updated_at')
     or (old.superseded_at is not null and new.superseded_at is distinct from old.superseded_at) then
    perform public.app_error('signature.immutable');
  end if;
  return new;
end $$;
create trigger signatures_guard before update on public.signatures
  for each row execute function public.guard_signature_write();

-- Signature policy and signatures are readable by Admin; a user also reads their own signatures.
create policy signature_policies_select on public.signature_policies for select to authenticated
  using (public.mfa_satisfied() and public.is_staff(auth.uid()));
create policy signatures_select_self on public.signatures for select to authenticated
  using (public.mfa_satisfied() and user_id = auth.uid());
create policy signatures_select_admin on public.signatures for select to authenticated
  using (public.mfa_satisfied() and public.is_admin(auth.uid()));
create policy signature_ack_select_self on public.signature_acknowledgements for select to authenticated
  using (user_id = auth.uid());
grant select on public.signature_policies, public.signatures, public.signature_acknowledgements to authenticated;
grant select, insert, update on public.signature_policies, public.signatures,
  public.signature_acknowledgements, public.signature_attempts to service_role;

-- ---------------------------------------------------------------------------
-- Which records can be signed, and their content (the thing a signature is bound to)
-- ---------------------------------------------------------------------------

create or replace function public.signable_snapshot(p_type text, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare j jsonb;
begin
  if p_type = 'user_roles' then
    select jsonb_build_object('id', r.id, 'user_id', r.user_id, 'role', r.role, 'created_at', r.created_at)
      into j from public.user_roles r where r.id = p_id;
  elsif p_type = 'study_team_assignments' then
    select jsonb_build_object('id', r.id, 'user_id', r.user_id, 'trial_id', r.trial_id, 'role', r.role, 'created_at', r.created_at)
      into j from public.study_team_assignments r where r.id = p_id;
  elsif p_type = 'site_staff_assignments' then
    select jsonb_build_object('id', r.id, 'user_id', r.user_id, 'trial_id', r.trial_id, 'site_id', r.site_id,
                              'role', r.role, 'created_at', r.created_at)
      into j from public.site_staff_assignments r where r.id = p_id;
  elsif p_type = 'profiles' then
    select jsonb_build_object('id', r.id, 'status', r.status) into j from public.profiles r where r.id = p_id;
  else
    perform public.app_error('signature.unknown_record_type');
  end if;
  return j;
end $$;

create or replace function public.snapshot_hash(p_type text, p_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select encode(extensions.digest(convert_to(public.signable_snapshot(p_type, p_id)::text, 'utf8'), 'sha256'), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- Re-authentication at the moment of signing, checked in the database (spec 17d).
-- The client re-enters the password (and the 2FA code when enrolled); the fresh
-- session carries timestamped `amr` entries that this function inspects.
-- ---------------------------------------------------------------------------

create or replace function public.signature_reauth_method()
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  amr jsonb := coalesce(auth.jwt() -> 'amr', '[]'::jsonb);
  cutoff bigint := extract(epoch from now())::bigint - 120;
  pw boolean;
  tp boolean;
  enrolled boolean;
begin
  if uid is null then
    perform public.app_error('signature.not_authenticated');
  end if;
  select exists (select 1 from jsonb_array_elements(amr) e
                  where e ->> 'method' = 'password' and (e ->> 'timestamp')::bigint >= cutoff) into pw;
  if not pw then
    perform public.app_error('signature.reauth_required');
  end if;
  select exists (select 1 from auth.mfa_factors f where f.user_id = uid and f.status = 'verified') into enrolled;
  if enrolled then
    select exists (select 1 from jsonb_array_elements(amr) e
                    where e ->> 'method' = 'totp' and (e ->> 'timestamp')::bigint >= cutoff) into tp;
    if not tp or public.current_aal() <> 'aal2' then
      perform public.app_error('signature.reauth_code_required');
    end if;
    return 'password+totp';
  end if;
  return 'password';
end $$;

-- Engine entry point for the RPCs of this and later phases. Not callable from the API.
create or replace function public.create_signature(
  p_action text, p_record_type text, p_record_id uuid, p_meaning text default null,
  p_signature_id uuid default gen_random_uuid())
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  policy public.signature_policies%rowtype;
  method text;
  name_text text;
  title_text text;
  headers json := nullif(current_setting('request.headers', true), '')::json;
  meaning_text text;
  prior uuid;
  version int;
begin
  select * into policy from public.signature_policies where action = p_action;
  if not found then
    perform public.app_error('signature.unknown_action', jsonb_build_object('action', p_action));
  end if;
  meaning_text := coalesce(p_meaning, policy.meaning);
  if meaning_text not in ('authored', 'reviewed', 'approved', 'responsible', 'consent') then
    perform public.app_error('signature.invalid_meaning');
  end if;

  if (select count(*) from public.signature_attempts a
       where a.user_id = uid and a.outcome = 'failed' and a.created_at > now() - interval '15 minutes') >= 5 then
    perform public.app_error('signature.locked');
  end if;
  if not exists (select 1 from public.signature_acknowledgements a where a.user_id = uid) then
    perform public.app_error('signature.statement_not_accepted');
  end if;

  method := public.signature_reauth_method();

  select pr.full_name,
         coalesce((select string_agg(ur.role::text, ', ' order by ur.role) from public.user_roles ur
                    where ur.user_id = uid and ur.revoked_at is null), '')
    into name_text, title_text from public.profiles pr where pr.id = uid;

  -- editing a signed record needs a new signature; the old one shows as superseded
  select s.id into prior from public.signatures s
   where s.record_type = p_record_type and s.record_id = p_record_id and s.superseded_at is null
   order by s.signed_at desc limit 1;
  select coalesce(max(s.record_version), 0) + 1 into version from public.signatures s
   where s.record_type = p_record_type and s.record_id = p_record_id;

  insert into public.signatures (id, user_id, full_name, role_title, meaning, action, record_type, record_id,
                                 record_version, content_hash, auth_method, ip_address, device)
  values (p_signature_id, uid, name_text, title_text, meaning_text, p_action, p_record_type, p_record_id,
          version, public.snapshot_hash(p_record_type, p_record_id), method,
          split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1), headers ->> 'user-agent');
  if prior is not null then
    update public.signatures set superseded_at = now() where id = prior;
  end if;
  return p_signature_id;
end $$;
revoke all on function public.create_signature(text, text, uuid, text, uuid) from public, anon, authenticated;

create or replace function public.signature_required(p_action text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select required from public.signature_policies where action = p_action), true);
$$;

-- First use: accept that the electronic signature is the legal equivalent of a handwritten one.
create or replace function public.accept_signature_statement()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.mfa_satisfied() then
    perform public.app_error('signature.not_authenticated');
  end if;
  insert into public.signature_acknowledgements (user_id) values (auth.uid()) on conflict (user_id) do nothing;
end $$;

-- Failed or cancelled signing attempts are logged by the client; five failures in 15 minutes lock signing.
create or replace function public.log_signature_attempt(p_outcome text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_outcome not in ('failed', 'cancelled') then
    perform public.app_error('signature.invalid_outcome');
  end if;
  insert into public.signature_attempts (user_id, outcome, reason) values (auth.uid(), p_outcome, left(p_reason, 200));
end $$;

-- Signature manifestation: name, date and time (UTC), meaning, and whether it still applies to the record.
create or replace function public.signatures_for(p_type text, p_id uuid)
returns table (id uuid, full_name text, role_title text, meaning text, signed_at timestamptz,
               record_version int, is_current boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.mfa_satisfied() then
    return;
  end if;
  return query
    select s.id, s.full_name, s.role_title, s.meaning, s.signed_at, s.record_version,
           (s.superseded_at is null and s.content_hash = public.snapshot_hash(s.record_type, s.record_id))
      from public.signatures s
     where s.record_type = p_type and s.record_id = p_id
       and (public.is_admin(auth.uid()) or s.user_id = auth.uid())
     order by s.signed_at desc;
end $$;

grant execute on function public.accept_signature_statement() to authenticated;
grant execute on function public.log_signature_attempt(text, text) to authenticated;
grant execute on function public.signatures_for(text, uuid) to authenticated;
grant execute on function public.signature_required(text) to authenticated;

-- Audit rows written during a signed action carry its signature id (spec 17c).
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  oldj jsonb;
  newj jsonb;
  rowj jsonb;
  changed jsonb := '{}'::jsonb;
  k text;
  act text;
  scope jsonb;
begin
  if tg_op = 'INSERT' then
    newj := to_jsonb(new); rowj := newj; act := 'create';
    select coalesce(jsonb_object_agg(e.key, jsonb_build_object('new', e.value)), '{}'::jsonb)
      into changed from jsonb_each(newj) e;
  elsif tg_op = 'UPDATE' then
    oldj := to_jsonb(old); newj := to_jsonb(new); rowj := newj; act := 'update';
    for k in select jsonb_object_keys(newj) loop
      if k <> 'updated_at' and oldj -> k is distinct from newj -> k then
        changed := changed || jsonb_build_object(k, jsonb_build_object('old', oldj -> k, 'new', newj -> k));
      end if;
    end loop;
    if changed = '{}'::jsonb then
      return new;
    end if;
    if newj ->> 'revoked_at' is not null and oldj ->> 'revoked_at' is null then act := 'revoke'; end if;
    if newj ->> 'voided_at' is not null and oldj ->> 'voided_at' is null then act := 'void'; end if;
  else
    oldj := to_jsonb(old); rowj := oldj; act := 'delete';
    select coalesce(jsonb_object_agg(e.key, jsonb_build_object('old', e.value)), '{}'::jsonb)
      into changed from jsonb_each(oldj) e;
  end if;

  scope := jsonb_build_object(
    'client_id', rowj ->> 'client_id', 'trial_id', coalesce(rowj ->> 'trial_id',
      case when tg_table_name = 'trials' then rowj ->> 'id' end),
    'site_id', coalesce(rowj ->> 'site_id', case when tg_table_name = 'sites' then rowj ->> 'id' end),
    'participant_id', coalesce(rowj ->> 'participant_id',
      case when tg_table_name = 'participant_profiles' then rowj ->> 'id' end));

  perform public.audit_write(tg_table_name, rowj ->> 'id', act, changed, scope, null, null,
                             nullif(current_setting('app.audit_signature_id', true), '')::uuid);
  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------------------
-- Privileged writes go through the RPCs below, never straight at the tables.
-- ---------------------------------------------------------------------------

alter table public.profiles add column must_change_password boolean not null default false;

drop policy if exists user_roles_write_admin on public.user_roles;
drop policy if exists study_team_admin on public.study_team_assignments;
drop policy if exists site_staff_admin on public.site_staff_assignments;
drop policy if exists site_staff_manage_trial on public.site_staff_assignments;
drop policy if exists profiles_insert_admin on public.profiles;
revoke insert, update on public.user_roles, public.study_team_assignments, public.site_staff_assignments from authenticated;
revoke insert on public.profiles from authenticated;

create policy study_team_admin_select on public.study_team_assignments for select to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy site_staff_select_admin on public.site_staff_assignments for select to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied());
create policy site_staff_select_study_manager on public.site_staff_assignments for select to authenticated
  using (public.mfa_satisfied() and public.manages_trial(auth.uid(), trial_id));
create policy site_staff_select_site_manager on public.site_staff_assignments for select to authenticated
  using (public.mfa_satisfied() and public.has_role(auth.uid(), 'site_manager') and public.manages_site(auth.uid(), site_id));
create policy user_roles_select_admin_only on public.user_roles for select to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied());
grant select on public.user_roles, public.study_team_assignments, public.site_staff_assignments to authenticated;

-- Status and the 2FA override change only through an RPC (flag set for the transaction).
create or replace function public.guard_profile_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare via_rpc boolean := coalesce(current_setting('app.privileged_write', true), '') = 'on';
begin
  if auth.uid() is not null and not via_rpc then
    if new.id <> old.id or new.email is distinct from old.email
       or new.status <> old.status
       or new.mfa_policy_override is distinct from old.mfa_policy_override
       or new.must_change_password is distinct from old.must_change_password then
      perform public.app_error('profile.field_not_editable');
    end if;
  end if;
  if new.mfa_policy_override is not null and old.mfa_policy_override is distinct from new.mfa_policy_override then
    if public.mfa_policy_rank(new.mfa_policy_override) <
       coalesce((select max(public.mfa_policy_rank(rp.policy)) from public.user_roles ur
                  join public.role_mfa_policies rp on rp.role = ur.role
                 where ur.user_id = new.id and ur.revoked_at is null), 0) then
      perform public.app_error('security.mfa_override_must_be_stricter');
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Study Manager scoping of people (spec 3): who may see whom
-- ---------------------------------------------------------------------------

create or replace function public.can_view_profile(uid uuid, target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select uid = target
      or public.is_admin(uid)
      or exists (   -- a Study Manager sees the team of their own studies
        select 1 from public.study_team_assignments mine
          join public.site_staff_assignments theirs on theirs.trial_id = mine.trial_id
         where mine.user_id = uid and mine.revoked_at is null and public.has_role(uid, 'study_manager')
           and theirs.user_id = target and theirs.revoked_at is null)
      or exists (
        select 1 from public.study_team_assignments mine
          join public.study_team_assignments theirs on theirs.trial_id = mine.trial_id
         where mine.user_id = uid and mine.revoked_at is null and public.has_role(uid, 'study_manager')
           and theirs.user_id = target and theirs.revoked_at is null)
      or exists (   -- a Site Manager sees the staff of their own sites
        select 1 from public.site_staff_assignments mine
          join public.site_staff_assignments theirs on theirs.site_id = mine.site_id and theirs.trial_id = mine.trial_id
         where mine.user_id = uid and mine.revoked_at is null and mine.role = 'site_manager'
           and public.has_role(uid, 'site_manager')
           and theirs.user_id = target and theirs.revoked_at is null);
$$;

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_scoped on public.profiles for select to authenticated
  using (public.mfa_satisfied() and public.can_view_profile(auth.uid(), id));

drop policy if exists user_roles_select_admin_only on public.user_roles;
create policy user_roles_select_scoped on public.user_roles for select to authenticated
  using (public.mfa_satisfied() and public.can_view_profile(auth.uid(), user_id));

-- ---------------------------------------------------------------------------
-- RPCs: every grant is signed, audited and refuses self-grants (segregation of duties)
-- ---------------------------------------------------------------------------

create or replace function public.require_actor(p_admin_only boolean default false)
returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.mfa_satisfied() then
    perform public.app_error('auth.not_allowed');
  end if;
  if p_admin_only and not public.is_admin(auth.uid()) then
    perform public.app_error('auth.not_allowed');
  end if;
  return auth.uid();
end $$;

create or replace function public.begin_signed_action(p_action text, p_sig uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_reason is null or length(btrim(p_reason)) = 0 then
    perform public.app_error('reason.required');
  end if;
  perform set_config('app.audit_reason', left(btrim(p_reason), 500), true);
  perform set_config('app.audit_signature_id', p_sig::text, true);
  perform set_config('app.privileged_write', 'on', true);
end $$;

create or replace function public.end_signed_action()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.audit_reason', '', true);
  perform set_config('app.audit_signature_id', '', true);
  perform set_config('app.privileged_write', '', true);
end $$;

create or replace function public.grant_role(p_user uuid, p_role public.app_role, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(true);
  sig uuid := gen_random_uuid();
  new_id uuid;
begin
  if p_user = actor then perform public.app_error('auth.self_grant_forbidden'); end if;
  if p_role in ('participant', 'sponsor') then perform public.app_error('role.not_grantable'); end if;
  if not exists (select 1 from public.profiles where id = p_user) then perform public.app_error('user.not_found'); end if;
  if public.has_role(p_user, p_role) then perform public.app_error('role.already_granted'); end if;

  perform public.begin_signed_action('role.grant', sig, p_reason);
  insert into public.user_roles (user_id, role) values (p_user, p_role) returning id into new_id;
  if public.signature_required('role.grant') then
    perform public.create_signature('role.grant', 'user_roles', new_id, null, sig);
  end if;
  perform public.end_signed_action();
  return new_id;
end $$;

create or replace function public.revoke_role(p_user_role uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(true);
  sig uuid := gen_random_uuid();
  ur public.user_roles%rowtype;
begin
  select * into ur from public.user_roles where id = p_user_role and revoked_at is null;
  if not found then perform public.app_error('role.not_found'); end if;
  if ur.user_id = actor then perform public.app_error('auth.self_grant_forbidden'); end if;
  if ur.role = 'admin' and (select count(*) from public.user_roles where role = 'admin' and revoked_at is null) <= 1 then
    perform public.app_error('role.last_admin');
  end if;

  perform public.begin_signed_action('role.revoke', sig, p_reason);
  update public.user_roles set revoked_at = now(), revoked_reason = btrim(p_reason) where id = p_user_role;
  -- the person's assignments for that role end with it
  if ur.role = 'study_manager' then
    update public.study_team_assignments set revoked_at = now() where user_id = ur.user_id and revoked_at is null;
  elsif ur.role in ('site_manager', 'crc') then
    update public.site_staff_assignments set revoked_at = now()
     where user_id = ur.user_id and role = ur.role and revoked_at is null;
  end if;
  if public.signature_required('role.revoke') then
    perform public.create_signature('role.revoke', 'user_roles', p_user_role, null, sig);
  end if;
  perform public.end_signed_action();
end $$;

create or replace function public.assign_study_manager(p_user uuid, p_trial uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(true);
  sig uuid := gen_random_uuid();
  new_id uuid;
begin
  if p_user = actor then perform public.app_error('auth.self_grant_forbidden'); end if;
  if not public.has_role(p_user, 'study_manager') then perform public.app_error('assignment.role_missing'); end if;
  if not exists (select 1 from public.trials where id = p_trial) then perform public.app_error('study.not_found'); end if;
  if exists (select 1 from public.study_team_assignments where user_id = p_user and trial_id = p_trial and revoked_at is null) then
    perform public.app_error('assignment.already_exists');
  end if;

  perform public.begin_signed_action('assignment.grant', sig, p_reason);
  insert into public.study_team_assignments (user_id, trial_id) values (p_user, p_trial) returning id into new_id;
  if public.signature_required('assignment.grant') then
    perform public.create_signature('assignment.grant', 'study_team_assignments', new_id, null, sig);
  end if;
  perform public.end_signed_action();
  return new_id;
end $$;

-- Admin, or the Study Manager of that study (own studies only, spec 3).
create or replace function public.assign_site_staff(
  p_user uuid, p_trial uuid, p_site uuid, p_role public.app_role, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(false);
  sig uuid := gen_random_uuid();
  new_id uuid;
begin
  if not public.manages_trial(actor, p_trial) then perform public.app_error('auth.not_allowed'); end if;
  if p_user = actor then perform public.app_error('auth.self_grant_forbidden'); end if;
  if p_role not in ('site_manager', 'crc') then perform public.app_error('assignment.role_not_assignable'); end if;
  if not public.has_role(p_user, p_role) then perform public.app_error('assignment.role_missing'); end if;
  if not exists (select 1 from public.trial_sites where trial_id = p_trial and site_id = p_site) then
    perform public.app_error('assignment.site_not_in_study');
  end if;
  if exists (select 1 from public.site_staff_assignments
              where user_id = p_user and trial_id = p_trial and site_id = p_site and role = p_role and revoked_at is null) then
    perform public.app_error('assignment.already_exists');
  end if;

  perform public.begin_signed_action('assignment.grant', sig, p_reason);
  insert into public.site_staff_assignments (user_id, trial_id, site_id, role)
  values (p_user, p_trial, p_site, p_role) returning id into new_id;
  if public.signature_required('assignment.grant') then
    perform public.create_signature('assignment.grant', 'site_staff_assignments', new_id, null, sig);
  end if;
  perform public.end_signed_action();
  return new_id;
end $$;

create or replace function public.revoke_assignment(p_kind text, p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(false);
  sig uuid := gen_random_uuid();
  target_user uuid;
  target_trial uuid;
  tbl text;
begin
  if p_kind = 'study_team' then
    select user_id, trial_id into target_user, target_trial from public.study_team_assignments where id = p_id and revoked_at is null;
    tbl := 'study_team_assignments';
    if not public.is_admin(actor) then perform public.app_error('auth.not_allowed'); end if;
  elsif p_kind = 'site_staff' then
    select user_id, trial_id into target_user, target_trial from public.site_staff_assignments where id = p_id and revoked_at is null;
    tbl := 'site_staff_assignments';
    if not public.manages_trial(actor, target_trial) then perform public.app_error('auth.not_allowed'); end if;
  else
    perform public.app_error('assignment.unknown_kind');
  end if;
  if target_user is null then perform public.app_error('assignment.not_found'); end if;
  if target_user = actor then perform public.app_error('auth.self_grant_forbidden'); end if;

  perform public.begin_signed_action('assignment.revoke', sig, p_reason);
  if tbl = 'study_team_assignments' then
    update public.study_team_assignments set revoked_at = now() where id = p_id;
  else
    update public.site_staff_assignments set revoked_at = now() where id = p_id;
  end if;
  if public.signature_required('assignment.revoke') then
    perform public.create_signature('assignment.revoke', tbl, p_id, null, sig);
  end if;
  perform public.end_signed_action();
end $$;

-- Suspend or reactivate a user (signed, reasoned). Suspended users cannot sign in.
create or replace function public.set_user_status(p_user uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(true);
  sig uuid := gen_random_uuid();
begin
  if p_user = actor then perform public.app_error('auth.self_grant_forbidden'); end if;
  if p_status not in ('active', 'suspended') then perform public.app_error('user.invalid_status'); end if;
  if not exists (select 1 from public.profiles where id = p_user) then perform public.app_error('user.not_found'); end if;

  perform public.begin_signed_action('user.status_change', sig, p_reason);
  update public.profiles set status = p_status where id = p_user;
  update auth.users set banned_until = case when p_status = 'suspended' then 'infinity'::timestamptz else null end
   where id = p_user;
  if public.signature_required('user.status_change') then
    perform public.create_signature('user.status_change', 'profiles', p_user, null, sig);
  end if;
  perform public.end_signed_action();
end $$;

-- Admin-assisted 2FA reset (spec 17b): signed and reasoned; the user must enrol again at next sign-in.
-- An Admin's own 2FA can only be reset by a different Admin.
create or replace function public.reset_user_mfa(p_user uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(true);
  sig uuid := gen_random_uuid();
begin
  if p_user = actor then perform public.app_error('auth.self_grant_forbidden'); end if;
  if not exists (select 1 from public.profiles where id = p_user) then perform public.app_error('user.not_found'); end if;

  perform public.begin_signed_action('mfa.reset', sig, p_reason);
  delete from auth.mfa_factors where user_id = p_user;
  perform public.audit_write('profiles', p_user::text, 'mfa_reset', '{}'::jsonb,
                             '{}'::jsonb, p_reason, null, sig);
  if public.signature_required('mfa.reset') then
    perform public.create_signature('mfa.reset', 'profiles', p_user, null, sig);
  end if;
  perform public.end_signed_action();
end $$;

-- Create a staff account with its role. Admin creates any staff role; a Study Manager creates
-- Site Managers and CRCs for their own studies and assigns them to a site in the same signed step.
-- Returns a temporary password once; the person must change it at first sign-in.
create or replace function public.create_staff_user(
  p_email text, p_full_name text, p_role public.app_role, p_reason text,
  p_trial uuid default null, p_site uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.require_actor(false);
  new_user uuid := gen_random_uuid();
  temp_password text;
  email_norm text := lower(btrim(p_email));
  role_sig uuid := gen_random_uuid();
  role_row uuid;
  assign_sig uuid := gen_random_uuid();
  assign_row uuid;
begin
  if p_role in ('participant', 'sponsor') then perform public.app_error('role.not_grantable'); end if;

  if public.is_admin(actor) then
    null;
  elsif p_role in ('site_manager', 'crc') and p_trial is not null and p_site is not null
        and public.manages_trial(actor, p_trial) then
    if not exists (select 1 from public.trial_sites where trial_id = p_trial and site_id = p_site) then
      perform public.app_error('assignment.site_not_in_study');
    end if;
  else
    perform public.app_error('auth.not_allowed');
  end if;

  -- permission is checked first so the email check cannot be used to find out who has an account
  if email_norm !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then perform public.app_error('user.invalid_email'); end if;
  if length(btrim(p_full_name)) = 0 then perform public.app_error('user.name_required'); end if;
  if exists (select 1 from auth.users where lower(email) = email_norm) then perform public.app_error('user.email_taken'); end if;

  temp_password := encode(extensions.gen_random_bytes(9), 'hex');

  perform public.begin_signed_action('role.grant', role_sig, p_reason);

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values (
    '00000000-0000-0000-0000-000000000000', new_user, 'authenticated', 'authenticated', email_norm,
    extensions.crypt(temp_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', btrim(p_full_name)), now(), now(),
    '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), new_user, new_user::text,
          jsonb_build_object('sub', new_user::text, 'email', email_norm, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());

  update public.profiles set must_change_password = true, full_name = btrim(p_full_name) where id = new_user;

  insert into public.user_roles (user_id, role) values (new_user, p_role) returning id into role_row;
  if public.signature_required('role.grant') then
    perform public.create_signature('role.grant', 'user_roles', role_row, null, role_sig);
  end if;

  if p_trial is not null and p_site is not null and p_role in ('site_manager', 'crc') then
    perform public.end_signed_action();
    perform public.begin_signed_action('assignment.grant', assign_sig, p_reason);
    insert into public.site_staff_assignments (user_id, trial_id, site_id, role)
    values (new_user, p_trial, p_site, p_role) returning id into assign_row;
    if public.signature_required('assignment.grant') then
      perform public.create_signature('assignment.grant', 'site_staff_assignments', assign_row, null, assign_sig);
    end if;
  end if;
  perform public.end_signed_action();

  return jsonb_build_object('user_id', new_user, 'temporary_password', temp_password);
end $$;

-- A person who has set their own password clears the flag.
create or replace function public.password_changed()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  perform set_config('app.privileged_write', 'on', true);
  update public.profiles set must_change_password = false where id = auth.uid();
  perform set_config('app.privileged_write', '', true);
end $$;

revoke all on function public.require_actor(boolean), public.begin_signed_action(text, uuid, text),
  public.end_signed_action(), public.signable_snapshot(text, uuid), public.snapshot_hash(text, uuid),
  public.signature_reauth_method() from public, anon, authenticated;
grant execute on function
  public.grant_role(uuid, public.app_role, text), public.revoke_role(uuid, text),
  public.assign_study_manager(uuid, uuid, text),
  public.assign_site_staff(uuid, uuid, uuid, public.app_role, text),
  public.revoke_assignment(text, uuid, text), public.set_user_status(uuid, text, text),
  public.reset_user_mfa(uuid, text),
  public.create_staff_user(text, text, public.app_role, text, uuid, uuid),
  public.password_changed()
  to authenticated;

-- my_security_state also reports the forced password change
create or replace function public.my_security_state()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'roles', coalesce((select jsonb_agg(ur.role order by ur.role) from public.user_roles ur
                        where ur.user_id = auth.uid() and ur.revoked_at is null), '[]'::jsonb),
    'mfa_policy', public.effective_mfa_policy(auth.uid()),
    'aal', public.current_aal(),
    'mfa_satisfied', public.mfa_satisfied(),
    'demo_mode', coalesce((select (value)::boolean from public.platform_settings where key = 'demo_mode'), true),
    'must_change_password', coalesce((select must_change_password from public.profiles where id = auth.uid()), false),
    'signature_statement_accepted', exists (select 1 from public.signature_acknowledgements a where a.user_id = auth.uid())
  );
$$;
