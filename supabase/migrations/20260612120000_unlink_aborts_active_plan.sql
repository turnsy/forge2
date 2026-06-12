-- Unlinking a coach-athlete relationship also aborts any active program copy.

create or replace function public.unlink_coach_athlete(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _athlete_id uuid;
begin
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  select ca.athlete_id
  into _athlete_id
  from coach_athletes ca
  where ca.id = p_relationship_id
    and (ca.coach_id = _user_id or ca.athlete_id = _user_id)
    and ca.status = 'active'
    and ca.unlinked_at is null;

  if _athlete_id is null then
    raise exception 'Active link not found';
  end if;

  update coach_athletes
  set unlinked_at = now()
  where id = p_relationship_id;

  update assigned_plans
  set status = 'unassigned',
      unassigned_at = now()
  where athlete_id = _athlete_id
    and status = 'active';
end;
$$;
