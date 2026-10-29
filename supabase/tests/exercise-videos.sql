-- Standalone, rollback-only integration checks against a migrated database.
begin;
insert into auth.users(id,email) values
 ('ae000000-0000-4000-8000-000000000001','forge-video-coach-1@example.invalid'),
 ('ae000000-0000-4000-8000-000000000002','forge-video-coach-2@example.invalid'),
 ('ae000000-0000-4000-8000-000000000003','forge-video-athlete@example.invalid');
insert into profiles(id,role) values
 ('ae000000-0000-4000-8000-000000000001','coach'),
 ('ae000000-0000-4000-8000-000000000002','coach'),
 ('ae000000-0000-4000-8000-000000000003','athlete') on conflict(id) do update set role=excluded.role;
insert into exercises(id,name,normalized_name,owner_coach_id) values
 ('ae100000-0000-4000-8000-000000000001','Video test A','video test a','ae000000-0000-4000-8000-000000000001'),
 ('ae100000-0000-4000-8000-000000000002','Video test B','video test b','ae000000-0000-4000-8000-000000000001'),
 ('ae100000-0000-4000-8000-000000000003','Video test C','video test c','ae000000-0000-4000-8000-000000000001');
insert into assigned_plans(athlete_id,coach_id,status,plan_data) values
 ('ae000000-0000-4000-8000-000000000003','ae000000-0000-4000-8000-000000000001','completed',
 '{"schemaVersion":"3.1.0","name":"Video history","weeks":[{"days":[{"code":"w1d1","blocks":[{"id":"b1","exercises":[{"id":"e1","name":"Video test A","resolvedExerciseId":"ae100000-0000-4000-8000-000000000001","sets":[{"id":"s1","planned":{"type":"exact","reps":1,"target":{"type":"absolute","value":100,"unit":"kg"}},"actual":null,"status":"planned","locked":false}]}]}]}]}]}');
set local role authenticated;
select set_config('request.jwt.claim.sub','ae000000-0000-4000-8000-000000000001',true);
do $$begin
 assert not has_function_privilege('anon','public.set_coach_exercise_video(uuid,text)','execute');
 perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000001','https://youtu.be/original');
 assert (select video_url='https://youtu.be/original' from exercises where id='ae100000-0000-4000-8000-000000000001');
 perform manage_coach_exercise('ae100000-0000-4000-8000-000000000001',null,'ae100000-0000-4000-8000-000000000002',true);
 assert (select video_url='https://youtu.be/original' from exercises where id='ae100000-0000-4000-8000-000000000002'), 'replacement without video inherits it';
 perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000003','https://youtu.be/replacement');
 perform manage_coach_exercise('ae100000-0000-4000-8000-000000000002',null,'ae100000-0000-4000-8000-000000000003',true);
 assert (select video_url='https://youtu.be/replacement' from exercises where id='ae100000-0000-4000-8000-000000000003'), 'existing replacement video wins';
 perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000003','');
 assert (select video_url is null from exercises where id='ae100000-0000-4000-8000-000000000003'), 'blank removes video';
 begin
  perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000001','https://youtu.be/archived');
  raise exception 'archived exercise updated';
 exception when no_data_found then null; end;
 begin
  perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000003','javascript:alert(1)');
  raise exception 'unsafe URL accepted';
 exception when check_violation then null; end;
end$$;
select set_config('request.jwt.claim.sub','ae000000-0000-4000-8000-000000000002',true);
do $$begin
 assert not exists(select 1 from exercises where id='ae100000-0000-4000-8000-000000000003'), 'other coach cannot read video';
 begin
  perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000003','https://youtu.be/stolen');
  raise exception 'other coach changed video';
 exception when no_data_found then null; end;
end$$;
select set_config('request.jwt.claim.sub','ae000000-0000-4000-8000-000000000003',true);
do $$begin
 assert (select video_url='https://youtu.be/original' from exercises where id='ae100000-0000-4000-8000-000000000001'), 'athlete can read archived exercise video from assigned history without an active coach link';
 assert not exists(select 1 from exercises where id='ae100000-0000-4000-8000-000000000003'), 'history access does not reveal unrelated coach exercises';
 begin
  perform set_coach_exercise_video('ae100000-0000-4000-8000-000000000003','https://youtu.be/athlete');
  raise exception 'athlete changed video';
 exception when no_data_found or insufficient_privilege then null; end;
end$$;
reset role;
rollback;
select 'Exercise video assertions passed' as result;
