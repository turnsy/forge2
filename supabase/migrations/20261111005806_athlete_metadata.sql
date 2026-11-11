-- Coach-scoped custom profiles. Required answers never gate linking or plans.
create table public.athlete_metadata_fields (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id),
  definition jsonb not null,
  version integer not null default 1 check(version > 0),
  created_at timestamptz not null default now(),
  unique(id, coach_id)
);
create index metadata_fields_coach on public.athlete_metadata_fields(coach_id);
create table public.athlete_metadata_values (
  field_id uuid not null,
  coach_id uuid not null,
  athlete_id uuid not null references public.profiles(id),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id),
  primary key(field_id, athlete_id),
  foreign key(field_id, coach_id) references public.athlete_metadata_fields(id, coach_id)
);
create index metadata_values_roster on public.athlete_metadata_values(coach_id, athlete_id);
create table public.athlete_metadata_value_events (
  id bigint generated always as identity primary key,
  field_id uuid not null,
  coach_id uuid not null,
  athlete_id uuid not null references public.profiles(id),
  old_value jsonb,
  value jsonb not null,
  definition jsonb not null,
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key(field_id, coach_id) references public.athlete_metadata_fields(id, coach_id)
);
create index metadata_events_athlete on public.athlete_metadata_value_events(coach_id, athlete_id, id desc);
alter table public.athlete_metadata_fields enable row level security;
alter table public.athlete_metadata_values enable row level security;
alter table public.athlete_metadata_value_events enable row level security;

create policy metadata_fields_read on public.athlete_metadata_fields for select to authenticated using (
  coach_id = (select auth.uid()) or exists(select 1 from public.coach_athletes ca where ca.coach_id = athlete_metadata_fields.coach_id and ca.athlete_id = (select auth.uid()) and ca.unlinked_at is null)
);
create policy metadata_fields_write on public.athlete_metadata_fields for all to authenticated
using (coach_id = (select auth.uid())) with check (coach_id = (select auth.uid()) and exists(select 1 from public.profiles where id = auth.uid() and role = 'coach' and deleted_at is null));
create policy metadata_values_read on public.athlete_metadata_values for select to authenticated using (
  coach_id = (select auth.uid()) or exists(select 1 from public.coach_athletes ca where ca.coach_id = athlete_metadata_values.coach_id and ca.athlete_id = athlete_metadata_values.athlete_id and ca.unlinked_at is null and (ca.coach_id = (select auth.uid()) or ca.athlete_id = (select auth.uid())))
);
create policy metadata_values_write on public.athlete_metadata_values for all to authenticated
using (exists(select 1 from public.coach_athletes ca where ca.coach_id = athlete_metadata_values.coach_id and ca.athlete_id = athlete_metadata_values.athlete_id and ca.unlinked_at is null and (ca.coach_id = (select auth.uid()) or ca.athlete_id = (select auth.uid()))))
with check (exists(select 1 from public.coach_athletes ca where ca.coach_id = athlete_metadata_values.coach_id and ca.athlete_id = athlete_metadata_values.athlete_id and ca.unlinked_at is null and (ca.coach_id = (select auth.uid()) or ca.athlete_id = (select auth.uid()))));
create policy metadata_history_read on public.athlete_metadata_value_events for select to authenticated using (
  exists(select 1 from public.coach_athletes ca where ca.coach_id = athlete_metadata_value_events.coach_id and ca.athlete_id = athlete_metadata_value_events.athlete_id and ca.unlinked_at is null and (ca.coach_id = (select auth.uid()) or ca.athlete_id = (select auth.uid())))
);
-- Supabase projects can have permissive default table grants. Restrict explicitly.
revoke all on public.athlete_metadata_fields, public.athlete_metadata_values, public.athlete_metadata_value_events from public, anon, authenticated;
revoke all on sequence public.athlete_metadata_value_events_id_seq from public, anon, authenticated;
grant select, insert, update on public.athlete_metadata_fields, public.athlete_metadata_values to authenticated;
grant select on public.athlete_metadata_value_events to authenticated;
-- No delete grants: clears are explicit JSON null events. History is never client writable.

