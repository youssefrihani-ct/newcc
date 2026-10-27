-- Audit trail (spec 17c) and schema-wide rules from CLAUDE.md:
-- RLS on every table, audit trigger on every business table, append-only chained log.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- every ordinary public table has RLS enabled (partitions inherit from audit_log)
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relispartition and not c.relrowsecurity
      and c.relname <> 'audit_chain_head' and c.relname <> 'audit_daily_roots'),
  0::bigint, 'RLS is enabled on every public table (chain head and daily roots are not API-reachable)');

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('audit_chain_head', 'audit_daily_roots', 'audit_log')
      and (has_table_privilege('authenticated', c.oid, 'insert') or has_table_privilege('authenticated', c.oid, 'update')
           or has_table_privilege('authenticated', c.oid, 'delete') or has_table_privilege('authenticated', c.oid, 'truncate'))),
  0::bigint, 'authenticated has no write privilege on the audit tables');

-- every business table has the audit trigger and refuses hard delete
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relispartition
      and c.relname not like 'audit\_%'
      and not exists (select 1 from pg_trigger t where t.tgrelid = c.oid and t.tgname = 'audit_row_change')),
  0::bigint, 'every business table has the audit trigger');
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relispartition
      and c.relname not like 'audit\_%'
      and not exists (select 1 from pg_trigger t where t.tgrelid = c.oid and t.tgfoid = 'public.forbid_hard_delete'::regproc)),
  0::bigint, 'every business table refuses hard delete');

-- a change writes an audit row in the same transaction
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'admin@t.test');
insert into public.clients (id, name) values ('00000000-0000-0000-0000-0000000000c1', 'Acme');
update public.clients set name = 'Acme Ltd' where id = '00000000-0000-0000-0000-0000000000c1';

select is((select count(*) from public.audit_log where entity_type = 'clients' and entity_id = '00000000-0000-0000-0000-0000000000c1' and action = 'create'), 1::bigint, 'insert is audited');
select is(
  (select changed_fields -> 'name' ->> 'new' from public.audit_log where entity_type = 'clients' and action = 'update' order by id desc limit 1),
  'Acme Ltd', 'update records the new value');
select is(
  (select changed_fields -> 'name' ->> 'old' from public.audit_log where entity_type = 'clients' and action = 'update' order by id desc limit 1),
  'Acme', 'update records the old value');
select is(
  (select count(*) from public.audit_log where entity_type = 'clients' and action = 'update' and changed_fields ? 'updated_at'),
  0::bigint, 'updated_at alone is not a change');

-- hard delete is refused
select throws_ok($$delete from public.clients where id = '00000000-0000-0000-0000-0000000000c1'$$,
  'P0001', 'record.hard_delete_forbidden', 'hard delete of a business record is refused');

-- the chain verifies
select is((select ok from public.audit_verify_chain()), true, 'hash chain verifies');
select is((select count(distinct id) = count(*) from public.audit_log), true, 'audit ids are unique and sequential');

-- append only, even for the owner
select throws_ok($$update public.audit_log set action = 'x'$$, 'P0001', 'audit.append_only', 'audit rows cannot be updated');
select throws_ok($$delete from public.audit_log$$, 'P0001', 'audit.append_only', 'audit rows cannot be deleted');
select throws_ok($$truncate public.audit_log$$, 'P0001', 'audit.append_only', 'the audit log cannot be truncated');

-- tampering is detected: disable the guard as a superuser would, edit a row, and the chain breaks
do $$
declare part text;
begin
  select tableoid::regclass::text into part from public.audit_log where entity_type = 'clients' and action = 'create' limit 1;
  execute format('alter table %s disable trigger user', part);
  execute format($f$update %s set changed_fields = '{"name":{"new":"Forged"}}' where entity_type = 'clients' and action = 'create'$f$, part);
  execute format('alter table %s enable trigger user', part);
end $$;
select is((select ok from public.audit_verify_chain()), false, 'a tampered row breaks the chain');
select is((select first_break_id from public.audit_verify_chain()),
          (select id from public.audit_log where entity_type = 'clients' and action = 'create'),
          'the integrity check names the tampered row');

select * from finish();
rollback;
