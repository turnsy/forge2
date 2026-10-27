create or replace function public.save_workout_set_actuals(
  p_assignment_id uuid, p_week_pos integer, p_day_pos integer,
  p_exercise_pos integer, p_set_pos integer, p_actual jsonb
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  assignment public.assigned_plans;
  block jsonb; exercise jsonb; workout_set jsonb; old_actual jsonb; actual jsonb;
  block_pos integer := 0; exercise_pos integer := p_exercise_pos; set_path text[];
begin
  select * into assignment from public.assigned_plans where id = p_assignment_id for update;
  if auth.uid() is null or assignment.athlete_id is distinct from auth.uid()
    or not exists(select 1 from profiles p where p.id=auth.uid() and p.role='athlete' and p.deleted_at is null)
    or assignment.status <> 'active' or not exists (
      select 1 from public.coach_athletes ca where ca.coach_id = assignment.coach_id
        and ca.athlete_id = auth.uid() and ca.status = 'active' and ca.unlinked_at is null
    ) then raise exception 'Assignment not found' using errcode = 'P0002'; end if;
  if p_week_pos is null or p_day_pos is null or p_exercise_pos is null or p_set_pos is null
    or least(p_week_pos, p_day_pos, p_exercise_pos, p_set_pos) < 0
    or (p_actual is not null and p_actual <> 'null'::jsonb and jsonb_typeof(p_actual) <> 'object')
  then raise exception 'Invalid set' using errcode = '22023'; end if;
  for block in select value from jsonb_array_elements(
    coalesce(assignment.plan_data #> array['weeks',p_week_pos::text,'days',p_day_pos::text,'blocks'], '[]'::jsonb)
  ) loop
    if exercise_pos < jsonb_array_length(block->'exercises') then
      exercise := block->'exercises'->exercise_pos; exit;
    end if;
    exercise_pos := exercise_pos - jsonb_array_length(block->'exercises'); block_pos := block_pos + 1;
  end loop;
  workout_set := exercise->'sets'->p_set_pos;
  if workout_set is null or workout_set->>'status' is distinct from 'planned' then
    raise exception 'Set not found or skipped' using errcode = '22023'; end if;
  old_actual := workout_set->'actual';
  actual := case when p_actual is null or p_actual = 'null'::jsonb then 'null'::jsonb
    else coalesce(nullif(old_actual, 'null'::jsonb), '{}'::jsonb) || jsonb_strip_nulls(p_actual) end;
  if actual is not distinct from old_actual then return false; end if;
  set_path := array['weeks',p_week_pos::text,'days',p_day_pos::text,'blocks',block_pos::text,
    'exercises',exercise_pos::text,'sets',p_set_pos::text,'actual'];
  update public.assigned_plans set plan_data = jsonb_set(assignment.plan_data, set_path, actual) where id = p_assignment_id;
  return false; -- Draft autosaves never promote training maxes.
end;
$$;
-- Previous preview builds promoted autosaves. Keep those rows as retired history;
-- only new explicit workout completions can produce effective logged singles.
update public.athlete_maxes set voided_at=clock_timestamp() where source='logged_single' and voided_at is null;
create unique index athlete_maxes_completed_source_idx on public.athlete_maxes(source_assignment_id,source_set_key)
 where source='logged_single' and voided_at is null and source_assignment_id is not null;
drop policy if exists "assigned_plans: athlete update" on public.assigned_plans;

create function public.complete_workout_day(p_assignment_id uuid,p_week_pos integer,p_day_pos integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare assignment public.assigned_plans; day jsonb; b jsonb; e jsonb; s jsonb; a jsonb;
 blocks jsonb:='[]'; exercises jsonb; sets jsonb; statuses jsonb:='[]';
 old_status text; next_status text; set_index integer:=0; day_path text[];
 v_exercise_id uuid; source_key text; weight numeric; weight_unit text; current_max public.athlete_maxes;
 changed boolean:=false; all_done boolean; v_completed_at text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 select * into assignment from assigned_plans where id=p_assignment_id for update;
 if auth.uid() is null or assignment.athlete_id is distinct from auth.uid() or assignment.status not in ('active','completed')
  or not exists(select 1 from profiles p where p.id=auth.uid() and p.role='athlete' and p.deleted_at is null)
  or not exists(select 1 from coach_athletes ca where ca.coach_id=assignment.coach_id and ca.athlete_id=auth.uid() and ca.status='active' and ca.unlinked_at is null)
 then raise exception 'Assignment not found' using errcode='P0002'; end if;
 if p_week_pos is null or p_day_pos is null or least(p_week_pos,p_day_pos)<0 then raise exception 'Invalid workout' using errcode='22023'; end if;
 day_path:=array['weeks',p_week_pos::text,'days',p_day_pos::text];
 day:=assignment.plan_data#>day_path;
 if day is null or not jsonb_path_exists(day,'$.blocks[*].exercises[*].sets[*]') then raise exception 'Workout not found' using errcode='22023'; end if;
 if assignment.status='completed' and jsonb_path_exists(day,'$.blocks[*].exercises[*].sets[*] ? (@.status == "planned")') then raise exception 'Assignment already completed' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(assignment.athlete_id::text,0));
 for b in select value from jsonb_array_elements(day->'blocks') loop
  exercises:='[]';
  for e in select value from jsonb_array_elements(b->'exercises') loop
   sets:='[]';
   for s in select value from jsonb_array_elements(e->'sets') loop
    old_status:=s->>'status'; a:=s->'actual';
    if old_status<>'planned' then next_status:=old_status;
    elsif s#>>'{planned,type}'='target' then
     next_status:='completed';
     a:=coalesce(nullif(a,'null'::jsonb),'{}'::jsonb);
     if not (a ? 'reps') and s#>'{planned,reps}' is not null then a:=a||jsonb_build_object('reps',s#>'{planned,reps}'); end if;
     a:=a||jsonb_build_object('completedAt',v_completed_at);
    elsif nullif(a->>'reps','') is not null and a->'target' is not null and a->'target'<>'null'::jsonb then
     next_status:='completed'; a:=a||jsonb_build_object('completedAt',v_completed_at);
    else next_status:='skipped'; end if;
    s:=s||jsonb_build_object('status',next_status,'actual',a);
    sets:=sets||jsonb_build_array(s);
    statuses:=statuses||jsonb_build_array(jsonb_build_object('setIndex',set_index,'status',next_status)); set_index:=set_index+1;
    if old_status<>'planned' or next_status<>'completed' or a->>'reps' is distinct from '1'
     or a#>>'{target,type}' is distinct from 'absolute' or jsonb_typeof(a#>'{target,value}') is distinct from 'number'
     or coalesce(lower(a#>>'{target,unit}') not in ('kg','lb'),true) then continue; end if;
    weight:=(a#>>'{target,value}')::numeric; weight_unit:=lower(a#>>'{target,unit}');
    if weight<=0 or weight::text in ('NaN','Infinity','-Infinity') then continue; end if;
    begin v_exercise_id:=(e->>'resolvedExerciseId')::uuid; exception when invalid_text_representation then continue; end;
    if not exists(select 1 from exercises catalog where catalog.id=v_exercise_id and catalog.owner_coach_id=assignment.coach_id) then continue; end if;
    source_key:=jsonb_build_array(day->>'code',e->>'id',s->>'id')::text;
    if exists(select 1 from athlete_maxes am where am.source_assignment_id=assignment.id and am.source_set_key=source_key and am.voided_at is null) then continue; end if;
    select * into current_max from athlete_maxes am where am.athlete_id=auth.uid() and am.exercise_id=v_exercise_id and am.voided_at is null
     and am.unit in ('kg','lb') and am.value>0 and am.value::text not in ('NaN','Infinity','-Infinity') order by am.logged_at desc,am.entry_order desc limit 1;
    if current_max.id is null or weight*(case when weight_unit='lb' then 0.45359237 else 1 end)>current_max.value*(case when current_max.unit='lb' then 0.45359237 else 1 end) then
     insert into athlete_maxes(athlete_id,exercise_id,value,unit,source,source_assignment_id,source_set_key)
      values(auth.uid(),v_exercise_id,weight,weight_unit,'logged_single',assignment.id,source_key);
     changed:=true;
    end if;
   end loop;
   exercises:=exercises||jsonb_build_array(jsonb_set(e,'{sets}',sets));
  end loop;
  blocks:=blocks||jsonb_build_array(jsonb_set(b,'{exercises}',exercises));
 end loop;
 assignment.plan_data:=jsonb_set(assignment.plan_data,day_path,jsonb_set(day,'{blocks}',blocks));
 all_done:=not jsonb_path_exists(assignment.plan_data,'$.weeks[*].days[*].blocks[*].exercises[*].sets[*] ? (@.status == "planned")');
 update assigned_plans set plan_data=assignment.plan_data,status=case when all_done then 'completed'::assignment_status else status end,
  completed_at=case when all_done then coalesce(assigned_plans.completed_at,v_completed_at::timestamptz) else assigned_plans.completed_at end where id=assignment.id;
 return jsonb_build_object('plan',assignment.plan_data,'allDaysDone',all_done,'maxChanged',changed,'setStatuses',statuses);
end; $$;
revoke all on function public.complete_workout_day(uuid,integer,integer) from public,anon;
grant execute on function public.complete_workout_day(uuid,integer,integer) to authenticated;
