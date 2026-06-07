-- Plan assignment, delete, and assigned_plans FK updates for plan deletion.

alter table assigned_plans
  alter column plan_id drop not null,
  alter column plan_version_id drop not null;

alter table assigned_plans
  drop constraint if exists assigned_plans_plan_id_fkey,
  drop constraint if exists assigned_plans_plan_version_id_fkey;

alter table assigned_plans
  add constraint assigned_plans_plan_id_fkey
    foreign key (plan_id) references plans(id) on delete set null,
  add constraint assigned_plans_plan_version_id_fkey
    foreign key (plan_version_id) references plan_versions(id) on delete set null;

create or replace function public.assign_plan_to_athletes(
  p_plan_id uuid,
  p_athlete_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _coach_id uuid := auth.uid();
  _active_version_id uuid;
  _plan_data jsonb;
  _athlete_id uuid;
begin
  if _coach_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_athlete_ids is null or cardinality(p_athlete_ids) = 0 then
    raise exception 'No athletes provided' using errcode = '22023';
  end if;

  select pl.active_version_id, pv.plan_data
  into _active_version_id, _plan_data
  from plans pl
  join plan_versions pv on pv.id = pl.active_version_id
  where pl.id = p_plan_id
    and pl.coach_id = _coach_id;

  if _active_version_id is null then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from unnest(p_athlete_ids) as requested(athlete_id)
    where not exists (
      select 1
      from coach_athletes ca
      where ca.coach_id = _coach_id
        and ca.athlete_id = requested.athlete_id
        and ca.status = 'active'
        and ca.unlinked_at is null
    )
  ) then
    raise exception 'Athlete not linked to coach' using errcode = '42501';
  end if;

  foreach _athlete_id in array p_athlete_ids
  loop
    if exists (
      select 1
      from assigned_plans ap
      where ap.athlete_id = _athlete_id
        and ap.plan_id = p_plan_id
        and ap.status = 'active'
    ) then
      continue;
    end if;

    update assigned_plans
    set status = 'unassigned',
        unassigned_at = now()
    where athlete_id = _athlete_id
      and coach_id = _coach_id
      and status = 'active';

    insert into assigned_plans (
      plan_id,
      plan_version_id,
      athlete_id,
      coach_id,
      status,
      plan_data
    )
    values (
      p_plan_id,
      _active_version_id,
      _athlete_id,
      _coach_id,
      'active',
      _plan_data
    );
  end loop;
end;
$$;

create or replace function public.delete_coach_plan(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _coach_id uuid := auth.uid();
begin
  if _coach_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from plans pl
    where pl.id = p_plan_id
      and pl.coach_id = _coach_id
  ) then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  update assigned_plans
  set status = 'unassigned',
      unassigned_at = now()
  where plan_id = p_plan_id
    and coach_id = _coach_id
    and status = 'active';

  delete from plans
  where id = p_plan_id
    and coach_id = _coach_id;
end;
$$;

create or replace function public.get_coach_plan_delete_info(p_plan_id uuid)
returns table (
  plan_title text,
  active_assignment_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    pv.plan_data->>'name' as plan_title,
    count(ap.id) filter (where ap.status = 'active') as active_assignment_count
  from plans pl
  left join plan_versions pv on pv.id = pl.active_version_id
  left join assigned_plans ap
    on ap.plan_id = pl.id
    and ap.coach_id = pl.coach_id
  where pl.id = p_plan_id
    and pl.coach_id = auth.uid()
  group by pv.plan_data;
$$;

drop function if exists public.get_coach_athlete_relationship(uuid);

create or replace function public.get_coach_athlete_relationship(p_athlete_id uuid)
returns table (
  relationship_id uuid,
  status coach_link_status,
  athlete_id uuid,
  athlete_name text,
  athlete_email text,
  linked_at timestamptz,
  current_plan_id uuid,
  current_plan_name text
)
language sql
security definer
set search_path = public
as $$
  select
    ca.id as relationship_id,
    ca.status,
    p.id as athlete_id,
    p.full_name as athlete_name,
    u.email::text as athlete_email,
    ca.linked_at,
    ap.plan_id as current_plan_id,
    ap.plan_data->>'name' as current_plan_name
  from coach_athletes ca
  join profiles p on p.id = ca.athlete_id
  join auth.users u on u.id = p.id
  left join assigned_plans ap
    on ap.athlete_id = ca.athlete_id
    and ap.status = 'active'
  where ca.coach_id = auth.uid()
    and ca.athlete_id = p_athlete_id
    and ca.unlinked_at is null
    and ca.status in ('pending', 'active')
    and p.deleted_at is null
  limit 1;
$$;

revoke all on function public.assign_plan_to_athletes(uuid, uuid[]) from public;
grant execute on function public.assign_plan_to_athletes(uuid, uuid[]) to authenticated;

revoke all on function public.delete_coach_plan(uuid) from public;
grant execute on function public.delete_coach_plan(uuid) to authenticated;

revoke all on function public.get_coach_plan_delete_info(uuid) from public;
grant execute on function public.get_coach_plan_delete_info(uuid) to authenticated;

revoke all on function public.get_coach_athlete_relationship(uuid) from public;
grant execute on function public.get_coach_athlete_relationship(uuid) to authenticated;
