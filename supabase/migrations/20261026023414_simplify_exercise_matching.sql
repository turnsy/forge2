-- Preserve exercise identity: only case and whitespace are normalized.
-- Do not rewrite IDs or merge historical max records.
update public.exercises
set normalized_name = lower(btrim(regexp_replace(name, '\s+', ' ', 'g')));

-- The text-search flow uses normal SELECTs protected by exercise RLS.
-- Retire the SECURITY DEFINER semantic endpoint, which accepted arbitrary coach IDs.
drop function if exists public.search_exercises(uuid, vector, integer);

-- Keep existing embedding data for recovery; the application no longer reads or writes it.
