-- 2FA enforcement in the database (spec 17b): every staff role whose policy is
-- `required` gets nothing at aal1 and its normal access at aal2.
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

create schema tests;
create function tests.visible(uid uuid, aal text, q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'aal', aal)::text, true);
  execute 'set local role authenticated';
  begin
    execute q into n;
  exception when others then
    n := -1;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return n;
end $$;
create function tests.can(uid uuid, aal text, q text) returns boolean language plpgsql as $$
declare ok boolean := true;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'aal', aal)::text, true);
  execute 'set local role authenticated';
  begin
    execute q;
  exception when others then
    ok := false;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return ok;
end $$;

-- users: one per role
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@t.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'sm@t.test'),
  ('00000000-0000-0000-0000-0000000000a3', 'sitemgr@t.test'),
  ('00000000-0000-0000-0000-0000000000a4', 'crc@t.test'),
  ('00000000-0000-0000-0000-0000000000a5', 'fin@t.test'),
  ('00000000-0000-0000-0000-0000000000a6', 'aud@t.test'),
  ('00000000-0000-0000-0000-0000000000a7', 'pat@t.test');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'study_manager'),
  ('00000000-0000-0000-0000-0000000000a3', 'site_manager'),
  ('00000000-0000-0000-0000-0000000000a4', 'crc'),
  ('00000000-0000-0000-0000-0000000000a5', 'finance'),
  ('00000000-0000-0000-0000-0000000000a6', 'auditor'),
  ('00000000-0000-0000-0000-0000000000a7', 'participant');

insert into public.clients (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Client');
insert into public.sites (id, name) values ('00000000-0000-0000-0000-0000000000b1', 'Site');
insert into public.trials (id, code, title, client_id) values
  ('00000000-0000-0000-0000-0000000000d1', 'T-1', 'Study', '00000000-0000-0000-0000-0000000000c1');
insert into public.trial_sites (trial_id, site_id) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1');
insert into public.study_team_assignments (user_id, trial_id) values
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1');
insert into public.site_staff_assignments (user_id, trial_id, site_id, role) values
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'site_manager'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'crc');
insert into public.finance_scopes (user_id) values ('00000000-0000-0000-0000-0000000000a5');
insert into public.participant_profiles (id, user_id, trial_id, site_id, subject_code) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a7',
   '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'S-001');

-- ---- policy required for every staff role --------------------------------
update public.role_mfa_policies set policy = 'required'
 where role in ('admin', 'study_manager', 'site_manager', 'crc', 'finance', 'auditor');

select is(public.effective_mfa_policy('00000000-0000-0000-0000-0000000000a4'), 'required'::public.mfa_policy,
  'crc effective policy is required');
select is(public.effective_mfa_policy('00000000-0000-0000-0000-0000000000a7'), 'off'::public.mfa_policy,
  'participant has no 2FA');

-- aal1 is refused on every table the role could otherwise reach
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.trials'), 0::bigint, 'admin aal1: trials empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.clients'), 0::bigint, 'admin aal1: clients empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.platform_settings'), 0::bigint, 'admin aal1: settings empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.audit_log'), 0::bigint, 'admin aal1: audit log empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.profiles'), 1::bigint, 'admin aal1: only own profile');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', 'aal1', 'select count(*) from public.trials'), 0::bigint, 'study manager aal1: trials empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', 'aal1', 'select count(*) from public.participant_profiles'), 0::bigint, 'study manager aal1: participants empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a3', 'aal1', 'select count(*) from public.participant_profiles'), 0::bigint, 'site manager aal1: participants empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', 'select count(*) from public.participant_profiles'), 0::bigint, 'crc aal1: participants empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', 'select count(*) from public.sites'), 0::bigint, 'crc aal1: sites empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a5', 'aal1', 'select count(*) from public.trials'), 0::bigint, 'finance aal1: trials empty');
select is(tests.visible('00000000-0000-0000-0000-0000000000a6', 'aal1', 'select count(*) from public.trials'), 0::bigint, 'auditor aal1: trials empty');

