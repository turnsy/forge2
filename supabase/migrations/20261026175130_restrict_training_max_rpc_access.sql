-- Hosted projects may grant anon EXECUTE directly through default privileges.
-- Revoking PUBLIC alone does not remove those grants.
revoke execute on function public.insert_athlete_max(uuid,uuid,numeric,text,text) from public, anon;
revoke execute on function public.list_athlete_maxes(uuid,uuid[]) from public, anon;
revoke execute on function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb) from public, anon;
revoke execute on function public.get_coach_athletes(text,integer,integer) from public, anon;
grant execute on function public.insert_athlete_max(uuid,uuid,numeric,text,text) to authenticated;
grant execute on function public.list_athlete_maxes(uuid,uuid[]) to authenticated;
grant execute on function public.save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb) to authenticated;
grant execute on function public.get_coach_athletes(text,integer,integer) to authenticated;
