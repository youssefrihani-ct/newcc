-- Scope helpers and RLS per role (spec 3, 17): each role sees only its own scope.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

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

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@t.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'sm1@t.test'),
  ('00000000-0000-0000-0000-0000000000a8', 'sm2@t.test'),
  ('00000000-0000-0000-0000-0000000000a4', 'crc1@t.test'),
  ('00000000-0000-0000-0000-0000000000a9', 'crc2@t.test'),
  ('00000000-0000-0000-0000-0000000000a7', 'pat1@t.test'),
  ('00000000-0000-0000-0000-0000000000aa', 'pat2@t.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000a2', 'study_manager'),
  ('00000000-0000-0000-0000-0000000000a8', 'study_manager'),
  ('00000000-0000-0000-0000-0000000000a4', 'crc'),
  ('00000000-0000-0000-0000-0000000000a9', 'crc'),
  ('00000000-0000-0000-0000-0000000000a7', 'participant'),
  ('00000000-0000-0000-0000-0000000000aa', 'participant');

-- two studies, two sites (one per study)
insert into public.clients (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Client');
insert into public.sites (id, name) values
  ('00000000-0000-0000-0000-0000000000b1', 'Site 1'),
  ('00000000-0000-0000-0000-0000000000b2', 'Site 2');
insert into public.trials (id, code, title, client_id) values
  ('00000000-0000-0000-0000-0000000000d1', 'T-1', 'Study 1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000d2', 'T-2', 'Study 2', '00000000-0000-0000-0000-0000000000c1');
insert into public.trial_sites (trial_id, site_id) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2');
insert into public.study_team_assignments (user_id, trial_id) values
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000d2');
insert into public.site_staff_assignments (user_id, trial_id, site_id, role) values
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'crc'),
  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 'crc');
insert into public.participant_profiles (id, user_id, trial_id, site_id, subject_code) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a7',
   '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'S-001'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000aa',
   '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 'S-001');

-- helpers (called directly, as the server would)
select ok(public.manages_trial('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'), 'admin manages every study');
select ok(public.manages_trial('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d1'), 'study manager manages their study');
select ok(not public.manages_trial('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000d2'), 'study manager does not manage another study');
select ok(not public.manages_trial('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000d1'), 'crc does not manage a study');
select ok(public.manages_site('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000b1'), 'crc manages their site');
select ok(not public.manages_site('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000b2'), 'crc does not manage another site');
select ok(public.manages_site('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b1'), 'study manager manages sites of their study');
select ok(public.manages_participant('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000e1'), 'participant manages themself');
select ok(not public.manages_participant('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000e2'), 'participant cannot reach another participant');
select ok(not public.manages_participant('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000e1'), 'crc cannot reach a participant of another site');

-- RLS driven by the helpers
select is(tests.visible('00000000-0000-0000-0000-0000000000a1', 'aal1', 'select count(*) from public.trials'), 2::bigint, 'admin sees both studies');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', 'aal1', 'select count(*) from public.trials'), 1::bigint, 'study manager sees only their study');
select is(tests.visible('00000000-0000-0000-0000-0000000000a2', 'aal1', 'select count(*) from public.participant_profiles'), 1::bigint, 'study manager sees only their participants');
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', 'select count(*) from public.sites'), 1::bigint, 'crc sees only their site');
select is(tests.visible('00000000-0000-0000-0000-0000000000a4', 'aal1', 'select count(*) from public.participant_profiles'), 1::bigint, 'crc sees only their site participants');
select is(tests.visible('00000000-0000-0000-0000-0000000000a7', 'aal1', 'select count(*) from public.participant_profiles'), 1::bigint, 'participant sees only themself');
select is(tests.visible('00000000-0000-0000-0000-0000000000a7', 'aal1', 'select count(*) from public.trials'), 1::bigint, 'participant sees only their study');

-- writes
do $$ begin
  perform tests.can('00000000-0000-0000-0000-0000000000a7', 'aal1', $q$update public.participant_profiles set status = 'completed' where id = '00000000-0000-0000-0000-0000000000e1'$q$);
end $$;
select is((select status from public.participant_profiles where id = '00000000-0000-0000-0000-0000000000e1'), 'invited', 'participant cannot edit their enrolment');
select ok(not tests.can('00000000-0000-0000-0000-0000000000a2', 'aal1', $$insert into public.trials (code, title) values ('T-9', 'x')$$), 'study manager cannot create studies');
select ok(tests.can('00000000-0000-0000-0000-0000000000a2', 'aal1', $$insert into public.site_staff_assignments (user_id, trial_id, site_id, role) values ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'crc')$$), 'study manager assigns a crc inside their study');
select ok(not tests.can('00000000-0000-0000-0000-0000000000a2', 'aal1', $$insert into public.site_staff_assignments (user_id, trial_id, site_id, role) values ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 'crc')$$), 'study manager cannot assign staff in another study');

select * from finish();
rollback;