create function public.metadata_value_valid(d jsonb, v jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare t text := d->>'type'; n numeric; s text; item jsonb;
begin
  if v = 'null'::jsonb then return true; end if;
  if t = 'text' then return jsonb_typeof(v) = 'string' and length(btrim(v #>> '{}')) between 1 and coalesce((d->>'maxLength')::int,10000); end if;
  if t = 'number' then
    if jsonb_typeof(v) <> 'number' then return false; end if;
    n := (v #>> '{}')::numeric;
    return (not d ? 'min' or n >= (d->>'min')::numeric) and (not d ? 'max' or n <= (d->>'max')::numeric) and (not d ? 'precision' or n = round(n,(d->>'precision')::int));
  end if;
  if t = 'boolean' then return jsonb_typeof(v) = 'boolean'; end if;
  if t = 'date' then
    s := v #>> '{}';
    return jsonb_typeof(v) = 'string' and s ~ '^\d{4}-\d{2}-\d{2}$' and to_char(s::date,'YYYY-MM-DD') = s;
  end if;
  if t = 'single_select' then return jsonb_typeof(v) = 'string' and exists(select 1 from jsonb_array_elements(d->'options') o where o->>'id' = v #>> '{}' and not coalesce((o->>'archived')::boolean,false)); end if;
  if t = 'multi_select' then
    if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) = 0 then return false; end if;
    if (select count(*) <> count(distinct x) from jsonb_array_elements(v) x) then return false; end if;
    for item in select * from jsonb_array_elements(v) loop
      if not public.metadata_value_valid(d || '{"type":"single_select"}'::jsonb,item) then return false; end if;
    end loop;
    return true;
  end if;
  return false;
exception when others then return false;
end;
$$;

-- Known conversions only. Arbitrary units still work when left unchanged.
create function public.metadata_unit_factor(p_from text, p_to text) returns numeric
language sql immutable security invoker set search_path = '' as $$
  select case
    when p_from = p_to then 1::numeric
    when p_from='kg' and p_to='lb' then 1::numeric / 0.45359237
    when p_from='lb' and p_to='kg' then 0.45359237
    when p_from in ('cm','in','m') and p_to in ('cm','in','m') then
      (case p_from when 'cm' then 1::numeric when 'in' then 2.54 when 'm' then 100 end) /
      (case p_to when 'cm' then 1::numeric when 'in' then 2.54 when 'm' then 100 end)
    else null end;
$$;
revoke all on function public.metadata_unit_factor(text,text) from public, anon;
grant execute on function public.metadata_unit_factor(text,text) to authenticated;

create function public.metadata_validate_definition() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare d jsonb := new.definition; o jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.id::text,0));
  if jsonb_typeof(d) <> 'object' or jsonb_typeof(d->'label') is distinct from 'string' or coalesce(length(btrim(d->>'label')),0) not between 1 and 100 or
    coalesce(d->>'type','') not in ('text','number','single_select','multi_select','boolean','date') or
    jsonb_typeof(d->'required') is distinct from 'boolean' or jsonb_typeof(d->'archived') is distinct from 'boolean' or
    jsonb_typeof(d->'options') is distinct from 'array' or jsonb_array_length(d->'options') > 100 or
    coalesce((d->>'position')::numeric,-1) < 0 or (d->>'position')::numeric <> trunc((d->>'position')::numeric) then raise exception 'Invalid field definition'; end if;
  if exists(select 1 from jsonb_object_keys(d) key where key not in ('label','description','type','required','unit','min','max','precision','maxLength','semantic','position','archived','options')) then raise exception 'Unknown field configuration'; end if;
  if d ? 'unit' and jsonb_typeof(d->'unit') <> 'string' or d ? 'description' and jsonb_typeof(d->'description') <> 'string' or jsonb_typeof(d->'position') is distinct from 'number' then raise exception 'Invalid field configuration types'; end if;
  if length(coalesce(d->>'description','')) > 500 or length(coalesce(d->>'unit','')) > 30 then raise exception 'Field description or unit too long'; end if;
  if d ? 'semantic' and (d->>'semantic' <> 'birth_date' or d->>'type' <> 'date') then raise exception 'Birth date must be a date'; end if;
  if d ? 'min' and jsonb_typeof(d->'min') <> 'number' or d ? 'max' and jsonb_typeof(d->'max') <> 'number' then raise exception 'Invalid bounds'; end if;
  if (d->>'min')::numeric > (d->>'max')::numeric then raise exception 'Minimum exceeds maximum'; end if;
  if d ? 'precision' and (jsonb_typeof(d->'precision') <> 'number' or (d->>'precision')::numeric not between 0 and 8 or (d->>'precision')::numeric <> trunc((d->>'precision')::numeric)) then raise exception 'Invalid precision'; end if;
  if d ? 'maxLength' and (jsonb_typeof(d->'maxLength') <> 'number' or (d->>'maxLength')::numeric not between 1 and 10000 or (d->>'maxLength')::numeric <> trunc((d->>'maxLength')::numeric)) then raise exception 'Invalid text length'; end if;
  if (select count(*) <> count(distinct x->>'id') from jsonb_array_elements(d->'options') x) then raise exception 'Duplicate option IDs'; end if;
  for o in select * from jsonb_array_elements(d->'options') loop
    if o ? 'archived' and jsonb_typeof(o->'archived') <> 'boolean' then raise exception 'Invalid option archive flag'; end if;
    if exists(select 1 from jsonb_object_keys(o) key where key not in ('id','label','archived')) then raise exception 'Unknown option configuration'; end if;
    if jsonb_typeof(o->'id') is distinct from 'string' or coalesce(length(o->>'id'),0) not between 1 and 100 or jsonb_typeof(o->'label') is distinct from 'string' or coalesce(length(btrim(o->>'label')),0) not between 1 and 100 then raise exception 'Invalid option'; end if;
  end loop;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.coach_id <> old.coach_id then raise exception 'Cannot change field ownership'; end if;
    if new.version <> old.version + 1 then raise exception 'Field changed. Refresh and try again.'; end if;
    if exists(select 1 from public.athlete_metadata_values where field_id = old.id) then
      if old.definition->>'type' is distinct from d->>'type' or old.definition->>'semantic' is distinct from d->>'semantic' or (old.definition->>'unit' is distinct from d->>'unit' and (d->>'type' <> 'number' or public.metadata_unit_factor(old.definition->>'unit',d->>'unit') is null)) then raise exception 'Archive this field and create a replacement to change its type, unit, or meaning.'; end if;
      if exists(select 1 from jsonb_array_elements(old.definition->'options') prev where not exists(select 1 from jsonb_array_elements(d->'options') curr where curr->>'id' = prev->>'id')) then raise exception 'Archive options instead of removing their IDs.'; end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger metadata_definition_guard before insert or update on public.athlete_metadata_fields for each row execute function public.metadata_validate_definition();

create function public.metadata_validate_answer() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare d jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.field_id::text,0));
  if tg_op = 'UPDATE' and (new.field_id <> old.field_id or new.coach_id <> old.coach_id or new.athlete_id <> old.athlete_id) then raise exception 'Cannot change answer ownership'; end if;
  select definition into d from public.athlete_metadata_fields where id = new.field_id and coach_id = new.coach_id;
  if d is null or (d->>'archived')::boolean or not public.metadata_value_valid(d,new.value) then raise exception 'Invalid answer or archived field'; end if;
  if d->>'semantic' = 'birth_date' and new.value <> 'null'::jsonb then
    if (new.value #>> '{}')::date > current_date then raise exception 'Birth date cannot be in the future'; end if;
  end if;
  new.updated_at := clock_timestamp(); new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger metadata_answer_guard before insert or update on public.athlete_metadata_values for each row execute function public.metadata_validate_answer();

-- Trigger-only definer: needed because callers cannot forge or edit history rows.
create function public.metadata_log_answer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.value is distinct from old.value then
    insert into public.athlete_metadata_value_events(field_id,coach_id,athlete_id,old_value,value,actor_id,definition)
    values(new.field_id,new.coach_id,new.athlete_id,case when tg_op = 'UPDATE' then old.value else null end,new.value,auth.uid(),(select definition from public.athlete_metadata_fields where id=new.field_id));
  end if;
  return new;
end;
$$;
revoke all on function public.metadata_log_answer() from public, anon, authenticated;
create trigger metadata_answer_history after insert or update on public.athlete_metadata_values for each row execute function public.metadata_log_answer();

-- Trigger-only definer converts retained rows too, including ended relationships.
-- A field change and all converted current values/history commit atomically.
create function public.metadata_convert_units() returns trigger
language plpgsql security definer set search_path = '' as $$
declare factor numeric;
begin
  if new.definition->>'unit' is distinct from old.definition->>'unit' then
    if auth.uid() is distinct from new.coach_id then raise exception 'Only the field owner can convert units'; end if;
    factor := public.metadata_unit_factor(old.definition->>'unit',new.definition->>'unit');
    if factor is not null and new.definition->>'type'='number' then
      update public.athlete_metadata_values set value=to_jsonb(case when new.definition ? 'precision' then round((value #>> '{}')::numeric * factor,(new.definition->>'precision')::int) else (value #>> '{}')::numeric * factor end)
      where field_id=new.id and value <> 'null'::jsonb;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.metadata_convert_units() from public, anon, authenticated;
create trigger metadata_unit_conversion after update on public.athlete_metadata_fields for each row execute function public.metadata_convert_units();

-- Atomic batch saves check definition versions and relationship access under RLS.
create function public.set_athlete_metadata(p_coach_id uuid, p_athlete_id uuid, p_answers jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare a jsonb; f public.athlete_metadata_fields;
begin
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 100 then raise exception 'Invalid answers'; end if;
  if not exists(select 1 from public.coach_athletes where coach_id=p_coach_id and athlete_id=p_athlete_id and unlinked_at is null and (coach_id=auth.uid() or athlete_id=auth.uid())) then raise exception 'Athlete not linked'; end if;
  for a in select * from jsonb_array_elements(p_answers) order by value->>'fieldId' loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(a->>'fieldId',0));
    select * into f from public.athlete_metadata_fields where id=(a->>'fieldId')::uuid and coach_id=p_coach_id;
    if f.id is null or f.version <> (a->>'version')::int or not a ? 'version' or not a ? 'value' then raise exception 'Field changed. Refresh and try again.'; end if;
    insert into public.athlete_metadata_values(field_id,coach_id,athlete_id,value,updated_by)
    values(f.id,p_coach_id,p_athlete_id,a->'value',auth.uid())
    on conflict(field_id,athlete_id) do update set value=excluded.value;
  end loop;
end;
$$;
revoke all on function public.set_athlete_metadata(uuid,uuid,jsonb) from public, anon;
grant execute on function public.set_athlete_metadata(uuid,uuid,jsonb) to authenticated;

create function public.metadata_filter_matches(d jsonb, v jsonb, f jsonb) returns boolean
language plpgsql stable security invoker set search_path = '' as $$
declare op text := f->>'op'; x jsonb := f->'value'; n numeric; lo numeric; hi numeric; s text;
begin
  if op = 'missing' then return v is null or v = 'null'::jsonb or not public.metadata_value_valid(d,v); end if;
  if op = 'answered' then return v is not null and v <> 'null'::jsonb and public.metadata_value_valid(d,v); end if;
  if v is null or v = 'null'::jsonb or not public.metadata_value_valid(d,v) then return false; end if;
  if op = 'age_between' then
    if d->>'semantic' is distinct from 'birth_date' then return false; end if;
    n := extract(year from age(coalesce((f->>'asOf')::date,current_date),(v #>> '{}')::date));
    return n between (x #>> '{}')::numeric and (f->>'upper')::numeric;
  end if;
  if op = 'eq' then return v = x; end if;
  if op = 'contains' then return position(lower(x #>> '{}') in lower(v #>> '{}')) > 0; end if;
  if op = 'any' then return exists(select 1 from jsonb_array_elements(x) item where v = item or (jsonb_typeof(v)='array' and v @> jsonb_build_array(item))); end if;
  if op = 'all' then return v @> x; end if;
  if d->>'type' = 'number' then
    n := (v #>> '{}')::numeric; lo := (x #>> '{}')::numeric; hi := (f->>'upper')::numeric;
    return case op when 'gte' then n >= lo when 'lte' then n <= lo when 'between' then n between lo and hi else false end;
  end if;
  if d->>'type' = 'date' then
    s := v #>> '{}';
    return case op when 'gte' then s >= x #>> '{}' when 'lte' then s <= x #>> '{}' when 'between' then s >= x #>> '{}' and s <= f->>'upper' else false end;
  end if;
  return false;
exception when others then return false;
end;
$$;

create function public.list_metadata_athletes(p_filters jsonb default '[]', p_search text default null, p_status text default 'active', p_limit integer default 10, p_offset integer default 0, p_include boolean default false, p_incomplete boolean default false)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb; input_filter jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='coach' and deleted_at is null) then raise exception 'Only coaches can list athletes'; end if;
  if p_status not in ('active','pending') or p_limit not between 1 and 100 or p_offset < 0 or jsonb_typeof(p_filters) <> 'array' or jsonb_array_length(p_filters)>30 then raise exception 'Invalid query'; end if;
  for input_filter in select * from jsonb_array_elements(p_filters) loop
    if not exists(select 1 from public.athlete_metadata_fields where id=(input_filter->>'fieldId')::uuid and coach_id=auth.uid() and not (definition->>'archived')::boolean) or coalesce(input_filter->>'op','') not in ('eq','contains','any','all','gte','lte','between','missing','answered','age_between') then raise exception 'Invalid metadata filter'; end if;
  end loop;
  with fields as (
    select * from public.athlete_metadata_fields where coach_id=auth.uid() and not (definition->>'archived')::boolean
  ), candidates as (
    select ca.athlete_id as id, ca.id as relationship_id, ca.status, ca.linked_at, ca.created_at as requested_at,
      coalesce(nullif(btrim(p.full_name),''),'Unnamed athlete') as name,
      (select coalesce(jsonb_agg(m.id),'[]') from fields m where (m.definition->>'required')::boolean and not exists(select 1 from public.athlete_metadata_values v where v.field_id=m.id and v.athlete_id=ca.athlete_id and v.value <> 'null'::jsonb and public.metadata_value_valid(m.definition,v.value))) as missing
    from public.coach_athletes ca join public.profiles p on p.id=ca.athlete_id
    where ca.coach_id=auth.uid() and ca.status::text=p_status and ca.unlinked_at is null and p.deleted_at is null
      and (p_search is null or position(lower(p_search) in lower(coalesce(p.full_name,'')))>0)
      and not exists(select 1 from jsonb_array_elements(p_filters) f join fields m on m.id=(f->>'fieldId')::uuid
        left join public.athlete_metadata_values v on v.field_id=m.id and v.athlete_id=ca.athlete_id
        where not public.metadata_filter_matches(m.definition,v.value,f))
  ), matched as (select * from candidates where not p_incomplete or jsonb_array_length(missing)>0), paged as (
    select * from matched order by name,id limit p_limit offset p_offset
  )
  select jsonb_build_object('total',(select count(*) from matched),'items',coalesce((select jsonb_agg(to_jsonb(paged) || jsonb_build_object(
    'metadata',case when p_include then coalesce((select jsonb_agg(jsonb_build_object('field_id',v.field_id,'value',v.value,'updated_at',v.updated_at,'updated_by',v.updated_by)) from public.athlete_metadata_values v join fields m on m.id=v.field_id where v.athlete_id=paged.id),'[]') else 'null'::jsonb end,
    'currentPlanId',(select a.plan_id from public.assigned_plans a where a.coach_id=auth.uid() and a.athlete_id=paged.id and a.status='active' limit 1),
    'currentPlanName',(select a.plan_data->>'name' from public.assigned_plans a where a.coach_id=auth.uid() and a.athlete_id=paged.id and a.status='active' limit 1)
  )) from paged),'[]')) into result;
  return result;
end;
$$;
revoke all on function public.list_metadata_athletes(jsonb,text,text,integer,integer,boolean,boolean) from public, anon;
grant execute on function public.list_metadata_athletes(jsonb,text,text,integer,integer,boolean,boolean) to authenticated;

-- Narrow invite-code lookup is needed before a pending relationship exists.
create function public.get_metadata_invite_fields(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare cid uuid; result jsonb;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='athlete' and deleted_at is null) then raise exception 'Only athletes can view intake'; end if;
  select id into cid from public.profiles where invite_code=upper(btrim(p_code)) and role='coach' and deleted_at is null;
  if cid is null then raise exception 'Invalid invite code'; end if;
  select jsonb_build_object('fields',coalesce(jsonb_agg(definition || jsonb_build_object('id',id,'coach_id',coach_id,'version',version) order by (definition->>'position')::int,created_at),'[]')) into result
  from public.athlete_metadata_fields where coach_id=cid and not (definition->>'archived')::boolean;
  return result;
end;
$$;
revoke all on function public.get_metadata_invite_fields(text) from public, anon;
grant execute on function public.get_metadata_invite_fields(text) to authenticated;
create function public.request_coach_link_with_metadata(p_code text, p_answers jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare rid uuid; cid uuid;
begin
  rid := public.request_coach_link(p_code);
  select coach_id into cid from public.coach_athletes where id=rid;
  perform public.set_athlete_metadata(cid,auth.uid(),p_answers);
  return rid;
end;
$$;
revoke all on function public.request_coach_link_with_metadata(text,jsonb) from public, anon;
grant execute on function public.request_coach_link_with_metadata(text,jsonb) to authenticated;
-- Helper functions are callable only by authenticated users; none bypass RLS.
revoke all on function public.metadata_value_valid(jsonb,jsonb), public.metadata_filter_matches(jsonb,jsonb,jsonb), public.metadata_validate_definition(), public.metadata_validate_answer() from public, anon;
grant execute on function public.metadata_value_valid(jsonb,jsonb), public.metadata_filter_matches(jsonb,jsonb,jsonb), public.metadata_validate_definition(), public.metadata_validate_answer() to authenticated;

-- Bounded roster projection. Definer required only to read auth.users.email;
-- scope/role checks mirror the existing coach roster RPC.
create or replace function public.get_metadata_roster_details(
  p_athlete_ids uuid[]
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
set search_path = public, pg_temp
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
      -- completion_percent: share of plan days where every set has status
      -- 'completed' (0-100). Null when the athlete has no active assignment.
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
                  from (
                    -- Current block-based plans and legacy flat day layouts.
                    select value as exercise from jsonb_array_elements(coalesce(d->'exercises', '[]'::jsonb))
                    union all
                    select e.value as exercise
                    from jsonb_array_elements(coalesce(d->'blocks', '[]'::jsonb)) b
                    cross join lateral jsonb_array_elements(b.value->'exercises') e
                  ) exercises
                  cross join lateral jsonb_array_elements(exercises.exercise->'sets') s
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
      and p.id = any(p_athlete_ids) and cardinality(p_athlete_ids) <= 100
      and exists(select 1 from public.profiles me where me.id=auth.uid() and me.role='coach' and me.deleted_at is null)
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
  order by full_name asc nulls last, linked_at desc;
$$;
revoke all on function public.get_metadata_roster_details(uuid[]) from public, anon;
grant execute on function public.get_metadata_roster_details(uuid[]) to authenticated;
