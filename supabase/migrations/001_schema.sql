-- =====================================================================
-- CMM Internship Tracking & Company Knowledge Platform
-- Supabase (PostgreSQL 15+) schema
--
-- Design notes
--   * Progress is FORWARD-ONLY. Flags can only go false -> true and the
--     status can never move to a lower stage. Enforced by trigger.
--   * Every progress change writes an immutable row to
--     status_timeline_logs (written by trigger, so no code path can skip it).
--   * All state transitions go through student_apply_action(), which locks
--     the row and validates the guard rules atomically.
--   * The browser never talks to these tables directly. The Express API
--     uses the service-role key; RLS is enabled with no policies so the
--     anon/authenticated keys cannot read or write anything.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.internship_status as enum (
  'NOT_STARTED',             -- ยังไม่เตรียมตัว
  'RESUME_DONE',             -- ทำ Resume แล้ว
  'PORTFOLIO_DONE',          -- ทำ Portfolio แล้ว
  'APPLICATIONS_SUBMITTED',  -- ยื่นแล้ว
  'INTERNSHIP_CONFIRMED'     -- ยืนยันที่ฝึกงาน (terminal)
);

create type public.work_mode   as enum ('ONSITE', 'ONLINE', 'HYBRID');

-- Where the company information came from. Only classmates can add
-- companies; SENIOR means the classmate got the info from a senior.
create type public.source_type as enum ('SENIOR', 'CLASSMATE');

create type public.user_role   as enum ('STUDENT', 'ADVISOR');

create type public.timeline_event as enum (
  'INITIALIZED',
  'RESUME_COMPLETED',
  'PORTFOLIO_COMPLETED',
  'APPLICATIONS_SUBMITTED',
  'INTERNSHIP_CONFIRMED'
);

-- Stage rank used by the forward-only guard.
create or replace function public.status_rank(s public.internship_status)
returns int language sql immutable as $$
  select case s
    when 'NOT_STARTED'            then 0
    when 'RESUME_DONE'            then 1
    when 'PORTFOLIO_DONE'         then 1
    when 'APPLICATIONS_SUBMITTED' then 2
    when 'INTERNSHIP_CONFIRMED'   then 3
  end;
$$;

-- ---------------------------------------------------------------------
-- Business types (ประเภทธุรกิจ, based on JobDB)
-- ---------------------------------------------------------------------
create table public.business_types (
  id         smallint generated always as identity primary key,
  name_th    text not null unique,
  sort_order smallint not null default 0
);

insert into public.business_types (name_th, sort_order) values
  ('โปรดักชั่น งานโฆษณา และสื่อออนไลน์', 1),
  ('ผลิตรายการโทรทัศน์',               2),
  ('ผลิตสื่อออนไลน์และออฟไลน์',          3),
  ('งานออกแบบ',                       4),
  ('งานการศึกษา งานฝึกอบรม',            5),
  ('งานวิศวกรรม',                      6),
  ('งานบริการ งานท่องเที่ยว',             7),
  ('งานไอที',                          8),
  ('งานประกันภัย',                      9),
  ('งานการตลาด',                      10),
  ('งานอสังหาริมทรัพย์',                 11),
  ('งานขาย',                          12);

-- ---------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------
create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(btrim(name)) between 1 and 200),
  business_type_id smallint not null references public.business_types(id),
  url              text not null check (url ~* '^https?://[^[:space:]]+$'),
  work_mode        public.work_mode not null,
  source_type      public.source_type not null,
  note             text check (note is null or char_length(note) <= 1000),
  created_by       uuid not null,  -- FK added after users exists
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Name is unique regardless of case / surrounding spaces.
create unique index companies_name_unique on public.companies (lower(btrim(name)));
create index companies_business_type_idx on public.companies (business_type_id);
create index companies_work_mode_idx     on public.companies (work_mode);

