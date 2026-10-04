-- =====================================================================
-- ONE-OFF: clear test data before importing the real cohort.
--
-- Deletes ALL students, companies and timeline rows. Keeps advisors.
-- Use once, after testing and before go-live. Never after real students
-- have started using the app: their history cannot be recovered.
--
-- The timeline is immutable by design, so this temporarily disables its
-- TRUNCATE guard inside the same transaction. If anything fails, the
-- whole script rolls back and the guard stays on.
--
-- To run: change 'no' to 'yes' on the next line, then run the whole file
-- (SQL Editor, or psql -v ON_ERROR_STOP=1 -f ...).
-- =====================================================================
begin;
set local app.confirm_reset = 'no';

do $$
begin
  if current_setting('app.confirm_reset', true) is distinct from 'yes' then
    raise exception 'Refusing to reset: set app.confirm_reset to ''yes'' at the top of this file';
  end if;
end $$;

create temp table keep_advisors on commit drop as
  select * from public.users where role = 'ADVISOR';

alter table public.status_timeline_logs disable trigger status_timeline_logs_no_truncate;
truncate public.status_timeline_logs, public.companies, public.users restart identity;
alter table public.status_timeline_logs enable trigger status_timeline_logs_no_truncate;

insert into public.users select * from keep_advisors;

select
  (select count(*) from public.users where role = 'ADVISOR') as advisors_kept,
  (select count(*) from public.users where role = 'STUDENT') as students,
  (select count(*) from public.companies)                    as companies,
  (select count(*) from public.status_timeline_logs)         as timeline_rows;

commit;
