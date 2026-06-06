-- Plans list RPC: week count only (days/week available on plan detail).

drop function if exists public.get_coach_plans(text, int, int);

create or replace function public.get_coach_plans(
  p_search text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  plan_id uuid,
  title text,
  week_count int,
  created_at timestamptz,
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
      btrim(pv.plan_data->>'name') as title,
      coalesce(jsonb_array_length(pv.plan_data->'weeks'), 0) as week_count
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
    title,
    week_count,
    created_at,
    count(*) over() as total_count
  from filtered
  order by
    case
      when p_search is not null
        and btrim(p_search) <> ''
        and title ilike btrim(p_search) || '%' escape '\'
      then 0
      else 1
    end,
    title asc,
    created_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.get_coach_plans(text, int, int) from public;
grant execute on function public.get_coach_plans(text, int, int) to authenticated;
