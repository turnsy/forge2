-- All fixtures live in the disposable database created by scripts/test-training-maxes.mjs.
do $$begin
 assert not has_function_privilege('anon','insert_athlete_max(uuid,uuid,numeric,text,text)','execute'), 'anonymous max insert must be revoked';
 assert not has_function_privilege('anon','list_athlete_maxes(uuid,uuid[])','execute'), 'anonymous max list must be revoked';
 assert not has_function_privilege('anon','save_workout_set_actuals(uuid,integer,integer,integer,integer,jsonb)','execute'), 'anonymous set save must be revoked';
 assert not has_function_privilege('anon','get_coach_athletes(text,integer,integer)','execute'), 'anonymous coach list must be revoked';
end$$;
insert into profiles(id,role) values
 ('10000000-0000-0000-0000-000000000001','athlete'),
 ('10000000-0000-0000-0000-000000000002','athlete'),
 ('20000000-0000-0000-0000-000000000001','coach'),
 ('20000000-0000-0000-0000-000000000002','coach');
insert into auth.users(id,email) select id,'test@example.com' from profiles;
insert into coach_athletes(coach_id,athlete_id,status,unlinked_at) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active',null),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','pending',null);
insert into exercises(id,name,normalized_name,owner_coach_id) values
 ('30000000-0000-0000-0000-000000000001','Test squat','test squat',null),
 ('30000000-0000-0000-0000-000000000002','Private lift','private lift','20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000003','Other private lift','other private lift','20000000-0000-0000-0000-000000000002');
insert into assigned_plans(id,athlete_id,coach_id,status,plan_data) values (
 '40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000001','active',
 '{"weeks":[{"days":[{"blocks":[{"exercises":[{"id":"squat","resolvedExerciseId":"30000000-0000-0000-0000-000000000001","sets":[{"id":"s1","actual":null,"status":"planned"},{"id":"s2","actual":null,"status":"planned"}]}]}]}]}]}'
);
grant select, insert on exercises to authenticated;
grant select on athlete_maxes to authenticated;

create function pg_temp.current_value() returns numeric language sql as $$
 select value from list_athlete_maxes('10000000-0000-0000-0000-000000000001') where voided_at is null
 order by logged_at desc,entry_order desc limit 1
$$;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$begin
  perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',100,'kg','athlete_entered');
  assert pg_temp.current_value() = 100, 'manual max';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":5,"target":{"type":"absolute","value":140,"unit":"kg"}}');
  assert pg_temp.current_value() = 100, 'multi-rep sets must not update max';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":1,"target":{"type":"absolute","value":140,"unit":"kg"}}');
  assert pg_temp.current_value() = 140, 'single uses actual weight without formula or cap';
  assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001')) = 2, 'history appended';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":1,"target":{"type":"absolute","value":140,"unit":"kg"}}');
  assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001')) = 2, 'retry must be idempotent';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":"1","notes":"Only a note"}');
  assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001')) = 2, 'notes and equivalent rep representations must not duplicate history';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":1,"target":{"type":"absolute","value":110,"unit":"kg"}}');
  assert pg_temp.current_value() = 110, 'correction invalidates original and applies corrected single';
  assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001') where voided_at is not null) = 1, 'invalidated entry retained';
  perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',90,'kg','athlete_entered');
  assert pg_temp.current_value() = 90, 'manual update can lower current max';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":1,"target":{"type":"absolute","value":150,"unit":"kg"}}');
  assert pg_temp.current_value() = 90, 'correction cannot override a newer manual update';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,1,'{"reps":"1","target":{"type":"absolute","value":220,"unit":"lb"}}');
  assert pg_temp.current_value() = 220, 'new single compares in equivalent units';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,1,null);
  assert pg_temp.current_value() = 90, 'clearing source invalidates derived max';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,1,'{"reps":"1+1","target":{"type":"absolute","value":200,"unit":"kg"}}');
  assert pg_temp.current_value() = 90, 'combined reps must not raise max';
  perform save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,1,'{"reps":1,"target":{"type":"absolute","value":80,"unit":"kg"}}');
  assert pg_temp.current_value() = 90, 'lighter single must not lower max';
  begin
    perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',999,'kg','logged_single');
    raise exception 'forged automatic source accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into exercises(name,normalized_name,owner_coach_id) values ('Athlete lift','athlete lift',auth.uid());
    raise exception 'athlete catalog creation accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',0,'kg','athlete_entered');
    raise exception 'zero value accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003',100,'kg','athlete_entered');
    raise exception 'private exercise from unrelated coach accepted';
  exception when no_data_found then null; end;
  begin
    insert into athlete_maxes(athlete_id,exercise_id,value,unit,source) values
      ('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',999,'kg','logged_single');
    raise exception 'direct insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    update athlete_maxes set value=999;
    raise exception 'direct history update accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',100,'stone','athlete_entered');
    raise exception 'unsupported unit accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform insert_athlete_max('10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001',100,'kg','athlete_entered');
    raise exception 'other athlete write accepted';
  exception when no_data_found then null; end;
  begin
    delete from athlete_maxes;
    raise exception 'direct delete accepted';
  exception when insufficient_privilege then null; end;
end$$;

select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
do $$begin
 assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001')) = 0, 'pending coach RPC read';
 assert (select count(*) from athlete_maxes) = 0, 'pending coach direct read';
 begin
  perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',100,'kg','coach_entered');
  raise exception 'pending coach write accepted';
 exception when no_data_found then null; end;
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$begin
 perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',75,'kg','coach_entered');
 assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001')) > 0, 'active coach read';
end$$;
reset role;
-- Verify coach-list completion for a current block plan and the legacy flat shape.
update assigned_plans set plan_data=jsonb_set(jsonb_set(plan_data,
 '{weeks,0,days,0,blocks,0,exercises,0,sets,0,status}','"completed"'),
 '{weeks,0,days,0,blocks,0,exercises,0,sets,1,status}','"completed"');
set role authenticated;
do $$begin
 assert (select completion_percent from get_coach_athletes())=100, 'completed block plan reports 100 percent';
end$$;
reset role;
update assigned_plans set plan_data='{"weeks":[{"days":[{"exercises":[{"sets":[{"status":"completed"}]}]},{"exercises":[{"sets":[{"status":"planned"}]}]}]}]}';
set role authenticated;
do $$begin
 assert (select completion_percent from get_coach_athletes())=50, 'legacy flat plan reports completed day share';
end$$;
reset role;
update coach_athletes set unlinked_at=clock_timestamp() where coach_id='20000000-0000-0000-0000-000000000001';
set role authenticated;
do $$begin
 assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001'))=0, 'revoked coach read';
 begin
  perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',100,'kg','coach_entered');
  raise exception 'revoked coach write accepted';
 exception when no_data_found then null; end;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$begin
 assert exists(select 1 from exercises where id='30000000-0000-0000-0000-000000000002'), 'recorded private name remains visible after unlinking';
 perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',70,'kg','athlete_entered');
 assert (select value from list_athlete_maxes('10000000-0000-0000-0000-000000000001') where exercise_id='30000000-0000-0000-0000-000000000002' order by logged_at desc,entry_order desc limit 1)=70, 'athlete retains ownership of recorded max';
 assert not exists(select 1 from exercises where id='30000000-0000-0000-0000-000000000003'), 'unrecorded private catalog remains hidden';
end$$;
reset role;
select 'Training-max database assertions passed' as result;
