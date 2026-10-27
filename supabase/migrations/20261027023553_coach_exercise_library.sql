alter table public.exercises add column archived_at timestamptz,
 add column template_exercise_id uuid references public.exercises(id);
create index exercises_owner_active_idx on public.exercises(owner_coach_id,name,id) where archived_at is null;
create index exercises_template_idx on public.exercises(template_exercise_id) where template_exercise_id is not null;
drop index public.exercises_global_or_owner_name_idx;
create unique index exercises_global_or_owner_name_idx on public.exercises
 (coalesce(owner_coach_id,'00000000-0000-0000-0000-000000000000'::uuid),normalized_name) where archived_at is null;

create function public.plan_uses_exercise(p_plan jsonb,p_id uuid) returns boolean language sql immutable set search_path=public as $$
 select jsonb_path_exists(p_plan,'$.weeks[*].days[*].blocks[*].exercises[*] ? (@.resolvedExerciseId == $id || @.resolvedBasisExerciseId == $id)',jsonb_build_object('id',p_id::text));
$$;

-- Split partly logged exercises so existing source IDs/actuals stay intact.
create function public.replace_plan_exercise(p_plan jsonb,p_old uuid,p_new uuid,p_name text,p_preserve_logged boolean)
returns jsonb language plpgsql set search_path=public as $$
declare w jsonb; d jsonb; b jsonb; e jsonb; s jsonb; changed jsonb;
 weeks jsonb:='[]'; days jsonb; blocks jsonb; exercises jsonb; past jsonb; future jsonb;
begin
 for w in select value from jsonb_array_elements(p_plan->'weeks') loop
  days:='[]';
  for d in select value from jsonb_array_elements(w->'days') loop
   blocks:='[]';
   for b in select value from jsonb_array_elements(d->'blocks') loop
    exercises:='[]';
    for e in select value from jsonb_array_elements(b->'exercises') loop
     if e->>'resolvedExerciseId'=p_old::text or e->>'resolvedBasisExerciseId'=p_old::text then
      past:='[]'; future:='[]';
      for s in select value from jsonb_array_elements(e->'sets') loop
       if p_preserve_logged and (s->>'status'<>'planned' or (s->'actual' is not null and s->'actual'<>'null'::jsonb))
        then past:=past||jsonb_build_array(s); else future:=future||jsonb_build_array(s); end if;
      end loop;
      if jsonb_array_length(past)>0 then exercises:=exercises||jsonb_build_array(jsonb_set(e,'{sets}',past)); end if;
      if jsonb_array_length(future)>0 then
       changed:=jsonb_set(e,'{sets}',future);
       if jsonb_array_length(past)>0 then changed:=jsonb_set(changed,'{id}',to_jsonb((e->>'id')||'-replacement-'||p_new::text)); end if;
       if e->>'resolvedExerciseId'=p_old::text then changed:=changed||jsonb_build_object('name',p_name,'resolvedExerciseId',p_new::text); end if;
       if e->>'resolvedBasisExerciseId'=p_old::text then changed:=changed||jsonb_build_object('basisRaw',p_name,'resolvedBasisExerciseId',p_new::text); end if;
       exercises:=exercises||jsonb_build_array(changed);
      end if;
     else exercises:=exercises||jsonb_build_array(e); end if;
    end loop;
    blocks:=blocks||jsonb_build_array(jsonb_set(b,'{exercises}',exercises));
   end loop;
   days:=days||jsonb_build_array(jsonb_set(d,'{blocks}',blocks));
  end loop;
  weeks:=weeks||jsonb_build_array(jsonb_set(w,'{days}',days));
 end loop;
 return jsonb_set(p_plan,'{weeks}',weeks);
end; $$;

create function public.claim_coach_exercise(p_name text default null,p_exercise_id uuid default null)
returns public.exercises language plpgsql security definer set search_path=public as $$
declare chosen public.exercises; result public.exercises; exercise_name text; normalized text;
begin
 if not exists(select 1 from profiles where id=auth.uid() and role='coach' and deleted_at is null) then raise exception 'Coach required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('exercises:'||auth.uid()::text,0));
 if p_exercise_id is not null then
  select * into chosen from exercises where id=p_exercise_id and archived_at is null and (owner_coach_id is null or owner_coach_id=auth.uid());
  if chosen.id is null then raise exception 'Exercise not found' using errcode='P0002'; end if;
  if chosen.owner_coach_id=auth.uid() then return chosen; end if;
  exercise_name:=chosen.name;
 else exercise_name:=btrim(p_name); end if;
 if exercise_name is null or length(exercise_name)=0 or length(exercise_name)>200 then raise exception 'Exercise name required (maximum 200 characters)' using errcode='22023'; end if;
 normalized:=lower(btrim(regexp_replace(exercise_name,'\s+',' ','g')));
 select * into result from exercises where owner_coach_id=auth.uid() and archived_at is null
  and (normalized_name=normalized or (chosen.id is not null and template_exercise_id=chosen.id))
  order by (normalized_name=normalized) desc,id limit 1;
 if result.id is not null then return result; end if;
 if chosen.id is null then select * into chosen from exercises where owner_coach_id is null and normalized_name=normalized and archived_at is null limit 1; end if;
 insert into exercises(name,normalized_name,owner_coach_id,template_exercise_id) values(exercise_name,normalized,auth.uid(),chosen.id) returning * into result;
 return result;
