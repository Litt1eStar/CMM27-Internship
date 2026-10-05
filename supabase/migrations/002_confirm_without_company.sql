-- =====================================================================
-- 002: confirming an internship no longer records a company, and the
-- company website is optional (design decisions, 2026-10-05).
-- Run once, after 001, in the SQL Editor (or psql). It drops columns.
-- =====================================================================
begin;

-- Views depend on the columns being dropped; recreated below.
drop view public.student_roster;
drop view public.student_timeline;

alter table public.users drop constraint users_confirmed_requires_company;
alter table public.users drop column confirmed_company_id;
alter table public.status_timeline_logs drop column company_id;

-- Website optional. The existing CHECK still validates non-null URLs.
alter table public.companies alter column url drop not null;

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
  new.updated_at := now();
  return new;
end;
$$;

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
      (user_id, event, previous_status, new_status, changed_by, note)
    values
      (new.id, new.current_status::text::public.timeline_event, old.current_status,
       new.current_status, v_actor, v_note);
  end if;

  return null;
end;
$$;

-- New signature: no company parameter.
drop function public.student_apply_action(uuid, text, uuid, text, uuid);

create function public.student_apply_action(
  p_user_id  uuid,
  p_action   text,
  p_note     text default null,
  p_actor_id uuid default null
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
      update public.users
         set current_status = 'INTERNSHIP_CONFIRMED'
       where id = p_user_id
       returning * into u;

    else
      raise exception 'INVALID_ACTION: unknown action %', p_action;
  end case;

  return u;
end;
$$;

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
      u := public.student_apply_action(u.id, 'COMPLETE_RESUME', p_note, null);
    end if;
    if coalesce((r->>'portfolio')::boolean, false) and not u.is_portfolio_ready then
      u := public.student_apply_action(u.id, 'COMPLETE_PORTFOLIO', p_note, null);
    end if;
    if coalesce((r->>'submitted')::boolean, false)
       and public.status_rank(u.current_status) < 2 then
      if u.is_resume_ready and u.is_portfolio_ready then
        u := public.student_apply_action(u.id, 'SUBMIT', p_note, null);
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

create view public.student_roster with (security_invoker = true) as
select u.id, u.student_id, u.full_name, u.email,
       u.is_resume_ready, u.is_portfolio_ready, u.current_status,
       (u.auth_user_id is not null) as is_linked,
       u.created_at, u.updated_at
from public.users u
where u.role = 'STUDENT';

create view public.student_timeline with (security_invoker = true) as
select l.id, l.user_id, l.event, l.previous_status, l.new_status,
       l.changed_at, l.note
from public.status_timeline_logs l;

-- New objects get Supabase's default grants; lock them down again.
revoke all on public.student_roster, public.student_timeline from anon, authenticated;
revoke execute on function public.student_apply_action(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.student_apply_action(uuid, text, text, uuid) to service_role;

commit;
