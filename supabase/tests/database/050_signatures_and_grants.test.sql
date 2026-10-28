-- Phase 1: signature engine (spec 17d), signed role and assignment grants,
-- staff user creation, and Study Manager scoping of people (spec 3).
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

create schema tests;

create function tests.claims(uid uuid, aal text, age_secs int, totp boolean) returns text language sql as $$
  select jsonb_build_object('sub', uid, 'role', 'authenticated', 'aal', aal,
    'amr', jsonb_build_array(jsonb_build_object('method', 'password',
              'timestamp', extract(epoch from now())::bigint - age_secs))
           || case when totp then jsonb_build_array(jsonb_build_object('method', 'totp',
              'timestamp', extract(epoch from now())::bigint - age_secs)) else '[]'::jsonb end)::text;
$$;

-- run a statement as a user; returns 'ok' or the error message (a message code)
create function tests.call(uid uuid, q text, aal text default 'aal1', age_secs int default 0, totp boolean default false)
returns text language plpgsql as $$
declare res text := 'ok';
begin
  perform set_config('request.jwt.claims', tests.claims(uid, aal, age_secs, totp), true);
  execute 'set local role authenticated';
  begin
    execute q;
  exception when others then
    res := sqlerrm;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  return res;
end $$;

create function tests.visible(uid uuid, q text, aal text default 'aal1') returns bigint language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claims', tests.claims(uid, aal, 0, false), true);
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

-- people: admin, second admin, study managers of two studies, site manager, crcs, finance, participant
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@t.test'),
  ('00000000-0000-0000-0000-0000000000b0', 'admin2@t.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'sm1@t.test'),
  ('00000000-0000-0000-0000-0000000000a8', 'sm2@t.test'),
  ('00000000-0000-0000-0000-0000000000a3', 'sitemgr@t.test'),
  ('00000000-0000-0000-0000-0000000000a4', 'crc1@t.test'),
  ('00000000-0000-0000-0000-0000000000a9', 'crc2@t.test'),
  ('00000000-0000-0000-0000-0000000000a5', 'fin@t.test'),
  ('00000000-0000-0000-0000-0000000000a7', 'pat@t.test'),
  ('00000000-0000-0000-0000-0000000000ab', 'newcrc@t.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000b0', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'study_manager'),
  ('00000000-0000-0000-0000-0000000000a8', 'study_manager'),
  ('00000000-0000-0000-0000-0000000000a3', 'site_manager'),
  ('00000000-0000-0000-0000-0000000000a4', 'crc'),
  ('00000000-0000-0000-0000-0000000000a9', 'crc'),
  ('00000000-0000-0000-0000-0000000000a5', 'finance'),
  ('00000000-0000-0000-0000-0000000000a7', 'participant');
insert into public.clients (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Client');
insert into public.sites (id, name) values
  ('00000000-0000-0000-0000-0000000000f1', 'Site 1'),
  ('00000000-0000-0000-0000-0000000000f2', 'Site 2');
insert into public.trials (id, code, title, client_id) values
  ('00000000-0000-0000-0000-0000000000d1', 'T-1', 'Study 1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000d2', 'T-2', 'Study 2', '00000000-0000-0000-0000-0000000000c1');
insert into public.trial_sites (trial_id, site_id) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f2');
insert into public.study_team_assignments (user_id, trial_id) values
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000d2');
insert into public.site_staff_assignments (user_id, trial_id, site_id, role) values
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'site_manager'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc'),
  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f2', 'crc');

-- ---- signature policy -----------------------------------------------------
select is((select required from public.signature_policies where action = 'role.grant'), true, 'role grants require a signature by default');
select ok((select count(*) from public.signature_policies) >= 20, 'the policy table carries the spec 17d defaults');

-- ---- first use: the statement must be accepted ---------------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'auditor', 'access review')$$),
  'signature.statement_not_accepted', 'signing before accepting the statement is refused');
select is(tests.call('00000000-0000-0000-0000-0000000000a1', 'select public.accept_signature_statement()'), 'ok', 'admin accepts the statement');

-- ---- re-authentication is checked in the database -------------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'auditor', 'access review')$$, 'aal1', 600),
  'signature.reauth_required', 'a password entered 10 minutes ago does not count: an open session is never enough');

select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'auditor', 'access review')$$),
  'ok', 'a fresh password signs the grant');
