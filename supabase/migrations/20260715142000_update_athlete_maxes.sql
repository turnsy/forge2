create policy "athlete_maxes: athlete update own"
  on athlete_maxes for update to authenticated
  using (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

create policy "athlete_maxes: coach update linked athlete"
  on athlete_maxes for update to authenticated
  using (exists (
    select 1 from coach_athletes ca
    where ca.coach_id = auth.uid()
      and ca.athlete_id = athlete_maxes.athlete_id
      and ca.unlinked_at is null
  ))
  with check (exists (
    select 1 from coach_athletes ca
    where ca.coach_id = auth.uid()
      and ca.athlete_id = athlete_maxes.athlete_id
      and ca.unlinked_at is null
  ));

create or replace function public.update_athlete_max(
  p_max_id uuid,
  p_value numeric,
  p_unit text
)
returns athlete_maxes
language plpgsql
security definer
set search_path = public
as $$
declare
  target athlete_maxes;
  result athlete_maxes;
begin
  select * into target from athlete_maxes where id = p_max_id;
  if not found then
    raise exception 'Max not found' using errcode = 'P0002';
  end if;

  if not (
    target.athlete_id = auth.uid()
    or exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_id = target.athlete_id
        and ca.unlinked_at is null
    )
  ) then
    raise exception 'Max not found' using errcode = 'P0002';
  end if;

  if p_value <= 0 then
    raise exception 'Max value must be positive' using errcode = '22023';
  end if;

  update athlete_maxes
  set value = p_value,
      unit = p_unit
  where id = p_max_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.update_athlete_max(uuid, numeric, text) from public;
grant execute on function public.update_athlete_max(uuid, numeric, text) to authenticated;
