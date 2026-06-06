-- Ephemeral coach upload context for plan generation (v1).
-- Object paths: {coach_id}/{draft_id}/{slug}.txt

insert into storage.buckets (id, name, public, file_size_limit)
values ('draft-uploads', 'draft-uploads', false, 26214400)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches insert own draft uploads'
  ) then
    create policy "Coaches insert own draft uploads"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'draft-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches read own draft uploads'
  ) then
    create policy "Coaches read own draft uploads"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'draft-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches delete own draft uploads'
  ) then
    create policy "Coaches delete own draft uploads"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'draft-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Coaches update own draft uploads'
  ) then
    create policy "Coaches update own draft uploads"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'draft-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      )
      with check (
        bucket_id = 'draft-uploads'
        and (storage.foldername(name))[1] = (select auth.uid()::text)
      );
  end if;
end $$;
