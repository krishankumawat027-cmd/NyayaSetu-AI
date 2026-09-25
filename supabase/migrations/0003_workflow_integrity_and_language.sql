alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles add constraint profiles_preferred_language_check
  check (preferred_language in ('en', 'hi', 'hinglish'));

alter table public.legal_queries drop constraint if exists legal_queries_language_check;
alter table public.legal_queries add constraint legal_queries_language_check
  check (language in ('en', 'hi', 'hinglish'));

create unique index if not exists documents_id_user_id_unique on public.documents (id, user_id);
create unique index if not exists roadmaps_id_user_id_unique on public.roadmaps (id, user_id);
create unique index if not exists legal_queries_id_user_id_unique on public.legal_queries (id, user_id);

alter table public.document_analyses drop constraint if exists document_analyses_document_owner_fkey;
alter table public.document_analyses add constraint document_analyses_document_owner_fkey
  foreign key (document_id, user_id) references public.documents (id, user_id) on delete cascade;
create unique index if not exists document_analyses_document_unique on public.document_analyses (document_id);

alter table public.roadmaps drop constraint if exists roadmaps_query_owner_fkey;
alter table public.roadmaps add constraint roadmaps_query_owner_fkey
  foreign key (query_id, user_id) references public.legal_queries (id, user_id) on delete set null (query_id);

alter table public.roadmap_steps drop constraint if exists roadmap_steps_roadmap_owner_fkey;
alter table public.roadmap_steps add constraint roadmap_steps_roadmap_owner_fkey
  foreign key (roadmap_id, user_id) references public.roadmaps (id, user_id) on delete cascade;

alter table public.evidence_items drop constraint if exists evidence_items_roadmap_owner_fkey;
alter table public.evidence_items add constraint evidence_items_roadmap_owner_fkey
  foreign key (roadmap_id, user_id) references public.roadmaps (id, user_id) on delete cascade;

alter table public.roadmap_steps add column if not exists created_at timestamptz not null default now();
alter table public.evidence_items add column if not exists created_at timestamptz not null default now();
alter table public.roadmaps add column if not exists resources jsonb not null default '[]'::jsonb;
alter table public.roadmaps add column if not exists summary jsonb not null default '{}'::jsonb;
create index if not exists legal_queries_user_created_idx on public.legal_queries (user_id, created_at desc);
create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);
create index if not exists roadmaps_user_created_idx on public.roadmaps (user_id, created_at desc);

alter table public.saved_resources add column if not exists source_id text;
alter table public.saved_resources add column if not exists organization text;
alter table public.saved_resources add column if not exists description text;
alter table public.saved_resources add column if not exists category text;
create unique index if not exists saved_resources_user_source_unique on public.saved_resources (user_id, source_id);

drop policy if exists "users update own legal documents" on storage.objects;
create policy "users update own legal documents" on storage.objects for update to authenticated
using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
