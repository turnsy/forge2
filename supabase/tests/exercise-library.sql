reset role;
update coach_athletes set unlinked_at=null where coach_id='20000000-0000-0000-0000-000000000001';
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$declare owned exercises; again exercises; global_id uuid; replacement exercises; original_version uuid; template_id uuid; snapshot jsonb; rewritten jsonb;
begin
 select id into global_id from exercises where owner_coach_id is null and normalized_name='bench press';
 owned:=claim_coach_exercise(null,global_id);
 assert owned.owner_coach_id=auth.uid() and owned.id<>global_id, 'global selection creates a coach exercise';
 again:=claim_coach_exercise(null,global_id);
 assert again.id=owned.id, 'repeat selection reuses the coach exercise';
 assert (select count(*) from search_coach_exercises(auth.uid(),'bench press',50,true) where lower(name)='bench press')=1, 'autocomplete deduplicates owned/global exercises';
 assert exists(select 1 from search_coach_exercises(auth.uid(),'bench press',50,true) where id=owned.id), 'autocomplete prefers coach ID';
 assert not has_table_privilege('authenticated','exercises','INSERT'), 'exercise writes require authorized RPC';
 replacement:=claim_coach_exercise('Replacement press');
 snapshot:=jsonb_build_object('schemaVersion','3.1.0','name','Test template','weeks',jsonb_build_array(jsonb_build_object('days',jsonb_build_array(jsonb_build_object('code','w1d1','blocks',jsonb_build_array(jsonb_build_object('id','b1','exercises',jsonb_build_array(jsonb_build_object('id','e1','name',owned.name,'resolvedExerciseId',owned.id::text,'resolvedBasisExerciseId',owned.id::text,'basisRaw',owned.name,'sets',jsonb_build_array(jsonb_build_object('id','s1','actual',jsonb_build_object('reps',1),'status','planned'),jsonb_build_object('id','s2','actual',null,'status','planned')))))))))));
 -- Management is checked below using owner fixtures inserted with postgres privileges.
 perform set_config('test.library_owned',owned.id::text,false);
 perform set_config('test.library_replacement',replacement.id::text,false);
 perform set_config('test.library_plan',snapshot::text,false);
end$$;
reset role;
insert into plans(id,coach_id) values('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001');
insert into plan_versions(id,plan_id,plan_data,created_by) values('70000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001',current_setting('test.library_plan')::jsonb,'20000000-0000-0000-0000-000000000001');
update plans set active_version_id='70000000-0000-0000-0000-000000000002';
update assigned_plans set status='active',plan_data=current_setting('test.library_plan')::jsonb;
insert into athlete_maxes(athlete_id,exercise_id,value,unit,source) values('10000000-0000-0000-0000-000000000001',current_setting('test.library_owned')::uuid,100,'kg','coach_entered');
set role authenticated;
do $$declare usage jsonb; rewritten jsonb; owned uuid:=current_setting('test.library_owned')::uuid; replacement uuid:=current_setting('test.library_replacement')::uuid;
begin
 usage:=coach_exercise_usage(owned);
 assert usage='{"templates":1,"assignments":1}'::jsonb, 'usage includes active templates and unfinished assignment sets';
 begin perform manage_coach_exercise(owned,null,null,true); raise exception 'used exercise deleted without replacement'; exception when invalid_parameter_value then null; end;
 begin perform manage_coach_exercise('30000000-0000-0000-0000-000000000003','Stolen',null,false); raise exception 'other coach exercise changed'; exception when no_data_found then null; end;
 perform manage_coach_exercise(owned,null,replacement,true);
 assert (select archived_at is not null from exercises where id=owned), 'deleted exercise is archived';
 assert not exists(select 1 from search_coach_exercises(auth.uid(),'bench',50,false) where id=owned), 'archived exercise hidden from active catalog';
 assert (select plan_data from plan_versions where id='70000000-0000-0000-0000-000000000002')=current_setting('test.library_plan')::jsonb, 'template history remains immutable';
 assert (select count(*) from plan_versions)=2, 'replacement appends a template version';
 select plan_data into rewritten from assigned_plans limit 1;
 assert rewritten #>> '{weeks,0,days,0,blocks,0,exercises,0,resolvedExerciseId}'=owned::text, 'logged set retains original exercise';
 assert rewritten #>> '{weeks,0,days,0,blocks,0,exercises,0,sets,0,id}'='s1', 'source set identity preserved';
 assert rewritten #>> '{weeks,0,days,0,blocks,0,exercises,1,resolvedExerciseId}'=replacement::text, 'unlogged set switches exercise';
 assert rewritten #>> '{weeks,0,days,0,blocks,0,exercises,1,resolvedBasisExerciseId}'=replacement::text, 'percentage basis switches too';
 assert exists(select 1 from athlete_maxes where exercise_id=owned and value=100), 'max history is not transferred to a different exercise';
 perform manage_coach_exercise(replacement,'Renamed press',null,false);
 assert (select name from exercises where id=replacement)='Renamed press', 'rename updates owned catalog';
 assert (select count(*) from plan_versions)=3, 'rename appends a template version';
 begin perform rewrite_coach_exercise_references(auth.uid(),owned,replacement,'Bypass'); raise exception 'internal writer exposed'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$begin
 begin perform claim_coach_exercise('Athlete-created exercise'); raise exception 'athlete created catalog exercise'; exception when insufficient_privilege then null; end;
 begin
  perform public.save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,0,1,'{"reps":1,"target":{"type":"absolute","value":999,"unit":"kg"}}','e1','s2',current_setting('test.library_owned'));
  raise exception 'stale set position was accepted after splitting';
 exception when invalid_parameter_value then null; end;
 begin
  perform public.save_workout_set_actuals('40000000-0000-0000-0000-000000000001',0,0,1,0,'{"reps":1,"target":{"type":"absolute","value":999,"unit":"kg"}}','e1-replacement-'||current_setting('test.library_replacement'),'s2',current_setting('test.library_owned'));
  raise exception 'stale catalog identity accepted';
 exception when invalid_parameter_value then null; end;
 assert exists(select 1 from exercises where id=current_setting('test.library_owned')::uuid), 'athlete can read original archived exercise with max history';
end$$;
reset role;
select 'Coach exercise library assertions passed' as result;
