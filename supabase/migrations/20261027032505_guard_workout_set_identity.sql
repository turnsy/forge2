-- Bind draft writes to the exercise/set identities shown in the athlete UI.
drop function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb);
create function public.save_workout_set_actuals(
  p_assignment_id uuid, p_week_pos integer, p_day_pos integer,
  p_exercise_pos integer, p_set_pos integer, p_actual jsonb,
  p_expected_exercise_id text, p_expected_set_id text, p_expected_catalog_id text
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
  if workout_set is null or workout_set->>'status' is distinct from 'planned'
    or exercise->>'id' is distinct from p_expected_exercise_id
    or workout_set->>'id' is distinct from p_expected_set_id
    or exercise->>'resolvedExerciseId' is distinct from p_expected_catalog_id then
    raise exception 'Workout changed. Refresh the workout before saving this set.' using errcode = '22023'; end if;
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
revoke all on function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb,text,text,text) from public,anon;
grant execute on function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb,text,text,text) to authenticated;
