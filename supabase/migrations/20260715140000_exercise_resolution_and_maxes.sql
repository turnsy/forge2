-- Canonical exercises, semantic search embeddings, and athlete max history.
create extension if not exists vector;

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  owner_coach_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index exercises_global_or_owner_name_idx
  on exercises (coalesce(owner_coach_id, '00000000-0000-0000-0000-000000000000'::uuid), normalized_name);
create index exercises_normalized_name_idx on exercises (normalized_name);

create table exercise_embeddings (
  exercise_id uuid primary key references exercises(id) on delete cascade,
  embedding vector(1536) not null,
  source_text text not null,
  created_at timestamptz not null default now()
);

create index exercise_embeddings_cosine_idx
  on exercise_embeddings using hnsw (embedding vector_cosine_ops);

create or replace function public.search_exercises(
  p_coach_id uuid,
  p_embedding vector(1536),
  p_limit integer default 5
)
returns table (id uuid, name text, owner_coach_id uuid, score double precision)
language sql
security definer
set search_path = public
as $$
  select e.id, e.name, e.owner_coach_id,
    1 - (ee.embedding <=> p_embedding) as score
  from exercise_embeddings ee
  join exercises e on e.id = ee.exercise_id
  where e.owner_coach_id is null or e.owner_coach_id = p_coach_id
  order by ee.embedding <=> p_embedding
  limit greatest(1, least(p_limit, 20));
$$;

revoke all on function public.search_exercises(uuid, vector, integer) from public;
grant execute on function public.search_exercises(uuid, vector, integer) to authenticated;

create table athlete_maxes (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  value numeric not null check (value > 0),
  unit text not null,
  source text not null check (source in (
    'tested', 'coach_entered', 'athlete_entered', 'estimated_from_log'
  )),
  logged_at timestamptz not null default now()
);

create index athlete_maxes_lookup_idx
  on athlete_maxes (athlete_id, exercise_id, logged_at desc);

alter table exercises enable row level security;
alter table exercise_embeddings enable row level security;
alter table athlete_maxes enable row level security;

create policy "exercises: global and own read"
  on exercises for select to authenticated
  using (owner_coach_id is null or owner_coach_id = auth.uid());

create policy "exercises: coach insert"
  on exercises for insert to authenticated
  with check (owner_coach_id = auth.uid());

create policy "athlete_maxes: athlete read"
  on athlete_maxes for select to authenticated
  using (athlete_id = auth.uid());

create policy "athlete_maxes: athlete insert"
  on athlete_maxes for insert to authenticated
  with check (athlete_id = auth.uid());

create policy "athlete_maxes: coach read linked athlete"
  on athlete_maxes for select to authenticated
  using (exists (
    select 1 from coach_athletes ca
    where ca.coach_id = auth.uid()
      and ca.athlete_id = athlete_maxes.athlete_id
      and ca.unlinked_at is null
  ));

create or replace function public.list_athlete_maxes(
  p_athlete_id uuid,
  p_exercise_ids uuid[] default null
)
returns table (
  id uuid,
  athlete_id uuid,
  exercise_id uuid,
  value numeric,
  unit text,
  source text,
  logged_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select am.id, am.athlete_id, am.exercise_id, am.value, am.unit, am.source, am.logged_at
  from athlete_maxes am
  where am.athlete_id = p_athlete_id
    and (am.athlete_id = auth.uid() or exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_id = am.athlete_id
        and ca.unlinked_at is null
    ))
    and (p_exercise_ids is null or am.exercise_id = any(p_exercise_ids))
  order by am.logged_at desc;
$$;

create or replace function public.insert_athlete_max(
  p_athlete_id uuid,
  p_exercise_id uuid,
  p_value numeric,
  p_unit text,
  p_source text
)
returns athlete_maxes
language plpgsql
security definer
set search_path = public
as $$
declare result athlete_maxes;
begin
  if not (
    p_athlete_id = auth.uid()
    or exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_id = p_athlete_id
        and ca.unlinked_at is null
    )
  ) then
    raise exception 'Athlete not found' using errcode = 'P0002';
  end if;

  insert into athlete_maxes (athlete_id, exercise_id, value, unit, source)
  values (p_athlete_id, p_exercise_id, p_value, p_unit, p_source)
  returning * into result;
  return result;
end;
$$;

revoke all on function public.list_athlete_maxes(uuid, uuid[]) from public;
grant execute on function public.list_athlete_maxes(uuid, uuid[]) to authenticated;
revoke all on function public.insert_athlete_max(uuid, uuid, numeric, text, text) from public;
grant execute on function public.insert_athlete_max(uuid, uuid, numeric, text, text) to authenticated;
