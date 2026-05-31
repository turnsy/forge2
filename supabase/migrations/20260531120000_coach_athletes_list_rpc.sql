-- RPC for coach athletes list: includes email from auth.users and current active plan.

create or replace function get_coach_athletes()
returns table (
  athlete_id uuid,
  full_name text,
  email text,
  linked_at timestamptz,
  current_plan_id uuid,
  current_plan_name text,
  current_assignment_status assignment_status
)
language sql
security definer
set search_path = public
as $$
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
  order by ca.linked_at desc;
$$;

revoke all on function get_coach_athletes() from public;
grant execute on function get_coach_athletes() to authenticated;
