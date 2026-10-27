-- Phase 0 / audit trail: append-only, hash-chained, written by trigger in the
-- same transaction as the change (spec 17c).

-- Single-row chain head. Locking it serialises writers so the chain has no forks.
create table public.audit_chain_head (
  id boolean primary key default true check (id),
  last_id bigint not null default 0,
  last_hash text not null default repeat('0', 64)
);
insert into public.audit_chain_head default values;

create sequence public.audit_log_id_seq;

create table public.audit_log (
  id bigint not null,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_name text,
  actor_role text,
  on_behalf_of uuid,
  session_id text,
  ip_address text,
  user_agent text,
  source text not null default 'api' check (source in ('ui', 'api', 'chat', 'integration', 'system')),
  scope_client_id uuid,
  scope_trial_id uuid,
  scope_site_id uuid,
  scope_participant_id uuid,
  entity_type text not null,
  entity_id text,
  action text not null,
  changed_fields jsonb not null default '{}'::jsonb,
  reason text,
  reason_code text,
  signature_id uuid,
  request_id text,
  prev_hash text not null,
  hash text not null,
  primary key (id, occurred_at)
) partition by range (occurred_at);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_actor_idx on public.audit_log (actor_id);
create index audit_log_trial_idx on public.audit_log (scope_trial_id);

-- Daily root hash stored separately (spec 17c)
create table public.audit_daily_roots (
  day date primary key,
  last_id bigint not null,
  root_hash text not null,
  stored_at timestamptz not null default now()
);

-- Append-only: block UPDATE, DELETE and TRUNCATE for every role, superusers included.
create or replace function public.audit_block_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit.append_only' using errcode = 'P0001';
end $$;

create or replace function public.audit_ensure_partition(month_start date)
returns void language plpgsql as $$
declare
  part text := 'audit_log_' || to_char(month_start, 'YYYY_MM');
begin
  if to_regclass('public.' || part) is null then
    execute format('create table public.%I partition of public.audit_log for values from (%L) to (%L)',
                   part, month_start, (month_start + interval '1 month')::date);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.audit_block_mutation()',
                   part || '_no_mutate', part);
    execute format('create trigger %I before truncate on public.%I for each statement execute function public.audit_block_mutation()',
                   part || '_no_truncate', part);
    execute format('revoke all on public.%I from public, anon, authenticated, service_role', part);
  end if;
end $$;

-- 36 months from the start of the year; a scheduled job keeps adding months later.
do $$
declare m date := date_trunc('year', now())::date;
begin
  for i in 0..35 loop
    perform public.audit_ensure_partition((m + make_interval(months => i))::date);
  end loop;
end $$;

create table public.audit_log_default partition of public.audit_log default;
create trigger audit_log_default_no_mutate before update or delete on public.audit_log_default
  for each row execute function public.audit_block_mutation();
create trigger audit_log_default_no_truncate before truncate on public.audit_log_default
  for each statement execute function public.audit_block_mutation();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_block_mutation();

revoke all on public.audit_log, public.audit_log_default, public.audit_chain_head, public.audit_daily_roots
  from public, anon, authenticated, service_role;
revoke all on sequence public.audit_log_id_seq from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Hash: covers the row content and the previous row's hash.
-- ---------------------------------------------------------------------------
create or replace function public.audit_compute_hash(
  p_id bigint, p_occurred_at timestamptz, p_actor_id uuid, p_actor_role text,
  p_entity_type text, p_entity_id text, p_action text, p_changed jsonb,
  p_reason text, p_prev_hash text)
