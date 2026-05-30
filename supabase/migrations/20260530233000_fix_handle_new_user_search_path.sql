-- handle_new_user runs as supabase_auth_admin on auth.users inserts, outside public
-- schema search_path. Qualify types/tables and pin search_path so user_role resolves.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.user_role;
  _invite text;
begin
  if new.raw_user_meta_data->>'role' is not null then
    _role := (new.raw_user_meta_data->>'role')::public.user_role;
  end if;

  if _role = 'coach' then
    _invite := substr(md5(random()::text), 1, 8);
  end if;

  insert into public.profiles (id, role, full_name, invite_code)
  values (
    new.id,
    _role,
    new.raw_user_meta_data->>'full_name',
    _invite
  );
  return new;
end;
$$;

create or replace function public.complete_profile_role(
  target_role public.user_role,
  target_full_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _invite text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if target_role = 'coach' then
    _invite := substr(md5(random()::text), 1, 8);
  end if;

  update public.profiles
  set
    role = target_role,
    full_name = coalesce(target_full_name, full_name),
    invite_code = case
      when target_role = 'coach' then coalesce(invite_code, _invite)
      else invite_code
    end
  where id = auth.uid()
    and role is null;
end;
$$;

revoke all on function public.complete_profile_role(public.user_role, text) from public;
grant execute on function public.complete_profile_role(public.user_role, text) to authenticated;
