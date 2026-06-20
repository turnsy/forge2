-- Chat session snapshots for coach plan workspace persistence.

create table chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  snapshot    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index chat_sessions_coach_id_idx on chat_sessions (coach_id);
create index chat_sessions_updated_at_idx on chat_sessions (updated_at desc);

alter table chat_sessions enable row level security;

create policy "chat_sessions: coach full access"
  on chat_sessions for all
  using (coach_id = auth.uid());

create or replace function update_chat_session_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger chat_sessions_updated_at
  before update on chat_sessions
  for each row execute procedure update_chat_session_timestamp();