-- ---------------------------------------------------------------------
-- Users (students + advisors)
-- ---------------------------------------------------------------------
create table public.users (
  id                   uuid primary key default gen_random_uuid(),
  auth_user_id         uuid unique references auth.users(id) on delete set null,
  role                 public.user_role not null default 'STUDENT',
  student_id           text unique,
  full_name            text,
  email                text unique,
  is_resume_ready      boolean not null default false,
  is_portfolio_ready   boolean not null default false,
  current_status       public.internship_status not null default 'NOT_STARTED',
  confirmed_company_id uuid references public.companies(id) on delete restrict,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint users_email_lowercase check (email is null or email = lower(email)),
  constraint users_student_id_format check (
    role <> 'STUDENT' or (student_id is not null and student_id ~ '^[0-9]{11}$')
  ),

  -- Guard rule (from the spec): submitted / confirmed need both documents.
  constraint users_submit_requires_docs check (
    current_status not in ('APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED')
    or (is_resume_ready = true and is_portfolio_ready = true)
  ),

  -- Confirmation rule: confirmed <=> a company is linked.
  constraint users_confirmed_requires_company check (
    (current_status = 'INTERNSHIP_CONFIRMED') = (confirmed_company_id is not null)
  ),

  -- Status must agree with the flags.
  constraint users_status_matches_flags check (
    case current_status
      when 'NOT_STARTED'    then not is_resume_ready and not is_portfolio_ready
      when 'RESUME_DONE'    then is_resume_ready
      when 'PORTFOLIO_DONE' then is_portfolio_ready
      else true
    end
  )
);

create index users_status_idx on public.users (current_status) where role = 'STUDENT';

alter table public.companies
  add constraint companies_created_by_fkey
  foreign key (created_by) references public.users(id) on delete restrict;

-- ---------------------------------------------------------------------
-- Audit timeline (immutable)
-- ---------------------------------------------------------------------
create table public.status_timeline_logs (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.users(id) on delete restrict,
  event           public.timeline_event not null,
  previous_status public.internship_status,
  new_status      public.internship_status not null,
  company_id      uuid references public.companies(id) on delete restrict,
  changed_at      timestamptz not null default now(),
  changed_by      uuid references public.users(id),
  note            text
);

create index status_timeline_logs_user_idx
  on public.status_timeline_logs (user_id, changed_at, id);

create or replace function public.forbid_timeline_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'IMMUTABLE_LOG: status_timeline_logs rows cannot be changed or deleted';
end;
$$;

create trigger status_timeline_logs_no_update
  before update or delete on public.status_timeline_logs
  for each row execute function public.forbid_timeline_mutation();

create trigger status_timeline_logs_no_truncate
  before truncate on public.status_timeline_logs
  for each statement execute function public.forbid_timeline_mutation();

-- ---------------------------------------------------------------------
-- Triggers on users
-- ---------------------------------------------------------------------

-- Forward-only guard + updated_at.
create or replace function public.users_forward_only_guard()
returns trigger language plpgsql as $$
begin
  if old.is_resume_ready and not new.is_resume_ready then
    raise exception 'FORWARD_ONLY: Resume cannot be marked incomplete';
  end if;
  if old.is_portfolio_ready and not new.is_portfolio_ready then
    raise exception 'FORWARD_ONLY: Portfolio cannot be marked incomplete';
  end if;
  if public.status_rank(new.current_status) < public.status_rank(old.current_status) then
    raise exception 'FORWARD_ONLY: status cannot move from % back to %',
      old.current_status, new.current_status;
  end if;
  if old.current_status = 'INTERNSHIP_CONFIRMED'
     and new.confirmed_company_id is distinct from old.confirmed_company_id then
    raise exception 'FORWARD_ONLY: confirmed company cannot be changed';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_forward_only
  before update on public.users
  for each row execute function public.users_forward_only_guard();

-- Writes the audit trail. Context for the log row (note, actor) is passed
-- through transaction-local settings app.log_note / app.actor_id.
create or replace function public.users_write_timeline()
returns trigger language plpgsql as $$
declare
  v_note  text := nullif(current_setting('app.log_note', true), '');
  v_actor uuid := nullif(current_setting('app.actor_id', true), '')::uuid;
begin
  if new.role <> 'STUDENT' then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.status_timeline_logs
      (user_id, event, previous_status, new_status, changed_by, note)
    values
      (new.id, 'INITIALIZED', null, new.current_status, v_actor, v_note);
    return null;
  end if;

  if new.is_resume_ready and not old.is_resume_ready then
    insert into public.status_timeline_logs
      (user_id, event, previous_status, new_status, changed_by, note)
    values
      (new.id, 'RESUME_COMPLETED', old.current_status, new.current_status, v_actor, v_note);
  end if;

  if new.is_portfolio_ready and not old.is_portfolio_ready then
    insert into public.status_timeline_logs
      (user_id, event, previous_status, new_status, changed_by, note)
    values
      (new.id, 'PORTFOLIO_COMPLETED', old.current_status, new.current_status, v_actor, v_note);
  end if;

  if new.current_status is distinct from old.current_status
     and new.current_status in ('APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED') then
    insert into public.status_timeline_logs
      (user_id, event, previous_status, new_status, company_id, changed_by, note)
    values
      (new.id, new.current_status::text::public.timeline_event, old.current_status,
       new.current_status, new.confirmed_company_id, v_actor, v_note);
  end if;

  return null;
