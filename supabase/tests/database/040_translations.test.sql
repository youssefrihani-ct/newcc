-- Translation framework (spec 5d): runtime catalogue, fallback, publishing, history.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

create schema tests;
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
  ('00000000-0000-0000-0000-0000000000a2', 'translator@t.test'),
  ('00000000-0000-0000-0000-0000000000a3', 'crc@t.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000a3', 'crc');
insert into public.user_permissions (user_id, permission) values ('00000000-0000-0000-0000-0000000000a2', 'translator');

insert into public.translation_keys (id, key) values
  ('00000000-0000-0000-0000-0000000000f1', 'Approve claim'),
  ('00000000-0000-0000-0000-0000000000f2', '{count} claims waiting');
insert into public.languages (code, english_name, native_name, status) values ('fr-FR', 'French', 'Français', 'draft');
insert into public.translations (language_code, key_id, text, status) values
  ('fr-FR', '00000000-0000-0000-0000-0000000000f1', 'Approuver la demande', 'human'),
  ('fr-FR', '00000000-0000-0000-0000-0000000000f2', '', 'empty');

select is(public.get_catalogue('en-GB'), '{}'::jsonb, 'English has no entries: the key is the text');
select is(public.get_catalogue('fr-FR'), '{}'::jsonb, 'a draft language is hidden from the public');

update public.languages set status = 'published' where code = 'fr-FR';
select is(public.get_catalogue('fr-FR'), '{"Approve claim": "Approuver la demande"}'::jsonb,
  'a published language returns only translated strings (missing ones fall back to English)');
select is(public.get_catalogue('xx-XX'), '{}'::jsonb, 'an unknown language returns nothing');
select is((select count(*) from public.list_published_languages()), 2::bigint, 'two languages are published');

-- anon can load the catalogue (login page)
select ok(has_function_privilege('anon', 'public.get_catalogue(text)', 'execute'), 'anon can load the catalogue');

-- history
select is((select count(*) from public.translation_history), 2::bigint, 'each translation insert writes history');
update public.translations set text = 'Approuver', status = 'reviewed'
 where language_code = 'fr-FR' and key_id = '00000000-0000-0000-0000-0000000000f1';
select is((select count(*) from public.translation_history where old_text = 'Approuver la demande' and new_text = 'Approuver'), 1::bigint, 'an edit writes old and new text to history');

-- who can edit
select ok(tests.can('00000000-0000-0000-0000-0000000000a2', 'aal1', $$update public.translation_keys set context = 'menu' where key = 'Approve claim'$$), 'translator can edit');
select ok(not tests.can('00000000-0000-0000-0000-0000000000a2', 'aal1', $$update public.languages set status = 'draft' where code = 'fr-FR'$$), 'translator cannot unpublish or publish');
select ok(not tests.can('00000000-0000-0000-0000-0000000000a3', 'aal1', $$insert into public.translation_keys (key) values ('x')$$), 'crc cannot edit translations');

select * from finish();
rollback;
