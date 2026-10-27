insert into profiles(id,role) values('80000000-0000-0000-0000-000000000001','coach'),('80000000-0000-0000-0000-000000000002','athlete');
insert into coach_athletes(coach_id,athlete_id,status) values('80000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','active');
insert into exercises(id,name,normalized_name,owner_coach_id) values
 ('80000000-0000-0000-0000-000000000003','Backfill lift','backfill lift',null),
 ('80000000-0000-0000-0000-000000000004','Backfill lift','backfill lift','80000000-0000-0000-0000-000000000001');
insert into plans(id,coach_id,active_version_id) values('80000000-0000-0000-0000-000000000005','80000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000006');
insert into plan_versions(id,plan_id,plan_data,created_by) values('80000000-0000-0000-0000-000000000006','80000000-0000-0000-0000-000000000005',
 '{"weeks":[{"days":[{"code":"w1d1","blocks":[{"id":"b1","exercises":[{"id":"lift","name":"Backfill lift","resolvedExerciseId":"80000000-0000-0000-0000-000000000003","sets":[{"id":"s1","status":"planned","actual":{"reps":1,"target":{"type":"absolute","value":100,"unit":"kg"}}},{"id":"s2","status":"planned","actual":null}]}]}]}]}]}',
 '80000000-0000-0000-0000-000000000001');
insert into assigned_plans(id,athlete_id,coach_id,status,plan_data,plan_id) select '80000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001','active',plan_data,plan_id from plan_versions where id='80000000-0000-0000-0000-000000000006';
insert into athlete_maxes(athlete_id,exercise_id,value,unit,source,source_assignment_id,source_set_key) values('80000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000003',100,'kg','logged_single','80000000-0000-0000-0000-000000000007','["w1d1","lift","s1"]');
insert into athlete_maxes(athlete_id,exercise_id,value,unit,source) values('80000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000004',95,'kg','coach_entered');
