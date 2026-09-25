create extension if not exists "pgcrypto";

create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, preferred_language text not null default 'en' check (preferred_language in ('en','hi')), created_at timestamptz not null default now());
create table if not exists public.legal_queries (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, input_redacted text not null, language text not null default 'en', created_at timestamptz not null default now());
create table if not exists public.documents (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, storage_path text not null unique, original_name text not null, mime_type text not null, size_bytes bigint not null, created_at timestamptz not null default now());
create table if not exists public.document_analyses (id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, status text not null default 'processing' check (status in ('processing','complete','failed')), summary jsonb, error_code text, created_at timestamptz not null default now());
create table if not exists public.roadmaps (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, query_id uuid references public.legal_queries(id) on delete set null, title text not null, category text, progress smallint not null default 0 check (progress between 0 and 100), created_at timestamptz not null default now());
create table if not exists public.roadmap_steps (id uuid primary key default gen_random_uuid(), roadmap_id uuid not null references public.roadmaps(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, position smallint not null, title text not null, body text, completed boolean not null default false);
create table if not exists public.evidence_items (id uuid primary key default gen_random_uuid(), roadmap_id uuid not null references public.roadmaps(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, label text not null, completed boolean not null default false);
create table if not exists public.saved_resources (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, source_name text not null, title text not null, url text not null, created_at timestamptz not null default now());

alter table public.profiles enable row level security;
alter table public.legal_queries enable row level security;
alter table public.documents enable row level security;
alter table public.document_analyses enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_steps enable row level security;
alter table public.evidence_items enable row level security;
alter table public.saved_resources enable row level security;

do $$ declare table_name text; begin for table_name in select unnest(array['legal_queries','documents','document_analyses','roadmaps','roadmap_steps','evidence_items','saved_resources']) loop execute format('drop policy if exists user_owns_%1$s on public.%1$s', table_name); execute format('create policy user_owns_%1$s on public.%1$s for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name); end loop; end $$;

create policy profile_owner on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('legal-documents', 'legal-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

create policy "users insert own legal documents" on storage.objects for insert to authenticated
with check (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own legal documents" on storage.objects for select to authenticated
using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own legal documents" on storage.objects for delete to authenticated
using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
