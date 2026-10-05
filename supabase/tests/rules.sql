-- Business-rule tests. Self-checking; everything is rolled back.
-- Run: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rules.sql
--  or paste into the Supabase SQL Editor (success = no error).
begin;

create function pg_temp.expect_error(p_sql text, p_expected text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'TEST FAILED: expected % from: %', p_expected, p_sql;
exception when others then
  if sqlerrm like 'TEST FAILED%' then raise; end if;
  if position(p_expected in sqlerrm) = 0 and sqlstate <> p_expected then
    raise exception 'TEST FAILED: expected %, got [%] % from: %', p_expected, sqlstate, sqlerrm, p_sql;
  end if;
end $$;

insert into public.users (role, full_name, email) values ('ADVISOR', 'Test Advisor', 'test.advisor@example.com');
insert into public.users (student_id, full_name) values ('99999999901', 'Test A'), ('99999999902', 'Test B');

do $$
declare
  adv uuid := (select id from public.users where email = 'test.advisor@example.com');
  a   uuid := (select id from public.users where student_id = '99999999901');
  b   uuid := (select id from public.users where student_id = '99999999902');
  c   uuid;
  u   public.users;
  n   int;
  evs text[];
  r   jsonb;
  m   jsonb;
begin
  -- Companies: website optional, still validated when given; names unique
  insert into public.companies (name, business_type_id, url, work_mode, source_type, created_by)
  values ('__Test Co__', 1, 'https://example.com', 'ONSITE', 'CLASSMATE', a) returning id into c;
  insert into public.companies (name, business_type_id, url, work_mode, source_type, created_by)
  values ('__No Website Co__', 2, null, 'HYBRID', 'SENIOR', a);
  perform pg_temp.expect_error(
    format($q$insert into public.companies (name, business_type_id, url, work_mode, source_type, created_by)
              values ('__Bad Url Co__', 1, 'example.com', 'ONSITE', 'CLASSMATE', %L)$q$, a), '23514');
  perform pg_temp.expect_error(
    format($q$insert into public.companies (name, business_type_id, url, work_mode, source_type, created_by)
              values (' __test co__ ', 1, 'https://x.com', 'ONSITE', 'CLASSMATE', %L)$q$, a), '23505');

  -- Data validation
  perform pg_temp.expect_error($q$insert into public.users (student_id) values ('123')$q$, '23514');
  perform pg_temp.expect_error(format('select public.student_apply_action(%L, %L)', adv, 'COMPLETE_RESUME'), 'NOT_A_STUDENT');

  -- Every new student is logged
  select count(*) into n from public.status_timeline_logs where user_id = a and event = 'INITIALIZED';
  assert n = 1, 'insert should log INITIALIZED';

  -- Resume and Portfolio in any order (Portfolio first here)
  u := public.student_apply_action(a, 'COMPLETE_PORTFOLIO');
  assert u.current_status = 'PORTFOLIO_DONE' and u.is_portfolio_ready, 'portfolio first';
  u := public.student_apply_action(a, 'COMPLETE_RESUME');
  assert u.current_status = 'RESUME_DONE' and u.is_resume_ready and u.is_portfolio_ready, 'then resume';
  perform pg_temp.expect_error(format('select public.student_apply_action(%L, %L)', a, 'COMPLETE_RESUME'), 'ALREADY_DONE');

  -- ยื่นแล้ว requires both docs: function AND check constraint
  perform pg_temp.expect_error(format('select public.student_apply_action(%L, %L)', b, 'SUBMIT'), 'PREREQ_NOT_MET');
  perform pg_temp.expect_error(
    format($q$update public.users set current_status = 'APPLICATIONS_SUBMITTED' where id = %L$q$, b), '23514');

  -- ยืนยันที่ฝึกงาน requires ยื่นแล้ว first, and needs no company
  perform pg_temp.expect_error(format('select public.student_apply_action(%L, %L)', a, 'CONFIRM'), 'INVALID_TRANSITION');
  u := public.student_apply_action(a, 'SUBMIT');
  assert u.current_status = 'APPLICATIONS_SUBMITTED', 'submit';
  u := public.student_apply_action(a, 'CONFIRM');
  assert u.current_status = 'INTERNSHIP_CONFIRMED', 'confirm without company';
  perform pg_temp.expect_error(format('select public.student_apply_action(%L, %L)', a, 'CONFIRM'), 'ALREADY_DONE');
  perform pg_temp.expect_error(format('select public.student_apply_action(%L, %L)', a, 'TELEPORT'), 'INVALID_ACTION');

  -- Forward-only trigger
  perform pg_temp.expect_error(format('update public.users set is_resume_ready = false where id = %L', a), 'FORWARD_ONLY');
  perform pg_temp.expect_error(
    format($q$update public.users set current_status = 'APPLICATIONS_SUBMITTED' where id = %L$q$, a), 'FORWARD_ONLY');

  -- Timeline written automatically, in order
  select array_agg(event::text order by changed_at, id) into evs from public.status_timeline_logs where user_id = a;
  assert evs = array['INITIALIZED','PORTFOLIO_COMPLETED','RESUME_COMPLETED','APPLICATIONS_SUBMITTED','INTERNSHIP_CONFIRMED'],
    format('timeline order, got %s', evs);

  -- Log is immutable
  perform pg_temp.expect_error(format('update public.status_timeline_logs set note = %L where user_id = %L', 'x', a), 'IMMUTABLE_LOG');
  perform pg_temp.expect_error(format('delete from public.status_timeline_logs where user_id = %L', a), 'IMMUTABLE_LOG');
  perform pg_temp.expect_error('truncate public.status_timeline_logs', 'IMMUTABLE_LOG');

  -- Companies are no longer pinned by a confirmed student
  delete from public.companies where id = c;
  assert not exists (select 1 from public.companies where id = c), 'company deletable';

  -- Import: forward-only, idempotent, refuses submit without both docs
  r := public.import_students('[{"student_id":"99999999903","resume":true,"portfolio":false,"submitted":true}]');
  assert (r->0->>'created')::boolean, 'import creates';
  assert r->0->>'status' = 'RESUME_DONE', format('import keeps prep stage, got %s', r->0->>'status');
  assert jsonb_array_length(r->0->'warnings') = 1, 'import warns on submit without docs';
  r := public.import_students('[{"student_id":"99999999903","resume":true,"portfolio":true,"submitted":true}]');
  assert not (r->0->>'created')::boolean and r->0->>'status' = 'APPLICATIONS_SUBMITTED', 'import moves forward';
  r := public.import_students('[{"student_id":"99999999903","resume":false,"portfolio":false,"submitted":false}]');
  assert r->0->>'status' = 'APPLICATIONS_SUBMITTED', 'import never moves back';
  assert (select note from public.status_timeline_logs
          where user_id = (select id from public.users where student_id = '99999999903')
          order by id limit 1) = 'นำเข้าจากแบบฟอร์ม', 'import note on timeline';

  -- Views no longer expose company columns
  assert not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name in ('student_roster', 'student_timeline', 'users', 'status_timeline_logs')
                       and column_name like '%company%'), 'no company columns left';

  -- Metrics shape
  m := public.get_cohort_metrics();
  assert (select count(*) from jsonb_object_keys(m->'by_status')) = 5, 'metrics has 5 statuses';
  assert (m->>'total')::int >= 3, 'metrics counts students';

  raise notice 'ALL RULE TESTS PASSED';
end $$;

rollback;
