-- Completion is the only checkpoint that can promote an athlete's logged single.
-- Fixture helper supplies current identities; production callers supply UI identities.
create function pg_temp.save_actual(p_assignment uuid,p_week int,p_day int,p_exercise int,p_set int,p_actual jsonb)
returns boolean language plpgsql as $$
declare b jsonb; e jsonb; position int:=p_exercise;
begin
 for b in select value from jsonb_array_elements((select plan_data#>array['weeks',p_week::text,'days',p_day::text,'blocks'] from assigned_plans where id=p_assignment)) loop
  if position<jsonb_array_length(b->'exercises') then e:=b->'exercises'->position; exit; end if;
  position:=position-jsonb_array_length(b->'exercises');
 end loop;
 return public.save_workout_set_actuals(p_assignment,p_week,p_day,p_exercise,p_set,p_actual,e->>'id',e->'sets'->p_set->>'id',e->>'resolvedExerciseId');
end; $$;
insert into profiles(id,role) values
 ('10000000-0000-0000-0000-000000000001','athlete'),('10000000-0000-0000-0000-000000000002','athlete'),
 ('20000000-0000-0000-0000-000000000001','coach'),('20000000-0000-0000-0000-000000000002','coach');
insert into auth.users(id,email) select id,'test@example.com' from profiles;
insert into coach_athletes(coach_id,athlete_id,status,unlinked_at) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active',null),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','pending',null);
insert into exercises(id,name,normalized_name,owner_coach_id) values
 ('30000000-0000-0000-0000-000000000001','Test squat','test squat','20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000002','Private lift','private lift','20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000003','Other private lift','other private lift','20000000-0000-0000-0000-000000000002');
insert into assigned_plans(id,athlete_id,coach_id,status,plan_data) select
 '40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','active',
 jsonb_build_object('schemaVersion','3.1.0','name','Completion tests','weeks',jsonb_build_array(jsonb_build_object('days',jsonb_agg(
 jsonb_build_object('code','w1d'||(i+1),'blocks',jsonb_build_array(jsonb_build_object('id','b'||i,'exercises',jsonb_build_array(
 jsonb_build_object('id','squat-'||i,'name','Test squat','resolvedExerciseId','30000000-0000-0000-0000-000000000001','sets',jsonb_build_array(
 jsonb_build_object('id','s1','planned',jsonb_build_object('type','exact','reps',1,'target',jsonb_build_object('type','absolute','value',100,'unit','kg')),'actual',null,'status','planned','locked',false),
 jsonb_build_object('id','s2','planned',jsonb_build_object('type','target','instruction','Heavy single','reps',1),'actual',null,'status','planned','locked',false))))))) order by i)))) from generate_series(0,5) i;
create function pg_temp.current_value() returns numeric language sql as $$
 select value from list_athlete_maxes('10000000-0000-0000-0000-000000000001') where voided_at is null and exercise_id='30000000-0000-0000-0000-000000000001' order by logged_at desc,entry_order desc limit 1
$$;
grant select on exercises,athlete_maxes to authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$declare result jsonb; history_count integer;
begin
 assert not has_function_privilege('anon','complete_workout_day(uuid,integer,integer)','execute'), 'completion requires authentication';
 perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000001',100,'kg','athlete_entered');
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":1,"target":{"type":"absolute","value":999,"unit":"kg"}}');
 assert pg_temp.current_value()=100, 'mistaken autosave must never raise max';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,0,0,0,null);
 assert pg_temp.current_value()=100, 'clearing an uncompleted set has no max side effect';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,0,0,0,'{"reps":1,"target":{"type":"absolute","value":110,"unit":"kg"}}');
 assert pg_temp.current_value()=100, 'final draft still does not change max';
 result:=complete_workout_day('40000000-0000-0000-0000-000000000001',0,0);
 assert pg_temp.current_value()=110 and (result->>'maxChanged')::boolean, 'completion uses actual single weight without estimation';
 assert result#>>'{plan,weeks,0,days,0,blocks,0,exercises,0,sets,1,status}'='completed', 'instruction-only target completes';
 assert result#>'{plan,weeks,0,days,0,blocks,0,exercises,0,sets,1,actual,target}' is null, 'planned target must never become an actual lifted weight';
 select count(*) into history_count from athlete_maxes;
 result:=complete_workout_day('40000000-0000-0000-0000-000000000001',0,0);
 assert not (result->>'maxChanged')::boolean and (select count(*) from athlete_maxes)=history_count, 'retrying completion is idempotent';
 begin perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,0,0,0,null); raise exception 'completed set edited'; exception when invalid_parameter_value then null; end;
 perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000001',90,'kg','athlete_entered');
 assert pg_temp.current_value()=90, 'manual update can lower max';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,1,0,0,'{"reps":5,"target":{"type":"absolute","value":500,"unit":"kg"}}');
 perform complete_workout_day('40000000-0000-0000-0000-000000000001',0,1);
 assert pg_temp.current_value()=90, 'completed multi-rep set must not raise max';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,2,0,0,'{"reps":"1+1","target":{"type":"absolute","value":600,"unit":"kg"}}');
 perform complete_workout_day('40000000-0000-0000-0000-000000000001',0,2);
 assert pg_temp.current_value()=90, 'completed combined reps must not raise max';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,3,0,0,'{"reps":1,"target":{"type":"absolute","value":80,"unit":"kg"}}');
 perform complete_workout_day('40000000-0000-0000-0000-000000000001',0,3);
 assert pg_temp.current_value()=90, 'lighter single must not lower max';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,4,0,0,'{"reps":"1","target":{"type":"absolute","value":220,"unit":"lb"}}');
 perform complete_workout_day('40000000-0000-0000-0000-000000000001',0,4);
 assert pg_temp.current_value()=220, 'completion compares kg and lb equivalents';
 perform pg_temp.save_actual('40000000-0000-0000-0000-000000000001',0,5,0,0,'{"reps":1,"target":{"type":"absolute","value":160,"unit":"kg"}}');
 result:=complete_workout_day('40000000-0000-0000-0000-000000000001',0,5);
 assert pg_temp.current_value()=160 and (result->>'allDaysDone')::boolean, 'last completion resolves the assignment, without an arbitrary improvement cap';
 select count(*) into history_count from athlete_maxes;
 perform complete_workout_day('40000000-0000-0000-0000-000000000001',0,5);
 assert (select count(*) from athlete_maxes)=history_count, 'last-workout completion retry stays idempotent';
 begin perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000001',0,'kg','athlete_entered'); raise exception 'zero max accepted'; exception when invalid_parameter_value then null; end;
 begin perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000001',999,'kg','logged_single'); raise exception 'forged source accepted'; exception when invalid_parameter_value then null; end;
 begin perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000001',100,'stone','athlete_entered'); raise exception 'invalid unit accepted'; exception when invalid_parameter_value then null; end;
 begin perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000003',100,'kg','athlete_entered'); raise exception 'unrelated private exercise accepted'; exception when no_data_found then null; end;
 begin delete from athlete_maxes; raise exception 'history delete accepted'; exception when insufficient_privilege then null; end;
 begin update athlete_maxes set value=999; raise exception 'history edit accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
do $$begin
 assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001'))=0, 'pending coach cannot read maxes';
 assert (select count(*) from athlete_maxes)=0, 'pending coach cannot read table';
 begin perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',100,'kg','coach_entered'); raise exception 'pending coach write accepted'; exception when no_data_found then null; end;
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$begin
 perform insert_athlete_max('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',75,'kg','coach_entered');
 assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001'))>0, 'active coach reads max history';
 begin perform complete_workout_day('40000000-0000-0000-0000-000000000001',0,0); raise exception 'coach completed athlete workout'; exception when no_data_found then null; end;
end$$;
reset role;
update coach_athletes set unlinked_at=clock_timestamp() where coach_id='20000000-0000-0000-0000-000000000001';
set role authenticated;
do $$begin assert (select count(*) from list_athlete_maxes('10000000-0000-0000-0000-000000000001'))=0, 'revoked coach loses access'; end$$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$begin
 assert exists(select 1 from exercises where id='30000000-0000-0000-0000-000000000002'), 'recorded private exercise name survives unlink';
 perform insert_athlete_max(auth.uid(),'30000000-0000-0000-0000-000000000002',70,'kg','athlete_entered');
end$$;
reset role;
select 'Completion checkpoint and max permissions passed' as result;
