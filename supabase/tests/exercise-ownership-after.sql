do $$begin
 assert (select count(*) from exercises where owner_coach_id='80000000-0000-0000-0000-000000000001')=1, 'ownership adoption reuses a matching private exercise';
 assert (select count(*) from athlete_maxes where exercise_id='80000000-0000-0000-0000-000000000004')=2, 'max values preserved under the adopted identity';
 assert (select value from athlete_maxes where athlete_id='80000000-0000-0000-0000-000000000002' order by logged_at desc,entry_order desc limit 1)=95, 'ownership adoption preserves current training max ordering';
 assert exists(select 1 from athlete_maxes where exercise_id='80000000-0000-0000-0000-000000000004' and source_set_key='["w1d1","lift","s1"]' and value=100), 'single provenance preserved';
 assert (select active_version_id from plans where id='80000000-0000-0000-0000-000000000005')<>'80000000-0000-0000-0000-000000000006', 'adoption appends an active template version';
 assert (select plan_uses_exercise(plan_data,'80000000-0000-0000-0000-000000000003') from plan_versions where id='80000000-0000-0000-0000-000000000006'), 'old template version remains unchanged';
 assert (select not plan_uses_exercise(plan_data,'80000000-0000-0000-0000-000000000003') from assigned_plans where id='80000000-0000-0000-0000-000000000007'), 'active assignments adopt the same identity as max history';
 assert (select plan_data #>> '{weeks,0,days,0,blocks,0,exercises,0,sets,0,actual,target,value}' from assigned_plans where id='80000000-0000-0000-0000-000000000007')='100', 'recorded actual value retained';
end$$;
delete from athlete_maxes where athlete_id='80000000-0000-0000-0000-000000000002';
delete from assigned_plans where id='80000000-0000-0000-0000-000000000007';
delete from plan_versions where plan_id='80000000-0000-0000-0000-000000000005';
delete from plans where id='80000000-0000-0000-0000-000000000005';
delete from exercises where owner_coach_id='80000000-0000-0000-0000-000000000001';
delete from exercises where id='80000000-0000-0000-0000-000000000003';
delete from coach_athletes where coach_id='80000000-0000-0000-0000-000000000001';
delete from profiles where id in ('80000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002');
