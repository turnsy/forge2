-- Allow OAuth signups to complete role selection after account creation.

alter table profiles alter column role drop not null;

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _role user_role;
  _invite text;
begin
  if new.raw_user_meta_data->>'role' is not null then
    _role := (new.raw_user_meta_data->>'role')::user_role;
  end if;

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

-- Called after OAuth onboarding to set role and generate coach invite codes.
create or replace function complete_profile_role(
  target_role user_role,
  target_full_name text default null
)
returns void language plpgsql security definer as $$
declare
  _invite text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if target_role = 'coach' then
    _invite := substr(md5(random()::text), 1, 8);
  end if;

  update profiles
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

revoke all on function complete_profile_role(user_role, text) from public;
grant execute on function complete_profile_role(user_role, text) to authenticated;
