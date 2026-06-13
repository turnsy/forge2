-- Add completion_percent to coach athlete list RPC.

drop function if exists public.get_coach_athletes(text, int, int);

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
  completion_percent int,
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
      ap.status as current_assignment_status,
      case
        when ap.id is null then null
        else (
          select case
            when count(*) = 0 then 0
            else round(
              (count(*) filter (where day_complete))::numeric / count(*) * 100
            )::int
          end
          from (
            select
              coalesce(
                (
                  select bool_and((s->>'status') = 'completed')
                  from jsonb_array_elements(d->'exercises') e,
                       jsonb_array_elements(e->'sets') s
                ),
                false
              ) as day_complete
            from jsonb_array_elements(ap.plan_data->'weeks') w,
                 jsonb_array_elements(w->'days') d
          ) day_stats
        )
      end as completion_percent
    from coach_athletes ca
    join profiles p on p.id = ca.athlete_id
    join auth.users u on u.id = p.id
    left join assigned_plans ap
      on ap.athlete_id = ca.athlete_id
      and ap.status = 'active'
    where ca.coach_id = auth.uid()
      and ca.status = 'active'
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
    completion_percent,
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

revoke all on function public.get_coach_athletes(text, int, int) from public;
grant execute on function public.get_coach_athletes(text, int, int) to authenticated;
