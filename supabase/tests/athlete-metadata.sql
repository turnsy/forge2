insert into profiles(id,role,full_name,invite_code) values
('20000000-0000-0000-0000-000000000001','coach','Coach A','COACHA01'),
('20000000-0000-0000-0000-000000000002','coach','Coach B','COACHB01'),
('10000000-0000-0000-0000-000000000001','athlete','Alex',null),
('10000000-0000-0000-0000-000000000002','athlete','Blake',null),
('10000000-0000-0000-0000-000000000003','athlete','Casey',null);
insert into coach_athletes(coach_id,athlete_id,status) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active'),
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','pending');
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
insert into athlete_metadata_fields(id,coach_id,definition) values
('30000000-0000-0000-0000-000000000001',auth.uid(),'{"label":"Weight","type":"number","unit":"kg","min":0,"required":true,"options":[],"position":0,"archived":false}'),
('30000000-0000-0000-0000-000000000002',auth.uid(),'{"label":"Sports","type":"multi_select","required":true,"options":[{"id":"football","label":"Football"},{"id":"basketball","label":"Basketball"}],"position":1,"archived":false}'),
('30000000-0000-0000-0000-000000000003',auth.uid(),'{"label":"Birth date","type":"date","semantic":"birth_date","required":true,"options":[],"position":2,"archived":false}'),
('30000000-0000-0000-0000-000000000004',auth.uid(),'{"label":"Equipment","type":"boolean","required":true,"options":[],"position":3,"archived":false}');
do $$declare result jsonb;
begin
 assert not has_table_privilege('authenticated','athlete_metadata_values','delete'),'answers must be cleared with history, even under permissive default grants';
 assert not has_table_privilege('anon','athlete_metadata_fields','select'),'anonymous default grants removed';
 assert not has_table_privilege('authenticated','athlete_metadata_value_events','insert'),'history is immutable to clients';
 assert not has_function_privilege('authenticated','metadata_log_answer()','execute'),'history trigger is not callable';
 assert not has_function_privilege('anon','list_metadata_athletes(jsonb,text,text,integer,integer,boolean,boolean)','execute'),'anonymous roster access blocked';
 perform set_athlete_metadata(auth.uid(),'10000000-0000-0000-0000-000000000001','[{"fieldId":"30000000-0000-0000-0000-000000000001","version":1,"value":60},{"fieldId":"30000000-0000-0000-0000-000000000002","version":1,"value":["football","basketball"]},{"fieldId":"30000000-0000-0000-0000-000000000003","version":1,"value":"2012-10-29"},{"fieldId":"30000000-0000-0000-0000-000000000004","version":1,"value":false}]');
 result:=list_metadata_athletes('[{"fieldId":"30000000-0000-0000-0000-000000000002","op":"any","value":["football"]},{"fieldId":"30000000-0000-0000-0000-000000000003","op":"age_between","value":12,"upper":15,"asOf":"2026-10-29"}]',null,'active',1,0,true);
 assert (result->>'total')::int=1,'sports AND age query';
 assert result#>'{items,0,missing}'='[]'::jsonb,'false is answered';
 assert (list_metadata_athletes('[]',null,'pending',1,0,false,true)->>'total')::int=1,'pending missing answers visible';
 assert jsonb_array_length(list_metadata_athletes('[]',null,'active',1,100,false)->'items')=0 and (list_metadata_athletes('[]',null,'active',1,100,false)->>'total')::int=1,'total survives empty pages';
 perform set_athlete_metadata(auth.uid(),'10000000-0000-0000-0000-000000000001','[{"fieldId":"30000000-0000-0000-0000-000000000001","version":1,"value":55}]');
 assert (select count(*) from athlete_metadata_value_events where field_id='30000000-0000-0000-0000-000000000001')=2,'decreases retain history';
 begin
  perform set_athlete_metadata(auth.uid(),'10000000-0000-0000-0000-000000000001','[{"fieldId":"30000000-0000-0000-0000-000000000001","version":1,"value":99},{"fieldId":"30000000-0000-0000-0000-000000000004","version":1,"value":"bad"}]');
  raise exception 'Expected invalid answer failure';
 exception when raise_exception then assert sqlerrm='Invalid answer or archived field'; end;
 assert (select value from athlete_metadata_values where field_id='30000000-0000-0000-0000-000000000001')='55'::jsonb,'batch rollback includes history and prior answers';
 begin
  update athlete_metadata_fields set definition=jsonb_set(definition,'{type}','"date"'),version=version+1 where id='30000000-0000-0000-0000-000000000001';
  raise exception 'Expected incompatible type failure';
 exception when raise_exception then assert sqlerrm like 'Archive this field%'; end;
 update athlete_metadata_fields set definition=jsonb_set(definition,'{label}','"Body weight"'),version=2 where id='30000000-0000-0000-0000-000000000001';
 begin
  perform set_athlete_metadata(auth.uid(),'10000000-0000-0000-0000-000000000001','[{"fieldId":"30000000-0000-0000-0000-000000000001","version":1,"value":90}]');
  raise exception 'Expected stale version failure';
 exception when raise_exception then assert sqlerrm='Field changed. Refresh and try again.'; end;