end;
$$;

create trigger users_timeline
  after insert or update on public.users
  for each row execute function public.users_write_timeline();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger companies_touch
  before update on public.companies
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Transition RPC: the only way progress changes.
-- Actions: COMPLETE_RESUME | COMPLETE_PORTFOLIO | SUBMIT | CONFIRM
-- Errors are raised as "<CODE>: message" so the API can map them.
-- ---------------------------------------------------------------------
create or replace function public.student_apply_action(
  p_user_id    uuid,
  p_action     text,
  p_company_id uuid default null,
  p_note       text default null,
  p_actor_id   uuid default null
)
returns public.users
language plpgsql
set search_path = public
as $$
declare
  u public.users;
begin
  select * into u from public.users where id = p_user_id for update;
  if not found then
    raise exception 'NOT_FOUND: student not found';
  end if;
  if u.role <> 'STUDENT' then
    raise exception 'NOT_A_STUDENT: only students have internship progress';
  end if;

  perform set_config('app.log_note', coalesce(p_note, ''), true);
  perform set_config('app.actor_id', coalesce(p_actor_id::text, ''), true);

  case p_action
    when 'COMPLETE_RESUME' then
      if u.is_resume_ready then
        raise exception 'ALREADY_DONE: Resume is already marked complete';
      end if;
      update public.users
         set is_resume_ready = true,
             current_status  = 'RESUME_DONE'
       where id = p_user_id
       returning * into u;

    when 'COMPLETE_PORTFOLIO' then
      if u.is_portfolio_ready then
        raise exception 'ALREADY_DONE: Portfolio is already marked complete';
      end if;
      update public.users
         set is_portfolio_ready = true,
             current_status     = 'PORTFOLIO_DONE'
       where id = p_user_id
       returning * into u;

    when 'SUBMIT' then
      if u.current_status in ('APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED') then
        raise exception 'ALREADY_DONE: applications are already submitted';
      end if;
      if not (u.is_resume_ready and u.is_portfolio_ready) then
        raise exception 'PREREQ_NOT_MET: both Resume and Portfolio must be complete before submitting';
      end if;
      update public.users
         set current_status = 'APPLICATIONS_SUBMITTED'
       where id = p_user_id
       returning * into u;

    when 'CONFIRM' then
      if u.current_status = 'INTERNSHIP_CONFIRMED' then
        raise exception 'ALREADY_DONE: internship is already confirmed';
      end if;
      if u.current_status <> 'APPLICATIONS_SUBMITTED' then
        raise exception 'INVALID_TRANSITION: you must submit applications before confirming';
      end if;
      if p_company_id is null then
        raise exception 'COMPANY_REQUIRED: choose the confirmed company from the catalog';
      end if;
      if not exists (select 1 from public.companies where id = p_company_id) then
        raise exception 'COMPANY_NOT_FOUND: company does not exist';
      end if;
      update public.users
         set current_status       = 'INTERNSHIP_CONFIRMED',
             confirmed_company_id = p_company_id
       where id = p_user_id
       returning * into u;

    else
      raise exception 'INVALID_ACTION: unknown action %', p_action;
  end case;

  return u;
end;
$$;

-- ---------------------------------------------------------------------
-- Bulk import from the Google Form CSV (forward-only, idempotent).
-- p_rows: [{ "student_id", "full_name", "email", "resume", "portfolio",
--            "submitted" }]
-- Existing students are only moved forward, never backward.
-- ---------------------------------------------------------------------
create or replace function public.import_students(p_rows jsonb, p_note text default 'นำเข้าจากแบบฟอร์ม')
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  r         jsonb;
  u         public.users;
  v_sid     text;
  v_created boolean;
  v_warn    text[];
  v_report  jsonb := '[]'::jsonb;
