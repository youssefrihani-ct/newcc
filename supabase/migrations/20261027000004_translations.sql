-- Phase 0 / translation framework: English text is the key, other languages are
-- lookups, the catalogue is loaded at runtime (spec 5d).

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  english_name text not null,
  native_name text not null,
  direction text not null default 'ltr' check (direction = 'ltr'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_default boolean not null default false,
  fallback_code text references public.languages (code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index languages_one_default on public.languages (is_default) where is_default;

create table public.translation_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  context text,
  placeholders text[] not null default '{}',
  source_hash text generated always as (md5(key)) stored,
  last_changed_at timestamptz not null default now(),
  protected_terms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.translations (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references public.languages (code),
  key_id uuid not null references public.translation_keys (id),
  text text not null default '',
  status text not null default 'empty' check (status in ('empty', 'machine', 'human', 'reviewed')),
  translated_by uuid references public.profiles (id),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language_code, key_id)
);
create index translations_key_idx on public.translations (key_id);

create table public.translation_history (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null references public.translations (id),
  old_text text,
  new_text text,
  old_status text,
  new_status text,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.glossary (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references public.languages (code),
  term text not null,
  translation text,
  mode text not null default 'keep' check (mode in ('keep', 'force')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language_code, term)
);

do $$
declare t text;
begin
  foreach t in array array['languages', 'translation_keys', 'translations', 'translation_history', 'glossary'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('create trigger %I before delete on public.%I for each row execute function public.forbid_hard_delete()', t || '_no_delete', t);
    execute format('alter table public.%I enable row level security', t);
    perform public.audit_attach(('public.' || t)::regclass);
  end loop;
end $$;

-- Every change to a translation is kept (spec 5d)
create or replace function public.translations_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.text is distinct from old.text or new.status is distinct from old.status then
    insert into public.translation_history (translation_id, old_text, new_text, old_status, new_status, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.text end, new.text,
            case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid());
  end if;
  return new;
end $$;

create trigger translations_history after insert or update on public.translations
  for each row execute function public.translations_history();

-- A change to the English source marks its translations as stale
create or replace function public.translation_keys_touch()
returns trigger language plpgsql as $$
begin
  if new.key is distinct from old.key then
    new.last_changed_at = now();
  end if;
  return new;
end $$;
create trigger translation_keys_touch before update on public.translation_keys
  for each row execute function public.translation_keys_touch();

-- English (UK) is the source language and the default
insert into public.languages (code, english_name, native_name, status, is_default)
values ('en-GB', 'English (UK)', 'English (UK)', 'published', true);

-- ---------------------------------------------------------------------------
-- Catalogue loaded at runtime. The text is not sensitive, so the login page can read it.
-- Returns only translated strings; the client falls back to the English key itself.
-- ---------------------------------------------------------------------------
create or replace function public.get_catalogue(lang text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  l public.languages%rowtype;
  result jsonb;
begin
  select * into l from public.languages where code = lang;
  if not found then
    return '{}'::jsonb;
  end if;
  -- unpublished languages are visible to translators and Admin only
  if l.status <> 'published'
     and not (auth.uid() is not null and (public.is_translator(auth.uid()) or public.is_admin(auth.uid()))) then
    return '{}'::jsonb;
  end if;

  select coalesce(jsonb_object_agg(k.key, tr.text), '{}'::jsonb) into result
    from public.translations tr
    join public.translation_keys k on k.id = tr.key_id
   where tr.language_code = l.code and tr.status <> 'empty' and tr.text <> '';
  return result;
end $$;

create or replace function public.list_published_languages()
returns table (code text, english_name text, native_name text, is_default boolean)
language sql stable security definer set search_path = '' as $$
  select l.code, l.english_name, l.native_name, l.is_default
    from public.languages l where l.status = 'published' order by l.is_default desc, l.english_name;
$$;

grant execute on function public.get_catalogue(text) to anon, authenticated;
grant execute on function public.list_published_languages() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS: admin and translators edit; nothing sensitive, but writes are gated by 2FA like all settings
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['languages', 'translation_keys', 'translations', 'translation_history', 'glossary'] loop
    execute format($f$create policy %I on public.%I for select to authenticated
      using (public.mfa_satisfied() and (public.is_admin(auth.uid()) or public.is_translator(auth.uid())))$f$,
      t || '_select_editors', t);
    execute format($f$create policy %I on public.%I for all to authenticated
      using (public.mfa_satisfied() and (public.is_admin(auth.uid()) or public.is_translator(auth.uid())))
      with check (public.mfa_satisfied() and (public.is_admin(auth.uid()) or public.is_translator(auth.uid())))$f$,
      t || '_write_editors', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end $$;

-- Publishing a language is Admin only (spec 3: Translator cannot publish unless also Admin)
create or replace function public.guard_language_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null and not public.is_admin(auth.uid()) then
    perform public.app_error('translation.publish_requires_admin');
  end if;
  return new;
end $$;
create trigger languages_guard_publish before update on public.languages
  for each row execute function public.guard_language_publish();