end; $$;

create function public.search_coach_exercises(p_coach_id uuid,p_query text,p_limit integer default 5,p_include_templates boolean default true)
returns table(id uuid,name text) language sql stable security invoker set search_path=public as $$
 select e.id,e.name from exercises e
 where (p_coach_id=auth.uid() or exists(select 1 from coach_athletes ca where ca.coach_id=p_coach_id and ca.athlete_id=auth.uid() and ca.status='active' and ca.unlinked_at is null))
 and e.archived_at is null and btrim(p_query)<>''
 and (e.owner_coach_id=p_coach_id or (p_include_templates and e.owner_coach_id is null and not exists(
  select 1 from exercises own where own.owner_coach_id=p_coach_id and own.archived_at is null and (own.normalized_name=e.normalized_name or own.template_exercise_id=e.id))))
 and position(lower(btrim(regexp_replace(p_query,'\s+',' ','g'))) in e.normalized_name)>0
 order by e.owner_coach_id nulls last,e.name,e.id limit least(greatest(p_limit,1),50);
$$;

-- Internal writer: append template versions, preserve earlier versions/completed assignments.
create function public.rewrite_coach_exercise_references(p_coach uuid,p_old uuid,p_new uuid,p_name text)
returns void language plpgsql set search_path=public as $$
declare p record; a record; rewritten jsonb; new_version uuid;
begin
 for p in select plans.id,plan_versions.plan_data from plans join plan_versions on plan_versions.id=plans.active_version_id
  where plans.coach_id=p_coach and plan_uses_exercise(plan_versions.plan_data,p_old) order by plans.id for update of plans loop
  rewritten:=replace_plan_exercise(p.plan_data,p_old,p_new,p_name,false);
  insert into plan_versions(plan_id,plan_data,change_summary,created_by) values(p.id,rewritten,'Updated exercise library reference',p_coach) returning id into new_version;
  update plans set active_version_id=new_version,updated_at=clock_timestamp() where id=p.id;
 end loop;
 for a in select id,plan_data from assigned_plans where coach_id=p_coach and status='active' order by id for update loop
  if plan_uses_exercise(a.plan_data,p_old) then
   rewritten:=replace_plan_exercise(a.plan_data,p_old,p_new,p_name,true);
   if rewritten is distinct from a.plan_data then update assigned_plans set plan_data=rewritten where id=a.id; end if;
  end if;
 end loop;
end; $$;

create function public.coach_exercise_usage(p_exercise_id uuid) returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('templates',(select count(*) from plans p join plan_versions v on v.id=p.active_version_id where p.coach_id=auth.uid() and plan_uses_exercise(v.plan_data,p_exercise_id)),
 'assignments',(select count(*) from assigned_plans a where a.coach_id=auth.uid() and a.status='active' and replace_plan_exercise(a.plan_data,p_exercise_id,'00000000-0000-0000-0000-000000000000','__usage_check__',true) is distinct from a.plan_data))
 where exists(select 1 from exercises where id=p_exercise_id and owner_coach_id=auth.uid() and archived_at is null);
$$;

create function public.manage_coach_exercise(p_exercise_id uuid,p_name text default null,p_replacement_id uuid default null,p_archive boolean default false)
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

-- Adopt previously selected globals. This identity migration retains every max value,
-- source and timestamp, and preserves historical plan versions and logged workouts.
do $$declare coach record; global_row record; owned uuid;
begin
 for coach in select id from profiles where role='coach' and deleted_at is null loop
  for global_row in select e.* from exercises e where e.owner_coach_id is null and (
   exists(select 1 from plans p join plan_versions v on v.id=p.active_version_id where p.coach_id=coach.id and plan_uses_exercise(v.plan_data,e.id))
   or exists(select 1 from assigned_plans a where a.coach_id=coach.id and plan_uses_exercise(a.plan_data,e.id))
   or exists(select 1 from athlete_maxes am join coach_athletes ca on ca.athlete_id=am.athlete_id where ca.coach_id=coach.id and ca.status='active' and ca.unlinked_at is null and am.exercise_id=e.id)) loop
   select id into owned from exercises where owner_coach_id=coach.id and normalized_name=global_row.normalized_name and archived_at is null;
   if owned is null then insert into exercises(name,normalized_name,owner_coach_id,template_exercise_id) values(global_row.name,global_row.normalized_name,coach.id,global_row.id) returning id into owned; end if;
   update exercises set template_exercise_id=coalesce(template_exercise_id,global_row.id) where id=owned;
   perform rewrite_coach_exercise_references(coach.id,global_row.id,owned,global_row.name);
   -- Changing ownership does not change the exercise itself: retain set IDs/actuals.
   update assigned_plans set plan_data=replace_plan_exercise(plan_data,global_row.id,owned,global_row.name,false)
    where coach_id=coach.id and status='active' and plan_uses_exercise(plan_data,global_row.id);
   update athlete_maxes am set exercise_id=owned where am.exercise_id=global_row.id and exists(select 1 from coach_athletes ca where ca.athlete_id=am.athlete_id and ca.coach_id=coach.id and ca.status='active' and ca.unlinked_at is null);
  end loop;
 end loop;
