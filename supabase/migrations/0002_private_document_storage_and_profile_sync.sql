insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('legal-documents', 'legal-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users insert own legal documents" on storage.objects;
drop policy if exists "users read own legal documents" on storage.objects;
drop policy if exists "users delete own legal documents" on storage.objects;
create policy "users insert own legal documents" on storage.objects for insert to authenticated
with check (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own legal documents" on storage.objects for select to authenticated
using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own legal documents" on storage.objects for delete to authenticated
using (bucket_id = 'legal-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do update
    set full_name = excluded.full_name
    where public.profiles.full_name is null and excluded.full_name is not null;
  return new;
end;
$$;

revoke all on function public.create_profile_for_auth_user() from public;
drop trigger if exists create_profile_after_auth_signup on auth.users;
create trigger create_profile_after_auth_signup
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

insert into public.profiles (id, full_name)
select id, nullif(trim(raw_user_meta_data ->> 'full_name'), '')
from auth.users
where nullif(trim(raw_user_meta_data ->> 'full_name'), '') is not null
on conflict (id) do update
  set full_name = excluded.full_name
  where public.profiles.full_name is null;
