-- =====================================================================
-- ONE-OFF: clear test data before importing the real cohort.
--
-- Deletes ALL students, companies and timeline rows. Keeps advisors.
-- Use once, after testing and before go-live. Never after real students
-- have started using the app: their history cannot be recovered.
--
-- Compatible with Supabase SQL Editor and connection poolers (uses a
-- single DO block instead of session-scoped temp tables).
-- =====================================================================

do $$
declare
  v_advisors jsonb;
begin
  -- 1. Snapshot all advisors
  select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
  into v_advisors
  from public.users u
  where u.role = 'ADVISOR';

  -- 2. Temporarily disable the truncate guard on the immutable log
  alter table public.status_timeline_logs disable trigger status_timeline_logs_no_truncate;

  -- 3. Truncate student data, companies, and timeline rows
  truncate public.status_timeline_logs, public.companies, public.users restart identity;

  -- 4. Re-enable the immutable log truncate guard
  alter table public.status_timeline_logs enable trigger status_timeline_logs_no_truncate;

  -- 5. Restore advisors
  if jsonb_array_length(v_advisors) > 0 then
    insert into public.users
    select * from jsonb_populate_recordset(null::public.users, v_advisors);
  end if;
end $$;

-- Summary check
select
  (select count(*) from public.users where role = 'ADVISOR') as advisors_kept,
  (select count(*) from public.users where role = 'STUDENT') as students,
  (select count(*) from public.companies)                    as companies,
  (select count(*) from public.status_timeline_logs)         as timeline_rows;
