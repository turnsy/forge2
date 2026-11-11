do $$begin if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; end$$;
create type coach_link_status as enum ('pending','active');
create type assignment_status as enum ('active','completed','unassigned');
alter default privileges in schema public grant all on tables to anon, authenticated;
create schema auth;
create table auth.users(id uuid primary key,email text);

create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
create table profiles(id uuid primary key,role text,deleted_at timestamptz,full_name text,invite_code text);
create table coach_athletes(id uuid primary key default gen_random_uuid(),coach_id uuid,athlete_id uuid,status coach_link_status,linked_at timestamptz,created_at timestamptz default now(),unlinked_at timestamptz);
create table assigned_plans(id uuid primary key,coach_id uuid,athlete_id uuid,status assignment_status,plan_id uuid,plan_data jsonb);
alter table coach_athletes enable row level security;
create policy links_read on coach_athletes for select to authenticated using(coach_id=auth.uid() or athlete_id=auth.uid());
grant select on profiles,coach_athletes,assigned_plans to authenticated;
