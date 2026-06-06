-- Coach plan create, version save, and version list RPCs.

create or replace function public.create_coach_plan(
  p_plan_data jsonb,
  p_change_summary text default null
)
returns table (
  plan_id uuid,
  version_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _coach_id uuid := auth.uid();
  _plan_id uuid;
  _version_id uuid;
begin
  if _coach_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into plans (coach_id)
  values (_coach_id)
  returning id into _plan_id;

  insert into plan_versions (plan_id, plan_data, change_summary, created_by)
  values (_plan_id, p_plan_data, p_change_summary, _coach_id)
  returning id into _version_id;

  update plans
  set active_version_id = _version_id,
      updated_at = now()
  where id = _plan_id;

  return query select _plan_id, _version_id;
end;
$$;

create or replace function public.save_coach_plan_version(
  p_plan_id uuid,
  p_plan_data jsonb,
  p_change_summary text default null
)
returns table (
  version_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _coach_id uuid := auth.uid();
  _version_id uuid;
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

  insert into plan_versions (plan_id, plan_data, change_summary, created_by)
  values (p_plan_id, p_plan_data, p_change_summary, _coach_id)
  returning id into _version_id;

  update plans
  set active_version_id = _version_id,
      updated_at = now()
  where id = p_plan_id;

  return query select _version_id;
end;
$$;

create or replace function public.list_coach_plan_versions(
  p_plan_id uuid
)
returns table (
  version_id uuid,
  change_summary text,
  created_at timestamptz,
  created_by uuid,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select
    pv.id as version_id,
    pv.change_summary,
    pv.created_at,
    pv.created_by,
    (pv.id = pl.active_version_id) as is_active
  from plans pl
  join plan_versions pv on pv.plan_id = pl.id
  where pl.id = p_plan_id
    and pl.coach_id = auth.uid()
  order by pv.created_at desc;
$$;

revoke all on function public.create_coach_plan(jsonb, text) from public;
grant execute on function public.create_coach_plan(jsonb, text) to authenticated;

revoke all on function public.save_coach_plan_version(uuid, jsonb, text) from public;
grant execute on function public.save_coach_plan_version(uuid, jsonb, text) to authenticated;

revoke all on function public.list_coach_plan_versions(uuid) from public;
grant execute on function public.list_coach_plan_versions(uuid) to authenticated;
