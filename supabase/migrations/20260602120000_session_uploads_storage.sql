-- Ephemeral coach session uploads for coach chat (v1).
-- Object paths: {coach_id}/{session_id}/{slug}.txt

insert into storage.buckets (id, name, public, file_size_limit)
values ('session-uploads', 'session-uploads', false, 26214400)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches insert own session uploads'
  ) then
    create policy "Coaches insert own session uploads"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'session-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches read own session uploads'
  ) then
    create policy "Coaches read own session uploads"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'session-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches delete own session uploads'
  ) then
    create policy "Coaches delete own session uploads"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'session-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches update own session uploads'
  ) then
    create policy "Coaches update own session uploads"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'session-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      )
      with check (
        bucket_id = 'session-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;
end $$;