-- aal1 cannot write either
select ok(not tests.can('00000000-0000-0000-0000-0000000000a1', 'aal1', $$insert into public.clients (name) values ('x')$$), 'admin aal1: cannot insert');
do $$ begin perform tests.can('00000000-0000-0000-0000-0000000000a1', 'aal1', $q$update public.role_mfa_policies set policy = 'off' where role = 'crc'$q$); end $$;
select is((select policy from public.role_mfa_policies where role = 'crc'), 'required'::public.mfa_policy, 'admin aal1: cannot loosen a 2FA policy');

-- aal1 cannot call security-definer functions that return regulated data
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.audit_verify_chain()'), -1::bigint, 'admin aal1: audit_verify_chain refused');
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal2', 'select count(*) from public.audit_verify_chain()'), 1::bigint, 'admin aal2: audit_verify_chain allowed');

-- the client can still learn what to do at aal1
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', $$select (public.my_security_state() ->> 'mfa_satisfied' = 'false')::int$$), 1::bigint, 'crc aal1: my_security_state says 2FA not satisfied');

-- aal2 gets the normal access
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal2', 'select count(*) from public.trials'), 1::bigint, 'admin aal2: trials visible');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', 'aal2', 'select count(*) from public.trials'), 1::bigint, 'study manager aal2: trials visible');
select is(tests.visible('00000000-0000-0000-0000-0000000000a3', 'aal2', 'select count(*) from public.participant_profiles'), 1::bigint, 'site manager aal2: participants visible');
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal2', 'select count(*) from public.participant_profiles'), 1::bigint, 'crc aal2: participants visible');
select is(tests.visible('00000000-0000-0000-0000-0000000000a5', 'aal2', 'select count(*) from public.trials'), 1::bigint, 'finance aal2: trials visible');
select ok(tests.can('00000000-0000-0000-0000-0000000000a1', 'aal2', $$insert into public.clients (name) values ('x')$$), 'admin aal2: can insert');

-- participants have no 2FA and read themselves at aal1
select is(tests.visible('00000000-0000-0000-0000-0000000000a7', 'aal1', 'select count(*) from public.participant_profiles'), 1::bigint, 'participant aal1: sees own enrolment');

-- ---- policy optional: aal1 is fine ---------------------------------------
update public.role_mfa_policies set policy = 'optional' where role = 'crc';
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', 'select count(*) from public.participant_profiles'), 1::bigint, 'crc optional policy: aal1 allowed');

-- a per-user override can only be stricter than the role policy
update public.profiles set mfa_policy_override = 'required' where id = '00000000-0000-0000-0000-0000000000a4';
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', 'select count(*) from public.participant_profiles'), 0::bigint, 'stricter override: aal1 refused');
select throws_ok(
  $$update public.profiles set mfa_policy_override = 'off' where id = '00000000-0000-0000-0000-0000000000a2'$$,
  'P0001', 'security.mfa_override_must_be_stricter', 'override looser than the role policy is refused');

-- ---- go-live: policies can never be loosened -----------------------------
update public.role_mfa_policies set policy = 'required' where role = 'crc';
update public.platform_settings set value = 'true' where key = 'go_live_signed';
select throws_ok(
  $$update public.role_mfa_policies set policy = 'optional' where role = 'finance'$$,
  'P0001', 'security.mfa_policy_cannot_be_loosened', 'after go-live a staff role cannot be loosened');
select throws_ok(
  $$update public.role_mfa_policies set policy = 'optional' where role = 'crc'$$,
  'P0001', 'security.mfa_policy_cannot_be_loosened', 'after go-live the crc policy cannot be loosened');

-- ---- the helper itself ----------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","aal":"aal1"}', true);
select is(public.mfa_satisfied(), false, 'mfa_satisfied: required + aal1 is false');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","aal":"aal2"}', true);
select is(public.mfa_satisfied(), true, 'mfa_satisfied: required + aal2 is true');
select set_config('request.jwt.claims', '{}', true);
select is(public.mfa_satisfied(), false, 'mfa_satisfied: no user is false');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a7","aal":"aal1"}', true);
select is(public.mfa_satisfied(), true, 'mfa_satisfied: participant (off) is true');

select * from finish();
rollback;