select is((select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a5' and role = 'auditor' and revoked_at is null), 1::bigint, 'the role was granted');
select is((select count(*) from public.signatures where record_type = 'user_roles' and action = 'role.grant'), 1::bigint, 'one signature was recorded');
select is((select content_hash from public.signatures where action = 'role.grant'),
          (select public.snapshot_hash('user_roles', record_id) from public.signatures where action = 'role.grant'),
          'the signature is bound to the content of the record');
select is((select meaning || '/' || full_name || '/' || auth_method from public.signatures where action = 'role.grant'),
          'approved//password', 'the signature carries meaning, signer name and authentication method');
select is((select count(*) from public.audit_log where entity_type = 'user_roles' and action = 'create'
            and signature_id = (select id from public.signatures where action = 'role.grant')
            and reason = 'access review'), 1::bigint, 'the audit entry links the signature and the reason');

-- enrolled users need the 2FA code as well
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a1', 'x', 'totp', 'verified', now(), now(), 'x');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a4', 'auditor', 'access review')$$),
  'signature.reauth_code_required', 'an enrolled admin must also enter the 2FA code to sign');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a4', 'auditor', 'access review')$$, 'aal2', 0, true),
  'ok', 'password plus 2FA code signs');
delete from auth.mfa_factors where user_id = '00000000-0000-0000-0000-0000000000a1';

-- ---- who may grant --------------------------------------------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a1', 'finance', 'self')$$),
  'auth.self_grant_forbidden', 'nobody grants themselves a role');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'finance', 'x')$$),
  'auth.not_allowed', 'a study manager cannot grant platform roles');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'participant', 'x')$$),
  'role.not_grantable', 'participant is not a grantable staff role');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'crc', '  ')$$),
  'reason.required', 'a grant needs a reason');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000a5', 'crc')$$) <> 'ok', true,
  'a direct insert into user_roles is refused: grants go through the signed RPC');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$insert into public.site_staff_assignments (user_id, trial_id, site_id, role) values ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc')$$) <> 'ok', true,
  'a direct insert into assignments is refused');

-- ---- signatures are immutable and supersede -------------------------------
select throws_ok($$update public.signatures set full_name = 'Forged'$$, 'P0001', 'signature.immutable', 'a signature cannot be edited');
select throws_ok($$delete from public.signatures$$, 'P0001', 'record.hard_delete_forbidden', 'a signature cannot be deleted');

select is((select is_current from public.signatures_for('user_roles',
  (select record_id from public.signatures where action = 'role.grant' order by signed_at limit 1)) limit 1), null,
  'signatures_for returns nothing without a signed-in session');
select set_config('request.jwt.claims', tests.claims('00000000-0000-0000-0000-0000000000a1', 'aal1', 0, false), true);
select is((select count(*) from public.signatures_for('user_roles',
  (select record_id from public.signatures where action = 'role.grant' order by signed_at limit 1))), 1::bigint, 'the signature manifest lists the signature');
-- changing the signed record makes the signature show as no longer current
update public.user_roles set role = 'study_manager' where id = (select record_id from public.signatures where action = 'role.grant' order by signed_at limit 1);
select is((select is_current from public.signatures_for('user_roles',
  (select record_id from public.signatures where action = 'role.grant' order by signed_at limit 1)) limit 1), false,
  'after the record changed, the old signature is not current');
select set_config('request.jwt.claims', '', true);

-- ---- failed attempts lock signing -----------------------------------------
do $$ begin for i in 1..5 loop perform tests.call('00000000-0000-0000-0000-0000000000b0', $q$select public.log_signature_attempt('failed', 'wrong password')$q$); end loop; end $$;
do $$ begin perform tests.call('00000000-0000-0000-0000-0000000000b0', $q$select public.accept_signature_statement()$q$); end $$;
select is(tests.call('00000000-0000-0000-0000-0000000000b0',
  $$select public.grant_role('00000000-0000-0000-0000-0000000000a5', 'crc', 'x')$$),
  'signature.locked', 'five failed attempts lock signing');

