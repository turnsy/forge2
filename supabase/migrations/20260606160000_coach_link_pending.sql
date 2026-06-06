-- Coach-athlete linking: pending/active status and secure RPCs.

create type coach_link_status as enum ('pending', 'active');

alter table coach_athletes
  add column status coach_link_status not null default 'active';

alter table coach_athletes
  add column created_at timestamptz not null default now();

alter table coach_athletes
  alter column linked_at drop not null;

update coach_athletes
set created_at = linked_at
where created_at is null and linked_at is not null;

update coach_athletes
set status = 'active'
where status is null;

drop index if exists coach_athletes_one_active_coach_idx;

create unique index coach_athletes_one_active_coach_idx
  on coach_athletes (athlete_id)
  where status = 'active' and unlinked_at is null;

create unique index coach_athletes_one_pending_athlete_idx
  on coach_athletes (athlete_id)
  where status = 'pending' and unlinked_at is null;

-- Athletes link only through RPCs.
drop policy if exists "coach_athletes: athlete insert" on coach_athletes;

create or replace function public.normalize_invite_code(p_code text)
returns text
language sql
immutable
as $$
  select upper(btrim(p_code));
$$;

create or replace function public.request_coach_link(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _athlete_id uuid := auth.uid();
  _coach_id uuid;
  _normalized_code text;
  _existing_id uuid;
  _relationship_id uuid;
begin
  if _athlete_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from profiles
    where id = _athlete_id
      and role = 'athlete'
      and deleted_at is null
  ) then
    raise exception 'Only athletes can request a coach link';
  end if;

  _normalized_code := normalize_invite_code(p_invite_code);

  if _normalized_code is null or length(_normalized_code) = 0 then
    raise exception 'Invalid invite code';
  end if;

  select id
  into _coach_id
  from profiles
  where invite_code = _normalized_code
    and role = 'coach'
    and deleted_at is null;

  if _coach_id is null then
    raise exception 'Invalid invite code';
  end if;

  if _coach_id = _athlete_id then
    raise exception 'Invalid invite code';
  end if;

  if exists (
    select 1
    from coach_athletes
    where athlete_id = _athlete_id
      and status = 'active'
      and unlinked_at is null
  ) then
    raise exception 'Already linked to a coach';
  end if;

  select id
  into _existing_id
  from coach_athletes
  where athlete_id = _athlete_id
    and coach_id = _coach_id
    and status = 'pending'
    and unlinked_at is null;

  if _existing_id is not null then
    return _existing_id;
  end if;

  if exists (
    select 1
    from coach_athletes
    where athlete_id = _athlete_id
      and status = 'pending'
      and unlinked_at is null
  ) then
    raise exception 'Pending request already exists';
  end if;

  insert into coach_athletes (coach_id, athlete_id, status, linked_at)
  values (_coach_id, _athlete_id, 'pending', null)
  returning id into _relationship_id;

  return _relationship_id;
end;
$$;

create or replace function public.cancel_coach_link_request(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _athlete_id uuid := auth.uid();
begin
  if _athlete_id is null then
    raise exception 'Not authenticated';
  end if;

  update coach_athletes
  set unlinked_at = now()
  where id = p_relationship_id
    and athlete_id = _athlete_id
    and status = 'pending'
    and unlinked_at is null;

  if not found then
    raise exception 'Pending request not found';
  end if;
end;
$$;

create or replace function public.accept_coach_link(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _coach_id uuid := auth.uid();
begin
  if _coach_id is null then
    raise exception 'Not authenticated';
  end if;

  update coach_athletes
  set status = 'active',
      linked_at = now()
  where id = p_relationship_id
    and coach_id = _coach_id
    and status = 'pending'
    and unlinked_at is null;

  if not found then
    raise exception 'Pending invite not found';
  end if;
end;
$$;

create or replace function public.reject_coach_link(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _coach_id uuid := auth.uid();
begin
  if _coach_id is null then
    raise exception 'Not authenticated';
  end if;

  update coach_athletes
  set unlinked_at = now()
  where id = p_relationship_id
    and coach_id = _coach_id
    and status = 'pending'
    and unlinked_at is null;

  if not found then
    raise exception 'Pending invite not found';
  end if;
end;
$$;

create or replace function public.unlink_coach_athlete(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
begin
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  update coach_athletes
  set unlinked_at = now()
  where id = p_relationship_id
    and (coach_id = _user_id or athlete_id = _user_id)
    and status = 'active'
    and unlinked_at is null;

  if not found then
    raise exception 'Active link not found';
  end if;
end;
$$;

create or replace function public.get_athlete_coach_link()
returns table (
  relationship_id uuid,
  status coach_link_status,
  coach_id uuid,
  coach_name text,
  requested_at timestamptz,
  linked_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ca.id as relationship_id,
    ca.status,
    ca.coach_id,
    p.full_name as coach_name,
    ca.created_at as requested_at,
    ca.linked_at
  from coach_athletes ca
  join profiles p on p.id = ca.coach_id
  where ca.athlete_id = auth.uid()
    and ca.unlinked_at is null
    and ca.status in ('pending', 'active')
    and p.deleted_at is null
  order by ca.created_at desc
  limit 1;
$$;

create or replace function public.get_coach_pending_invites()
returns table (
  relationship_id uuid,
  athlete_id uuid,
  athlete_name text,
  athlete_email text,
  requested_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ca.id as relationship_id,
    p.id as athlete_id,
    p.full_name as athlete_name,
    u.email::text as athlete_email,
    ca.created_at as requested_at
  from coach_athletes ca
  join profiles p on p.id = ca.athlete_id
  join auth.users u on u.id = p.id
  where ca.coach_id = auth.uid()
    and ca.status = 'pending'
    and ca.unlinked_at is null
    and p.deleted_at is null
  order by ca.created_at asc;
$$;

create or replace function public.count_coach_pending_invites()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from coach_athletes ca
  join profiles p on p.id = ca.athlete_id
  where ca.coach_id = auth.uid()
    and ca.status = 'pending'
    and ca.unlinked_at is null
    and p.deleted_at is null;
$$;

create or replace function public.get_coach_athlete_relationship(p_athlete_id uuid)
returns table (
  relationship_id uuid,
  status coach_link_status,
  athlete_id uuid,
  athlete_name text,
  athlete_email text,
  linked_at timestamptz
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
    ca.linked_at
  from coach_athletes ca
  join profiles p on p.id = ca.athlete_id
  join auth.users u on u.id = p.id
  where ca.coach_id = auth.uid()
    and ca.athlete_id = p_athlete_id
    and ca.unlinked_at is null
    and ca.status in ('pending', 'active')
    and p.deleted_at is null
  limit 1;
$$;

-- Active athletes only on the main list.
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