end$$;
-- Athletes can edit their own pending/active values, but not definitions or others' answers.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',false);
do $$begin
 perform set_athlete_metadata('20000000-0000-0000-0000-000000000001',auth.uid(),'[{"fieldId":"30000000-0000-0000-0000-000000000004","version":1,"value":false}]');
 assert (select count(*) from athlete_metadata_values)=1,'athlete sees only own answers';
 assert (select count(*) from athlete_metadata_value_events)=1,'athlete sees only own history';
 begin
  perform set_athlete_metadata('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','[]');
  raise exception 'Expected relationship failure';
 exception when raise_exception then assert sqlerrm='Athlete not linked'; end;
 update athlete_metadata_fields set definition=jsonb_set(definition,'{label}','"Hacked"'),version=version+1;
 assert not exists(select 1 from athlete_metadata_fields where definition->>'label'='Hacked'),'athlete cannot edit definitions';
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
do $$begin
 assert (select count(*) from athlete_metadata_values)=0,'other coach cannot see answers';
 assert (select count(*) from athlete_metadata_fields)=0,'other coach cannot see definitions';
 assert (list_metadata_athletes()->>'total')::int=0,'roster coach isolation';
end$$;
-- Real intake uses the invite-code preview and atomic link/answer RPC.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',false);
do $$declare rid uuid; begin
 assert jsonb_array_length(get_metadata_invite_fields('COACHA01')->'fields')=4,'preview before linking';
 rid:=request_coach_link_with_metadata('COACHA01','[]');
 assert exists(select 1 from coach_athletes where id=rid and status='pending'),'empty intake can still request link';
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$begin
 perform accept_coach_link((select id from coach_athletes where athlete_id='10000000-0000-0000-0000-000000000003'));
 assert (list_metadata_athletes('[]',null,'active',10,0,false,true)->>'total')::int=1,'incomplete athlete accepted without breaking';
 assert public.metadata_filter_matches('{"type":"date","semantic":"birth_date"}','"2014-10-30"','{"op":"age_between","value":12,"upper":15,"asOf":"2026-10-29"}')=false,'birthday has not occurred';
 assert public.metadata_filter_matches('{"type":"date","semantic":"birth_date"}','"2010-10-29"','{"op":"age_between","value":12,"upper":15,"asOf":"2026-10-29"}')=false,'age 16 excluded';
end$$;
reset role;

-- Filtering precedes pagination even when a roster exceeds a tool page.
insert into profiles(id,role,full_name)
select ('10000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'athlete','Roster '||i from generate_series(100,219) i;
insert into coach_athletes(coach_id,athlete_id,status)
select '20000000-0000-0000-0000-000000000001',id,'active' from profiles where full_name like 'Roster %';
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$declare result jsonb; begin
 result:=list_metadata_athletes('[]',null,'active',100,100);
 assert (result->>'total')::int=122 and jsonb_array_length(result->'items')=22,'all matching pages reachable';
 result:=list_metadata_athletes('[{"fieldId":"30000000-0000-0000-0000-000000000002","op":"any","value":["football"]}]',null,'active',1,0);
 assert (result->>'total')::int=1 and jsonb_array_length(result->'items')=1,'filters execute before LIMIT';
 perform set_athlete_metadata(auth.uid(),'10000000-0000-0000-0000-000000000001','[{"fieldId":"30000000-0000-0000-0000-000000000001","version":2,"value":null}]');
 assert (select count(*) from athlete_metadata_value_events where field_id='30000000-0000-0000-0000-000000000001')=3,'clearing is a logged event';
 begin
  update athlete_metadata_fields set definition=jsonb_set(definition,'{unit}','"cm"'),version=3 where id='30000000-0000-0000-0000-000000000001';
  raise exception 'Expected history-safe unit change failure';
 exception when raise_exception then assert sqlerrm like 'Archive this field%'; end;
end$$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$begin
 perform set_athlete_metadata(auth.uid(),'10000000-0000-0000-0000-000000000001','[{"fieldId":"30000000-0000-0000-0000-000000000001","version":2,"value":55}]');
 update athlete_metadata_fields set definition=jsonb_set(definition,'{unit}','"lb"'),version=3 where id='30000000-0000-0000-0000-000000000001';
 assert abs((select (value #>> '{}')::numeric from athlete_metadata_values where field_id='30000000-0000-0000-0000-000000000001') - 121.25424420168267)<0.00001,'unit changes convert existing current values';
 assert (select definition->>'unit' from athlete_metadata_value_events where field_id='30000000-0000-0000-0000-000000000001' order by id limit 1)='kg','historical units retained';
 assert (select definition->>'unit' from athlete_metadata_value_events where field_id='30000000-0000-0000-0000-000000000001' order by id desc limit 1)='lb','converted event uses new unit';
end$$;
reset role;
