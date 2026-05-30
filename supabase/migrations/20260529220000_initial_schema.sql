-- Coach <> Athlete App — initial schema
-- Types, tables, triggers, and row-level security policies.

-- ============================================================
-- TYPES
-- ============================================================

create type user_role as enum ('coach', 'athlete');
create type assignment_status as enum ('active', 'completed', 'unassigned');


-- ============================================================
-- PROFILES
-- Maps 1:1 with auth.users. Auto-created via trigger on signup.
-- ============================================================

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role not null,
  full_name       text,
  -- Coaches only. Unique short code athletes use to link.
  invite_code     text unique,
  -- Flexible metadata per role.
  -- Coaches: { bio, website, specialties[] }
  -- Athletes: { date_of_birth, timezone, phone }
  contact_info    jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  -- Soft delete. Supabase Auth deletion should be triggered separately.
  deleted_at      timestamptz
);

-- Only coaches have invite codes; ensure athletes can't get one.
create unique index profiles_invite_code_idx
  on profiles (invite_code)
  where invite_code is not null;

-- Auto-create a profile row when a new auth user signs up.
-- Pass role + full_name in the signup metadata: { data: { role, full_name } }
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _role user_role;
  _invite text;
begin
  _role := (new.raw_user_meta_data->>'role')::user_role;

  -- Generate invite code for coaches only
  if _role = 'coach' then
    _invite := substr(md5(random()::text), 1, 8);
  end if;

  insert into profiles (id, role, full_name, invite_code)
  values (
    new.id,
    _role,
    new.raw_user_meta_data->>'full_name',
    _invite
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ============================================================
-- COACH_ATHLETES
-- Relationship between a coach and an athlete.
-- Athlete links via coach's invite_code; coach can revoke.
-- An athlete can only have one active coach at a time (partial unique index).
-- ============================================================

create table coach_athletes (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references profiles(id) on delete cascade,
  athlete_id    uuid not null references profiles(id) on delete cascade,
  linked_at     timestamptz not null default now(),
  unlinked_at   timestamptz
);

-- Enforce one active coach per athlete at the DB level.
create unique index coach_athletes_one_active_coach_idx
  on coach_athletes (athlete_id)
  where unlinked_at is null;

-- Fast lookups both ways.
create index coach_athletes_coach_id_idx   on coach_athletes (coach_id);
create index coach_athletes_athlete_id_idx on coach_athletes (athlete_id);


-- ============================================================
-- PLANS
-- The metadata shell for a coach's workout plan.
-- Actual plan content lives in plan_versions.
-- ============================================================

create table plans (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index plans_coach_id_idx on plans (coach_id);


-- ============================================================
-- PLAN_VERSIONS
-- Immutable snapshots of a plan. Each AI edit or manual save
-- creates a new version. Supports rollback.
-- ============================================================

create table plan_versions (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references plans(id) on delete cascade,
  -- Full plan JSON blob (your existing workout plan schema).
  plan_data       jsonb not null,
  -- Human-readable note for the rollback UI. e.g. "Added week 3 deload"
  change_summary  text,
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now()
);

create index plan_versions_plan_id_idx on plan_versions (plan_id);

alter table plans
  add column active_version_id uuid references plan_versions(id) on delete set null;

create index plans_active_version_id_idx on plans (active_version_id);


-- ============================================================
-- ASSIGNED_PLANS
-- The live athlete copy of a plan version.
-- plan_data is cloned from plan_versions.plan_data at assignment
-- time and mutated as the athlete fills in their workouts.
-- Historical assignments are kept (never deleted) for progress history.
-- ============================================================

create table assigned_plans (
  id                uuid primary key default gen_random_uuid(),
  -- Which plan and which version was assigned.
  plan_id           uuid not null references plans(id),
  plan_version_id   uuid not null references plan_versions(id),
  athlete_id        uuid not null references profiles(id) on delete cascade,
  coach_id          uuid not null references profiles(id) on delete cascade,
  status            assignment_status not null default 'active',
  -- Clone of plan_versions.plan_data at assignment time.
  -- Gets filled in progressively as athlete logs workouts.
  plan_data         jsonb not null,
  assigned_at       timestamptz not null default now(),
  -- Set when all exercises across all days/weeks are complete.
  completed_at      timestamptz,
  -- Set when coach unassigns (athlete keeps history row).
  unassigned_at     timestamptz
);

-- Enforce one active assignment per athlete at the DB level.
create unique index assigned_plans_one_active_idx
  on assigned_plans (athlete_id)
  where status = 'active';

create index assigned_plans_athlete_id_idx on assigned_plans (athlete_id);
create index assigned_plans_coach_id_idx   on assigned_plans (coach_id);
create index assigned_plans_plan_id_idx    on assigned_plans (plan_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles       enable row level security;
alter table coach_athletes enable row level security;
alter table plans          enable row level security;
alter table plan_versions  enable row level security;
alter table assigned_plans enable row level security;


-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

-- Anyone can read non-deleted profiles (needed for invite code lookup).
create policy "profiles: public read"
  on profiles for select
  using (deleted_at is null);

-- Users can only update their own profile.
create policy "profiles: self update"
  on profiles for update
  using (auth.uid() = id);


-- ------------------------------------------------------------
-- coach_athletes
-- ------------------------------------------------------------

-- Coaches see their own athlete relationships.
create policy "coach_athletes: coach read"
  on coach_athletes for select
  using (coach_id = auth.uid());

-- Athletes see their own coach relationship.
create policy "coach_athletes: athlete read"
  on coach_athletes for select
  using (athlete_id = auth.uid());

-- Athletes can link themselves to a coach (insert).
create policy "coach_athletes: athlete insert"
  on coach_athletes for insert
  with check (athlete_id = auth.uid());

-- Both parties can update (coach revokes, athlete unlinks).
create policy "coach_athletes: update"
  on coach_athletes for update
  using (coach_id = auth.uid() or athlete_id = auth.uid());


-- ------------------------------------------------------------
-- plans
-- ------------------------------------------------------------

-- Coaches can CRUD their own plans.
create policy "plans: coach full access"
  on plans for all
  using (coach_id = auth.uid());

-- Athletes can read plans they are assigned to.
create policy "plans: athlete read assigned"
  on plans for select
  using (
    exists (
      select 1 from assigned_plans ap
      where ap.plan_id = plans.id
        and ap.athlete_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- plan_versions
-- ------------------------------------------------------------

-- Coaches can CRUD versions of their own plans.
create policy "plan_versions: coach full access"
  on plan_versions for all
  using (
    exists (
      select 1 from plans p
      where p.id = plan_versions.plan_id
        and p.coach_id = auth.uid()
    )
  );

-- Athletes can read versions they are assigned to.
create policy "plan_versions: athlete read assigned"
  on plan_versions for select
  using (
    exists (
      select 1 from assigned_plans ap
      where ap.plan_version_id = plan_versions.id
        and ap.athlete_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- assigned_plans
-- ------------------------------------------------------------

-- Coaches can manage assignments for their athletes.
create policy "assigned_plans: coach full access"
  on assigned_plans for all
  using (coach_id = auth.uid());

-- Athletes can read and update (fill in plan_data) their own assignments.
create policy "assigned_plans: athlete read"
  on assigned_plans for select
  using (athlete_id = auth.uid());

create policy "assigned_plans: athlete update"
  on assigned_plans for update
  using (athlete_id = auth.uid());