begin
  perform set_config('app.log_note', coalesce(p_note, ''), true);

  for r in select * from jsonb_array_elements(p_rows) loop
    v_sid  := btrim(r->>'student_id');
    v_warn := '{}';

    select * into u from public.users where student_id = v_sid for update;
    v_created := not found;
    if v_created then
      perform set_config('app.actor_id', '', true);
      insert into public.users (student_id, full_name, email)
      values (v_sid,
              nullif(btrim(r->>'full_name'), ''),
              nullif(lower(btrim(r->>'email')), ''))
      returning * into u;
    end if;

    if coalesce((r->>'resume')::boolean, false) and not u.is_resume_ready then
      u := public.student_apply_action(u.id, 'COMPLETE_RESUME', null, p_note, null);
    end if;
    if coalesce((r->>'portfolio')::boolean, false) and not u.is_portfolio_ready then
      u := public.student_apply_action(u.id, 'COMPLETE_PORTFOLIO', null, p_note, null);
    end if;
    if coalesce((r->>'submitted')::boolean, false)
       and public.status_rank(u.current_status) < 2 then
      if u.is_resume_ready and u.is_portfolio_ready then
        u := public.student_apply_action(u.id, 'SUBMIT', null, p_note, null);
      else
        v_warn := array_append(v_warn,
          'ticked ยื่นแล้ว but Resume and Portfolio are not both complete; kept at preparation stage');
      end if;
    end if;

    v_report := v_report || jsonb_build_object(
      'student_id', v_sid,
      'created',    v_created,
      'status',     u.current_status,
      'warnings',   to_jsonb(v_warn)
    );
  end loop;

  return v_report;
end;
$$;

-- ---------------------------------------------------------------------
-- Advisor metrics
-- ---------------------------------------------------------------------
create or replace function public.get_cohort_metrics()
returns jsonb
language sql stable
set search_path = public
as $$
  with s as (
    select * from public.users where role = 'STUDENT'
  ),
  by_status as (
    select st::text as status,
           (select count(*) from s where s.current_status = st) as n
    from unnest(enum_range(null::public.internship_status)) as st
  )
  select jsonb_build_object(
    'total',            (select count(*) from s),
    'by_status',        (select jsonb_object_agg(status, n) from by_status),
    'resume_done',      (select count(*) from s where is_resume_ready),
    'portfolio_done',   (select count(*) from s where is_portfolio_ready),
    'ready_to_apply',   (select count(*) from s
                          where is_resume_ready and is_portfolio_ready
                            and current_status in ('RESUME_DONE', 'PORTFOLIO_DONE')),
    'linked_accounts',  (select count(*) from s where auth_user_id is not null)
  );
$$;

-- ---------------------------------------------------------------------
-- Read views (security_invoker so they never bypass RLS)
-- ---------------------------------------------------------------------
create view public.company_directory with (security_invoker = true) as
select c.id, c.name, c.url, c.work_mode, c.source_type, c.note,
       c.business_type_id, bt.name_th as business_type,
       c.created_by, u.full_name as created_by_name,
       c.created_at, c.updated_at
from public.companies c
join public.business_types bt on bt.id = c.business_type_id
left join public.users u on u.id = c.created_by;

create view public.student_roster with (security_invoker = true) as
select u.id, u.student_id, u.full_name, u.email,
       u.is_resume_ready, u.is_portfolio_ready, u.current_status,
       u.confirmed_company_id, c.name as confirmed_company_name,
       c.url as confirmed_company_url,
       (u.auth_user_id is not null) as is_linked,
       u.updated_at
from public.users u
left join public.companies c on c.id = u.confirmed_company_id
where u.role = 'STUDENT';

create view public.student_timeline with (security_invoker = true) as
select l.id, l.user_id, l.event, l.previous_status, l.new_status,
       l.changed_at, l.note, l.company_id,
       c.name as company_name, c.url as company_url
from public.status_timeline_logs l
left join public.companies c on c.id = l.company_id;

-- ---------------------------------------------------------------------
-- Lock down: only the service role (used by Express) can touch data.
-- ---------------------------------------------------------------------
alter table public.business_types       enable row level security;
alter table public.companies            enable row level security;
alter table public.users                enable row level security;
alter table public.status_timeline_logs enable row level security;

revoke all on public.business_types, public.companies, public.users,
              public.status_timeline_logs, public.company_directory,
              public.student_roster, public.student_timeline
  from anon, authenticated;

revoke execute on function
  public.student_apply_action(uuid, text, uuid, text, uuid),
  public.import_students(jsonb, text),
  public.get_cohort_metrics()
  from public, anon, authenticated;

grant execute on function
  public.student_apply_action(uuid, text, uuid, text, uuid),
  public.import_students(jsonb, text),
  public.get_cohort_metrics()
  to service_role;

-- ---------------------------------------------------------------------
-- Register advisors (run once per advisor, with their real email):
--   insert into public.users (role, full_name, email)
--   values ('ADVISOR', 'อ.ชื่อ นามสกุล', 'advisor@kmutt.ac.th');
-- ---------------------------------------------------------------------