end; $$;

revoke insert,update,delete on public.exercises from anon,authenticated;
-- Serialize plan creation/assignment with catalog changes. Concurrent stale writes
-- must fail rather than introduce a reference after the replacement has completed.
create function public.enforce_coach_library_references() returns trigger language plpgsql set search_path=public as $$
declare coach_id uuid; ref text; exercise jsonb;
begin
 if tg_table_name='plan_versions' then select p.coach_id into coach_id from plans p where p.id=new.plan_id;
 else coach_id:=new.coach_id; end if;
 perform pg_advisory_xact_lock(hashtextextended('exercises:'||coach_id::text,0));
 for exercise in select value from jsonb_path_query(new.plan_data,'$.weeks[*].days[*].blocks[*].exercises[*]') as entries(value) loop
  foreach ref in array array[exercise->>'resolvedExerciseId',exercise->>'resolvedBasisExerciseId'] loop
   if ref is not null and not exists(select 1 from exercises e where e.id=ref::uuid and e.owner_coach_id=coach_id and e.archived_at is null)
   then raise exception 'Choose an active exercise from your library and save the plan again' using errcode='22023'; end if;
  end loop;
 end loop;
 return new;
end; $$;
create trigger plan_versions_library_references before insert on public.plan_versions for each row execute function public.enforce_coach_library_references();
create trigger assigned_plans_library_references before insert on public.assigned_plans for each row execute function public.enforce_coach_library_references();
revoke all on function public.enforce_coach_library_references() from public,anon,authenticated;
revoke all on function public.claim_coach_exercise(text,uuid),public.search_coach_exercises(uuid,text,integer,boolean),public.coach_exercise_usage(uuid),public.manage_coach_exercise(uuid,text,uuid,boolean) from public,anon;
grant execute on function public.claim_coach_exercise(text,uuid),public.search_coach_exercises(uuid,text,integer,boolean),public.coach_exercise_usage(uuid),public.manage_coach_exercise(uuid,text,uuid,boolean) to authenticated;
revoke all on function public.rewrite_coach_exercise_references(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.replace_plan_exercise(jsonb,uuid,uuid,text,boolean),public.plan_uses_exercise(jsonb,uuid) from public,anon;
grant execute on function public.replace_plan_exercise(jsonb,uuid,uuid,text,boolean),public.plan_uses_exercise(jsonb,uuid) to authenticated;

-- Global exercises are templates, not new athlete max identities.
create or replace function public.insert_athlete_max(
  p_athlete_id uuid, p_exercise_id uuid, p_value numeric, p_unit text, p_source text
) returns public.athlete_maxes language plpgsql security definer set search_path = public as $$
declare result public.athlete_maxes;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = p_athlete_id and role = 'athlete' and deleted_at is null
  ) or not (
    p_athlete_id = auth.uid() or exists (
      select 1 from public.coach_athletes ca where ca.coach_id = auth.uid()
        and ca.athlete_id = p_athlete_id and ca.status = 'active' and ca.unlinked_at is null
    )
  ) then raise exception 'Athlete not found' using errcode = 'P0002'; end if;
  if p_value is null or p_value <= 0 or p_value::text in ('NaN', 'Infinity', '-Infinity')
    or p_unit is null or p_unit not in ('kg', 'lb')
    or p_source is distinct from (case when p_athlete_id = auth.uid() then 'athlete_entered' else 'coach_entered' end)
  then raise exception 'Invalid max entry' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.exercises e where e.id = p_exercise_id and (
      e.owner_coach_id = auth.uid() or exists (
        select 1 from public.athlete_maxes am where am.athlete_id = p_athlete_id and am.exercise_id = e.id
      ) or exists (
        select 1 from public.coach_athletes ca where ca.athlete_id = p_athlete_id
          and ca.coach_id = e.owner_coach_id and ca.status = 'active' and ca.unlinked_at is null
      )
    )
  ) then raise exception 'Exercise not found' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_athlete_id::text, 0));
  insert into public.athlete_maxes (athlete_id, exercise_id, value, unit, source)
    values (p_athlete_id, p_exercise_id, p_value, p_unit, p_source) returning * into result;
  return result;
end;
$$;
