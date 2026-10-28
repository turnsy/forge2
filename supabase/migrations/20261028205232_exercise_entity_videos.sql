-- Video metadata belongs to the coach's catalog exercise, never to plan JSON.
alter table public.exercises add column video_url text
 check (video_url is null or (length(video_url)<=2048 and video_url ~ '^https?://[^[:space:]]+$'));

-- Existing catalog writes stay restricted; only video metadata can be updated directly.
grant update(video_url) on public.exercises to authenticated;
create policy "exercises: coach update video" on public.exercises for update to authenticated
 using (owner_coach_id=(select auth.uid()) and archived_at is null and exists (
  select 1 from public.profiles where id=(select auth.uid()) and role='coach' and deleted_at is null
 ))
 with check (owner_coach_id=(select auth.uid()) and archived_at is null);

-- Athletes retain access to demonstrations referenced by their assigned history after unlinking.
create policy "exercises: read assigned exercise" on public.exercises for select to authenticated
 using (exists(select 1 from public.assigned_plans a
  where a.athlete_id=(select auth.uid()) and public.plan_uses_exercise(a.plan_data,exercises.id)));

create function public.set_coach_exercise_video(p_exercise_id uuid,p_video_url text)
returns void language plpgsql security invoker set search_path=public as $$
begin
 -- Use the same lock as catalog management, preserving replacement inheritance.
 perform pg_advisory_xact_lock(hashtextextended('exercises:'||auth.uid()::text,0));
 update exercises set video_url=nullif(btrim(p_video_url),'')
 where id=p_exercise_id and owner_coach_id=auth.uid() and archived_at is null;
 if not found then raise exception 'Exercise not found' using errcode='P0002'; end if;
end; $$;
revoke all on function public.set_coach_exercise_video(uuid,text) from public,anon;
grant execute on function public.set_coach_exercise_video(uuid,text) to authenticated;

create or replace function public.manage_coach_exercise(p_exercise_id uuid,p_name text default null,p_replacement_id uuid default null,p_archive boolean default false)
returns void language plpgsql security definer set search_path=public as $$
declare original public.exercises; replacement public.exercises; usage jsonb; normalized text;
begin
 if not exists(select 1 from profiles where id=auth.uid() and role='coach' and deleted_at is null) then raise exception 'Coach required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('exercises:'||auth.uid()::text,0));
 select * into original from exercises where id=p_exercise_id and owner_coach_id=auth.uid() and archived_at is null for update;
 if original.id is null then raise exception 'Exercise not found' using errcode='P0002'; end if;
 if p_archive then
  usage:=coach_exercise_usage(p_exercise_id);
  if p_replacement_id is not null then
   select * into replacement from exercises where id=p_replacement_id and owner_coach_id=auth.uid() and archived_at is null and id<>p_exercise_id;
   if replacement.id is null then raise exception 'Select another exercise from your library' using errcode='22023'; end if;
   -- The replacement owns the inherited video everywhere it is used.
   update exercises set video_url=original.video_url
    where id=replacement.id and video_url is null and original.video_url is not null;
   perform rewrite_coach_exercise_references(auth.uid(),original.id,replacement.id,replacement.name);
  elsif (usage->>'templates')::int>0 or (usage->>'assignments')::int>0 then raise exception 'A replacement is required for exercises still used in plans' using errcode='22023'; end if;
  update exercises set archived_at=clock_timestamp() where id=original.id;
 else
  normalized:=lower(btrim(regexp_replace(p_name,'\s+',' ','g')));
  if normalized is null or normalized='' or length(p_name)>200 then raise exception 'Exercise name required (maximum 200 characters)' using errcode='22023'; end if;
  update exercises set name=btrim(p_name),normalized_name=normalized where id=original.id;
  perform rewrite_coach_exercise_references(auth.uid(),original.id,original.id,btrim(p_name));
 end if;
end; $$;
