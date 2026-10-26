-- Values/history are append-only. Only derived entries can be invalidated internally.
alter table public.athlete_maxes
  add column entry_order bigint generated always as identity,
  add column source_assignment_id uuid,
  add column source_set_key text,
  add column voided_at timestamptz;
alter table public.athlete_maxes alter column logged_at set default clock_timestamp();
create index athlete_maxes_source_set_idx on public.athlete_maxes(source_assignment_id, source_set_key)
  where source_assignment_id is not null;
alter table public.athlete_maxes drop constraint athlete_maxes_source_check;
alter table public.athlete_maxes add constraint athlete_maxes_source_check
  check (source in ('tested', 'coach_entered', 'athlete_entered', 'estimated_from_log', 'logged_single'));
-- Old estimates must no longer drive training weights; retain them in history.
update public.athlete_maxes set voided_at = clock_timestamp() where source = 'estimated_from_log';

drop function if exists public.delete_athlete_max(uuid);
drop policy if exists "athlete_maxes: athlete insert" on public.athlete_maxes;
revoke insert, update, delete on public.athlete_maxes from authenticated, anon;

drop policy if exists "athlete_maxes: coach read linked athlete" on public.athlete_maxes;
create policy "athlete_maxes: coach read linked athlete" on public.athlete_maxes
for select to authenticated using (exists (
  select 1 from public.coach_athletes ca where ca.coach_id = auth.uid()
    and ca.athlete_id = athlete_maxes.athlete_id and ca.status = 'active' and ca.unlinked_at is null
));
drop policy if exists "exercises: athlete read linked coach" on public.exercises;
create policy "exercises: athlete read linked coach" on public.exercises
for select to authenticated using (exists (
  select 1 from public.coach_athletes ca where ca.athlete_id = auth.uid()
    and ca.coach_id = exercises.owner_coach_id and ca.status = 'active' and ca.unlinked_at is null
));
-- Preserve names of exercises already recorded in visible max history after unlinking.
-- athlete_maxes RLS still limits coaches to actively linked athletes.
create policy "exercises: read recorded max" on public.exercises for select to authenticated
using (exists(select 1 from public.athlete_maxes am where am.exercise_id = exercises.id));
drop policy if exists "exercises: coach insert" on public.exercises;
create policy "exercises: coach insert" on public.exercises for insert to authenticated
with check (owner_coach_id = auth.uid() and exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'coach' and p.deleted_at is null
));

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
      e.owner_coach_id is null or e.owner_coach_id = auth.uid() or exists (
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

drop function public.list_athlete_maxes(uuid, uuid[]);
create function public.list_athlete_maxes(p_athlete_id uuid, p_exercise_ids uuid[] default null)
returns setof public.athlete_maxes language sql security definer set search_path = public as $$
  select am.* from public.athlete_maxes am where am.athlete_id = p_athlete_id
    and auth.uid() is not null and (am.athlete_id = auth.uid() or exists (
      select 1 from public.coach_athletes ca where ca.coach_id = auth.uid()
        and ca.athlete_id = am.athlete_id and ca.status = 'active' and ca.unlinked_at is null
    )) and (p_exercise_ids is null or am.exercise_id = any(p_exercise_ids))
  order by am.logged_at desc, am.entry_order desc;
$$;

-- Save only the addressed set, avoiding stale whole-plan overwrites across devices.
-- The logged weight, exercise ID and correction provenance are derived from this row.
create function public.save_workout_set_actuals(
  p_assignment_id uuid, p_week_pos integer, p_day_pos integer,
  p_exercise_pos integer, p_set_pos integer, p_actual jsonb
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  assignment public.assigned_plans;
  block jsonb; exercise jsonb; workout_set jsonb; old_actual jsonb; actual jsonb;
  block_pos integer := 0; exercise_pos integer := p_exercise_pos; set_path text[];
  source_key text; v_exercise_id uuid; weight numeric; weight_unit text;
  previous public.athlete_maxes; current_max public.athlete_maxes;
  changed boolean := false; protect_manual boolean := false;
begin
  select * into assignment from public.assigned_plans where id = p_assignment_id for update;
  if auth.uid() is null or assignment.athlete_id is distinct from auth.uid()
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
  if workout_set is null or workout_set->>'status' = 'skipped' then
    raise exception 'Set not found or skipped' using errcode = '22023'; end if;
  old_actual := workout_set->'actual';
  actual := case when p_actual is null or p_actual = 'null'::jsonb then 'null'::jsonb
    else coalesce(nullif(old_actual, 'null'::jsonb), '{}'::jsonb) || jsonb_strip_nulls(p_actual) end;
  if actual is not distinct from old_actual then return false; end if;
  set_path := array['weeks',p_week_pos::text,'days',p_day_pos::text,'blocks',block_pos::text,
    'exercises',exercise_pos::text,'sets',p_set_pos::text,'actual'];
  update public.assigned_plans set plan_data = jsonb_set(assignment.plan_data, set_path, actual) where id = p_assignment_id;
  source_key := jsonb_build_array(assignment.plan_data #>> array['weeks',p_week_pos::text,'days',p_day_pos::text,'code'], exercise->>'id', workout_set->>'id')::text;
  -- Notes/timestamps alone must not reapply a previously logged weight.
  if (old_actual->>'reps') is not distinct from (actual->>'reps')
    and (old_actual->'target') is not distinct from (actual->'target') then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(assignment.athlete_id::text, 0));
  select * into previous from public.athlete_maxes
    where source_assignment_id = p_assignment_id and source_set_key = source_key
    order by logged_at desc, entry_order desc limit 1;
  if previous.id is not null then
    select exists(select 1 from public.athlete_maxes am where am.athlete_id = auth.uid()
      and am.exercise_id = previous.exercise_id and am.source in ('coach_entered','athlete_entered','tested')
      and (am.logged_at,am.entry_order) > (previous.logged_at,previous.entry_order)) into protect_manual;
    update public.athlete_maxes set voided_at = clock_timestamp()
      where source_assignment_id = p_assignment_id and source_set_key = source_key and voided_at is null;
    changed := found;
  end if;
  if protect_manual or actual->>'reps' is distinct from '1'
    or actual #>> '{target,type}' is distinct from 'absolute'
    or jsonb_typeof(actual #> '{target,value}') is distinct from 'number'
    or coalesce(lower(actual #>> '{target,unit}') not in ('kg','lb'), true)
  then return changed; end if;
  weight := (actual #>> '{target,value}')::numeric;
  weight_unit := lower(actual #>> '{target,unit}');
  if weight <= 0 or weight::text in ('NaN','Infinity','-Infinity') then return changed; end if;
  begin v_exercise_id := (exercise->>'resolvedExerciseId')::uuid;
  exception when invalid_text_representation then return changed; end;
  if not exists(select 1 from public.exercises e where e.id = v_exercise_id and (
    e.owner_coach_id is null or e.owner_coach_id = assignment.coach_id
  )) then return changed; end if;
  select * into current_max from public.athlete_maxes where athlete_id = auth.uid()
    and athlete_maxes.exercise_id = v_exercise_id and voided_at is null
    and unit in ('kg','lb') and value > 0 and value::text not in ('NaN','Infinity','-Infinity')
    order by logged_at desc, entry_order desc limit 1;
  if current_max.id is null or (weight * (case when weight_unit = 'lb' then 0.45359237 else 1 end)
    > current_max.value * (case when current_max.unit = 'lb' then 0.45359237 else 1 end)) then
    insert into public.athlete_maxes(athlete_id,exercise_id,value,unit,source,source_assignment_id,source_set_key)
      values(auth.uid(),v_exercise_id,weight,weight_unit,'logged_single',p_assignment_id,source_key);
    changed := true;
  end if;
  return changed;
end;
$$;
revoke all on function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb) from public;
grant execute on function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb) to authenticated;
revoke all on function public.list_athlete_maxes(uuid,uuid[]) from public;
grant execute on function public.list_athlete_maxes(uuid,uuid[]) to authenticated;
revoke all on function public.insert_athlete_max(uuid,uuid,numeric,text,text) from public;
grant execute on function public.insert_athlete_max(uuid,uuid,numeric,text,text) to authenticated;