-- ---- revoking ---------------------------------------------------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.revoke_role((select id from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a1' and role = 'admin'), 'x')$$),
  'auth.self_grant_forbidden', 'you cannot revoke your own role');
update public.user_roles set revoked_at = now() where user_id = '00000000-0000-0000-0000-0000000000b0' and role = 'admin';
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.revoke_role((select id from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a5' and role = 'finance' and revoked_at is null), 'left the team')$$),
  'ok', 'admin revokes a role with a signature');
select is((select count(*) from public.audit_log where entity_type = 'user_roles' and action = 'revoke' and reason = 'left the team'), 1::bigint, 'the revoke is audited with its reason');
update public.user_roles set revoked_at = null where user_id = '00000000-0000-0000-0000-0000000000b0' and role = 'admin';

-- ---- assignments: Study Manager scoping ----------------------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc', 'cover')$$),
  'signature.statement_not_accepted', 'the study manager has not accepted the signature statement yet');
do $$ begin perform tests.call('00000000-0000-0000-0000-0000000000a2', $q$select public.accept_signature_statement()$q$); end $$;
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc', 'cover')$$),
  'ok', 'a study manager assigns a crc inside their own study');
select is((select count(*) from public.signatures where action = 'assignment.grant'), 1::bigint, 'the assignment is signed');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f2', 'crc', 'x')$$),
  'auth.not_allowed', 'a study manager cannot assign staff in another study');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f2', 'crc', 'x')$$),
  'assignment.site_not_in_study', 'the site must belong to the study');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc', 'x')$$),
  'assignment.role_missing', 'the person must hold the role first');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc', 'again')$$),
  'assignment.already_exists', 'a duplicate assignment is refused');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.assign_study_manager('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000d1', 'x')$$),
  'auth.not_allowed', 'only an admin assigns study managers');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.assign_study_manager('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000d1', 'second study')$$),
  'ok', 'admin assigns a study manager to a study');
select is(tests.call('00000000-0000-0000-0000-0000000000a3',
  $$select public.assign_site_staff('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1', 'crc', 'x')$$),
  'auth.not_allowed', 'a site manager cannot assign staff');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.revoke_assignment('site_staff', (select id from public.site_staff_assignments where user_id = '00000000-0000-0000-0000-0000000000a9' and trial_id = '00000000-0000-0000-0000-0000000000d1' and revoked_at is null), 'moved site')$$),
  'ok', 'a study manager ends an assignment in their own study');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.revoke_assignment('site_staff', (select id from public.site_staff_assignments where user_id = '00000000-0000-0000-0000-0000000000a9' and trial_id = '00000000-0000-0000-0000-0000000000d2' and revoked_at is null), 'x')$$),
  'auth.not_allowed', 'a study manager cannot end an assignment in another study');

-- ---- who can see whom -----------------------------------------------------
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a4'$$), 1::bigint, 'study manager sees the crc of their study');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a3'$$), 1::bigint, 'study manager sees the site manager of their study');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a5'$$), 0::bigint, 'study manager does not see finance');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'$$), 0::bigint, 'study manager does not see the admin');
select is(tests.visible('00000000-0000-0000-0000-0000000000a8', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a4'$$), 1::bigint, 'the second study manager sees the crc of the study they now also manage');
select is(tests.visible('00000000-0000-0000-0000-0000000000a3', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a4'$$), 1::bigint, 'site manager sees the crc of their site');
select is(tests.visible('00000000-0000-0000-0000-0000000000a3', $$select count(*) from public.profiles where id = '00000000-0000-0000-0000-0000000000a9'$$), 0::bigint, 'site manager does not see staff of another site');
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', $$select count(*) from public.profiles$$), 1::bigint, 'a crc sees only themself');
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', $$select count(*) from public.profiles$$, 'aal2'), (select count(*) from public.profiles), 'admin sees every profile');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', $$select count(*) from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a5'$$), 0::bigint, 'study manager does not see the roles of someone outside their studies');

-- ---- creating staff -------------------------------------------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.create_staff_user('newcrc@t.test', 'New Crc', 'finance', 'x', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1')$$),
  'auth.not_allowed', 'a study manager cannot create finance users');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.create_staff_user('new2@t.test', 'New Two', 'crc', 'x', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f2')$$),
  'auth.not_allowed', 'a study manager cannot create staff for another study');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.create_staff_user('crc1@t.test', 'Dup', 'crc', 'x', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1')$$),
  'user.email_taken', 'an email already in use is refused');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.create_staff_user('not-an-email', 'Bad', 'crc', 'x', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1')$$),
  'user.invalid_email', 'an invalid email is refused');
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.create_staff_user('fresh.crc@t.test', 'Fresh Crc', 'crc', 'new site coordinator', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f1')$$),
  'ok', 'a study manager creates and assigns a crc for their own study');
select is((select count(*) from auth.users where email = 'fresh.crc@t.test'), 1::bigint, 'the account exists');
select is((select count(*) from auth.identities where provider_id = (select id::text from auth.users where email = 'fresh.crc@t.test')), 1::bigint, 'the email identity exists');
select is((select must_change_password from public.profiles where email = 'fresh.crc@t.test'), true, 'the new user must change the temporary password');
select is((select count(*) from public.site_staff_assignments where user_id = (select id from auth.users where email = 'fresh.crc@t.test') and role = 'crc' and revoked_at is null), 1::bigint, 'the assignment exists');
select is((select count(*) from public.signatures s where s.record_id in (
    select id from public.user_roles where user_id = (select id from auth.users where email = 'fresh.crc@t.test')
    union all select id from public.site_staff_assignments where user_id = (select id from auth.users where email = 'fresh.crc@t.test'))), 2::bigint,
  'the role grant and the assignment are each signed');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.create_staff_user('fin2@t.test', 'Fin Two', 'finance', 'new finance lead')$$), 'ok', 'admin creates a finance user');
select is((select (encrypted_password = extensions.crypt('wrong', encrypted_password)) from auth.users where email = 'fin2@t.test'), false, 'the stored password is a hash');

-- ---- status, 2FA reset, password flag, profile guard ----------------------
select is(tests.call('00000000-0000-0000-0000-0000000000a2',
  $$select public.set_user_status('00000000-0000-0000-0000-0000000000a4', 'suspended', 'x')$$), 'auth.not_allowed', 'only an admin suspends users');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.set_user_status('00000000-0000-0000-0000-0000000000a1', 'suspended', 'x')$$), 'auth.self_grant_forbidden', 'you cannot suspend yourself');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.set_user_status('00000000-0000-0000-0000-0000000000a9', 'suspended', 'left the study')$$), 'ok', 'admin suspends a user with a signature');
