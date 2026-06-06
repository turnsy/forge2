-- Paginated, searchable coach athletes and plans list RPCs.

drop function if exists public.get_coach_athletes();

create or replace function public.get_coach_athletes(
  p_search text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  athlete_id uuid,
  full_name text,
  email text,
  linked_at timestamptz,
  current_plan_id uuid,
  current_plan_name text,
  current_assignment_status assignment_status,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select
      p.id as athlete_id,
      p.full_name,
      u.email::text as email,
      ca.linked_at,
      ap.plan_id as current_plan_id,
      ap.plan_data->>'name' as current_plan_name,
      ap.status as current_assignment_status
    from coach_athletes ca
    join profiles p on p.id = ca.athlete_id
    join auth.users u on u.id = p.id
    left join assigned_plans ap
      on ap.athlete_id = ca.athlete_id
      and ap.status = 'active'
    where ca.coach_id = auth.uid()
      and ca.unlinked_at is null
      and p.deleted_at is null
      and (
        p_search is null
        or btrim(p_search) = ''
        or p.full_name ilike '%' || p_search || '%' escape '\'
      )
  )
  select
    athlete_id,
    full_name,
    email,
    linked_at,
    current_plan_id,
    current_plan_name,
    current_assignment_status,
    count(*) over() as total_count
  from filtered
  order by
    case
      when p_search is not null
        and btrim(p_search) <> ''
        and full_name ilike btrim(p_search) || '%' escape '\'
      then 0
      else 1
    end,
    full_name asc nulls last,
    linked_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

create or replace function public.get_coach_plans(
  p_search text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  plan_id uuid,
  created_at timestamptz,
  plan_data jsonb,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select
      pl.id as plan_id,
      pl.created_at,
      pv.plan_data
    from plans pl
    join plan_versions pv on pv.id = pl.active_version_id
    where pl.coach_id = auth.uid()
      and pl.active_version_id is not null
      and pv.plan_data->>'name' is not null
      and btrim(pv.plan_data->>'name') <> ''
      and (
        p_search is null
        or btrim(p_search) = ''
        or pv.plan_data->>'name' ilike '%' || p_search || '%' escape '\'
      )
  )
  select
    plan_id,
    created_at,
    plan_data,
    count(*) over() as total_count
  from filtered
  order by
    case
      when p_search is not null
        and btrim(p_search) <> ''
        and plan_data->>'name' ilike btrim(p_search) || '%' escape '\'
      then 0
      else 1
    end,
    plan_data->>'name' asc,
    created_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.get_coach_athletes(text, int, int) from public;
grant execute on function public.get_coach_athletes(text, int, int) to authenticated;

revoke all on function public.get_coach_plans(text, int, int) from public;
grant execute on function public.get_coach_plans(text, int, int) to authenticated;
