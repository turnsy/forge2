-- Athletes can read their linked coach's exercise catalog; coaches/athletes can delete max rows.

create policy "exercises: athlete read linked coach"
  on exercises for select to authenticated
  using (exists (
    select 1 from coach_athletes ca
    where ca.athlete_id = auth.uid()
      and ca.coach_id = owner_coach_id
      and ca.unlinked_at is null
  ));

create or replace function public.insert_athlete_max(
  p_athlete_id uuid,
  p_exercise_id uuid,
  p_value numeric,
  p_unit text,
  p_source text
)
returns athlete_maxes
language plpgsql
security definer
set search_path = public
as $$
declare result athlete_maxes;
begin
  if p_unit not in ('kg', 'lb') then
    raise exception 'Invalid unit' using errcode = '22023';
  end if;

  if not (
    p_athlete_id = auth.uid()
    or exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_id = p_athlete_id
        and ca.unlinked_at is null
    )
  ) then
    raise exception 'Athlete not found' using errcode = 'P0002';
  end if;

  insert into athlete_maxes (athlete_id, exercise_id, value, unit, source)
  values (p_athlete_id, p_exercise_id, p_value, p_unit, p_source)
  returning * into result;
  return result;
end;
$$;

create or replace function public.delete_athlete_max(p_max_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_athlete_id uuid;
begin
  select athlete_id into v_athlete_id
  from athlete_maxes
  where id = p_max_id;

  if v_athlete_id is null then
    raise exception 'Max not found' using errcode = 'P0002';
  end if;

  if not (
    v_athlete_id = auth.uid()
    or exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_id = v_athlete_id
        and ca.unlinked_at is null
    )
  ) then
    raise exception 'Max not found' using errcode = 'P0002';
  end if;

  delete from athlete_maxes where id = p_max_id;
end;
$$;

revoke all on function public.delete_athlete_max(uuid) from public;
grant execute on function public.delete_athlete_max(uuid) to authenticated;