select is((select status from public.profiles where id = '00000000-0000-0000-0000-0000000000a9'), 'suspended', 'the profile is suspended');
select ok((select banned_until from auth.users where id = '00000000-0000-0000-0000-0000000000a9') is not null, 'a suspended user cannot sign in');

insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000a4', 'x', 'totp', 'verified', now(), now(), 'x');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.reset_user_mfa('00000000-0000-0000-0000-0000000000a1', 'x')$$), 'auth.self_grant_forbidden', 'an admin cannot reset their own 2FA');
select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$select public.reset_user_mfa('00000000-0000-0000-0000-0000000000a4', 'lost phone, identity verified by phone call')$$), 'ok', 'a different admin resets 2FA with a reason');
select is((select count(*) from auth.mfa_factors where user_id = '00000000-0000-0000-0000-0000000000a4'), 0::bigint, 'the 2FA factor is removed');
select is((select count(*) from public.audit_log where entity_type = 'profiles' and action = 'mfa_reset'), 1::bigint, 'the reset is audited');

select is(tests.call('00000000-0000-0000-0000-0000000000a1',
  $$update public.profiles set status = 'archived' where id = '00000000-0000-0000-0000-0000000000a5'$$), 'profile.field_not_editable', 'status cannot be edited directly, even by an admin');
update public.profiles set must_change_password = true where id = '00000000-0000-0000-0000-0000000000a4';
select is(tests.call('00000000-0000-0000-0000-0000000000a4',
  $$update public.profiles set must_change_password = false where id = '00000000-0000-0000-0000-0000000000a4'$$), 'profile.field_not_editable', 'a user cannot clear the password flag directly');
select is(tests.call('00000000-0000-0000-0000-0000000000a4', 'select public.password_changed()'), 'ok', 'password_changed clears the flag');
select is((select must_change_password from public.profiles where id = '00000000-0000-0000-0000-0000000000a4'), false, 'the flag is cleared');

-- exports are audited
select is(tests.call('00000000-0000-0000-0000-0000000000a1', $$select public.log_export('users', 3, '{"q":"x"}'::jsonb)$$), 'ok', 'an export can be reported');
select is((select count(*) from public.audit_log where entity_type = 'export' and action = 'export' and entity_id = 'users' and actor_name is not null), 1::bigint, 'the export is in the audit log with the actor');

-- the audit chain still verifies after all of this
select is((select ok from public.audit_verify_chain()), true, 'the audit hash chain verifies after signed actions');

select * from finish();
rollback;
