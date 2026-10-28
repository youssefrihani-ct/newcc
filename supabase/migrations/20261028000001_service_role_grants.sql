-- Hosted Supabase projects do not grant service_role access to new tables automatically
-- (the local stack does). Server code and the seed script need it. The audit tables stay
-- closed to every API role: they are written only by the audit_write() function.

do $$
declare t record;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relispartition
       and c.relname not like 'audit\_%'
  loop
    execute format('grant select, insert, update on public.%I to service_role', t.relname);
  end loop;
end $$;

-- later migrations: new tables in public are usable by service_role without repeating this
alter default privileges in schema public grant select, insert, update on tables to service_role;