returns text language sql stable as $$
  select encode(extensions.digest(convert_to(concat_ws('|',
    p_id::text,
    to_char(p_occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    coalesce(p_actor_id::text, ''),
    coalesce(p_actor_role, ''),
    p_entity_type,
    coalesce(p_entity_id, ''),
    p_action,
    p_changed::text,
    coalesce(p_reason, ''),
    p_prev_hash), 'utf8'), 'sha256'), 'hex');
$$;

-- The one writer. Not granted to API roles: reached only from triggers and server code.
create or replace function public.audit_write(
  p_entity_type text, p_entity_id text, p_action text, p_changed jsonb,
  p_scope jsonb default '{}'::jsonb, p_reason text default null,
  p_reason_code text default null, p_signature_id uuid default null,
  p_source text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  head public.audit_chain_head%rowtype;
  new_id bigint;
  ts timestamptz := clock_timestamp();
  uid uuid := auth.uid();
  headers json := nullif(current_setting('request.headers', true), '')::json;
  new_hash text;
  src text;
  role_text text;
  name_text text;
begin
  select * into head from public.audit_chain_head where id for update;
  new_id := head.last_id + 1;

  if uid is not null then
    select string_agg(ur.role::text, ',' order by ur.role) into role_text
      from public.user_roles ur where ur.user_id = uid and ur.revoked_at is null;
    select pr.full_name into name_text from public.profiles pr where pr.id = uid;
  end if;

  src := coalesce(p_source, nullif(current_setting('app.audit_source', true), ''),
                  case when headers is not null then 'api' else 'system' end);

  new_hash := public.audit_compute_hash(new_id, ts, uid, role_text, p_entity_type, p_entity_id,
                                        p_action, coalesce(p_changed, '{}'::jsonb),
                                        coalesce(p_reason, nullif(current_setting('app.audit_reason', true), '')),
                                        head.last_hash);

  insert into public.audit_log (
    id, occurred_at, actor_id, actor_name, actor_role, session_id, ip_address, user_agent, source,
    scope_client_id, scope_trial_id, scope_site_id, scope_participant_id,
    entity_type, entity_id, action, changed_fields, reason, reason_code, signature_id, request_id,
    prev_hash, hash)
  values (
    new_id, ts, uid, name_text, role_text,
    nullif(auth.jwt() ->> 'session_id', ''),
    split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1),
    headers ->> 'user-agent', src,
    nullif(p_scope ->> 'client_id', '')::uuid, nullif(p_scope ->> 'trial_id', '')::uuid,
    nullif(p_scope ->> 'site_id', '')::uuid, nullif(p_scope ->> 'participant_id', '')::uuid,
    p_entity_type, p_entity_id, p_action, coalesce(p_changed, '{}'::jsonb),
    coalesce(p_reason, nullif(current_setting('app.audit_reason', true), '')),
    p_reason_code, p_signature_id,
    coalesce(headers ->> 'x-request-id', headers ->> 'x-correlation-id'),
    head.last_hash, new_hash);

  update public.audit_chain_head set last_id = new_id, last_hash = new_hash where id;
  return new_id;
end $$;

revoke all on function public.audit_write(text, text, text, jsonb, jsonb, text, text, uuid, text)
  from public, anon, authenticated;

-- Generic row trigger: every business table gets this in the migration that creates it.
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

  perform public.audit_write(tg_table_name, rowj ->> 'id', act, changed, scope);
  return coalesce(new, old);
end $$;

-- Attach audit + no-hard-delete to a business table in one call from a migration.
create or replace function public.audit_attach(tbl regclass)
returns void language plpgsql as $$
begin
  execute format('create trigger audit_row_change after insert or update or delete on %s for each row execute function public.audit_row_change()', tbl);
end $$;

-- ---------------------------------------------------------------------------
-- Integrity check and daily root
-- ---------------------------------------------------------------------------
create or replace function public.audit_verify_chain(from_id bigint default 1)
returns table (ok boolean, checked bigint, first_break_id bigint)
language plpgsql security definer set search_path = '' as $$
declare
  r public.audit_log%rowtype;
  expected_prev text;
  n bigint := 0;
begin
  if auth.uid() is not null and not (public.is_admin(auth.uid()) and public.mfa_satisfied()) then
    perform public.app_error('audit.not_allowed');
  end if;

  select a.hash into expected_prev from public.audit_log a where a.id = from_id - 1 limit 1;
  expected_prev := coalesce(expected_prev, repeat('0', 64));

  for r in select * from public.audit_log a where a.id >= from_id order by a.id loop
    n := n + 1;
    if r.prev_hash <> expected_prev
       or r.hash <> public.audit_compute_hash(r.id, r.occurred_at, r.actor_id, r.actor_role,
            r.entity_type, r.entity_id, r.action, r.changed_fields, r.reason, r.prev_hash) then
      return query select false, n, r.id;
      return;
    end if;
    expected_prev := r.hash;
  end loop;
  return query select true, n, null::bigint;
end $$;

create or replace function public.audit_store_daily_root(p_day date default (now() at time zone 'UTC')::date - 1)
returns void language plpgsql security definer set search_path = '' as $$
declare
  rec record;
begin
  select a.id, a.hash into rec from public.audit_log a
   where a.occurred_at < (p_day + 1)::timestamp at time zone 'UTC'
   order by a.id desc limit 1;
  if rec.id is not null then
    insert into public.audit_daily_roots (day, last_id, root_hash)
    values (p_day, rec.id, rec.hash) on conflict (day) do nothing;
  end if;
end $$;

revoke all on function public.audit_store_daily_root(date) from public, anon, authenticated;
grant execute on function public.audit_verify_chain(bigint) to authenticated;

-- Read access: Admin only for now (the read-only auditor arrives with its phase).
-- Revoked table privileges above are restored for SELECT through RLS.
alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;
create policy audit_log_select_admin on public.audit_log for select to authenticated
  using (public.is_admin(auth.uid()) and public.mfa_satisfied());

-- ---------------------------------------------------------------------------
-- Attach to every business table created so far
-- ---------------------------------------------------------------------------
select public.audit_attach('public.profiles');
select public.audit_attach('public.user_roles');
select public.audit_attach('public.user_permissions');
select public.audit_attach('public.role_mfa_policies');
select public.audit_attach('public.platform_settings');
select public.audit_attach('public.clients');
select public.audit_attach('public.sites');
select public.audit_attach('public.trials');
select public.audit_attach('public.trial_sites');
select public.audit_attach('public.study_team_assignments');
select public.audit_attach('public.site_staff_assignments');
select public.audit_attach('public.finance_scopes');
select public.audit_attach('public.participant_profiles');
