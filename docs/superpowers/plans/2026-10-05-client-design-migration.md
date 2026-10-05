# Client Design Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `client/` so it matches the Claude Design mockup "CMM Internship Tracker Mobile" screen by screen, and change the database and API where the user decided the design wins.

**Architecture:** First, a small backend change: migration `002` removes the "confirmed company" concept and makes company websites optional; the API, tests and README follow. Then the React client is rebuilt on the design's tokens: Kanit font, the cream/leaf palette, the "น้องต้นกล้า" Sprout mascot, and the design's motion engine. Pure logic (status → plant stage, timeline → history, Thai dates, filter queries) lives in tested modules under `client/src/lib/`; screens are thin React components built from shared primitives. The app is one mobile layout, centred in a column up to 430px wide on larger screens.

**Tech Stack:** React 18 · React Router 7 · Vite 8 · Tailwind CSS v4 · Vitest 5 (new, logic tests only) · Supabase JS (Google sign-in, PKCE) · Express API · Postgres

**Design source of truth:** `docs/design/cmm-internship-tracker-mobile/` (copied into the repo in Task 1). Screen IDs below (1a, 3c, 5d …) refer to the labels in `CMM Internship Tracker Mobile.dc.html`. Every colour, size and string in this plan comes from those files unless it's marked **(extrapolated)**.

**Related plan:** `2026-10-04-cmm-internship-launch.md`. This plan completes its Task 2 (client build) and the client half of Task 9 (same-origin `/api`, PKCE). Its Tasks 10–12 (sign-in E2E, web image, deploy workflow) run after this plan.

---

## Progress overview

Legend: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked
Owner: **Claude** = agent · **You** = needs your confirmation, accounts or eyes

| # | Phase | Task | Owner | Needs | Status |
|---|---|---|---|---|---|
| 1 | A. Backend | Copy the design bundle into the repo | Claude | — | ✅ |
| 2 | A. Backend | Migration 002 + updated rule tests (apply after your OK) | Claude + You | 1 | ✅ |
| 3 | A. Backend | API: confirm without company, optional website | Claude | 2 | ✅ |
| 4 | A. Backend | Smoke-test the API end to end (writes test data after your OK) | Claude + You | 3 | ✅ |
| 5 | A. Backend | README: rules, API reference, setup | Claude | 3 | ✅ |
| 6 | B. Foundation | Tooling: Vitest, version, same-origin `/api`, PKCE | Claude | — | ✅ |
| 7 | B. Foundation | Design tokens, Kanit, base CSS | Claude | 6 | ⬜ |
| 8 | B. Foundation | Logic: status, dates, initials, colours | Claude | 6 | ⬜ |
| 9 | B. Foundation | Logic: timeline/history, companies, roster queries | Claude | 8 | ⬜ |
| 10 | B. Foundation | Sprout mascot + motion engine | Claude | 7 | ⬜ |
| 11 | B. Foundation | Shared UI: icons, sheet, toast, banner, FAB, chips, ID field, count-up | Claude | 10 | ⬜ |
| 12 | B. Foundation | App frame, tab bar, auth state, routes | Claude | 11 | ⬜ |
| 13 | C. Screens | 1a/1b Login | Claude | 12 | ⬜ |
| 14 | C. Screens | 2a–2c Verify student ID | Claude | 12 | ⬜ |
| 15 | C. Screens | 3a–3c Student home | Claude | 12 | ⬜ |
| 16 | C. Screens | 3d/3e action sheets, toast, 3f celebration | Claude | 15 | ⬜ |
| 17 | C. Screens | 4a/4c/4f Directory + company card | Claude | 12 | ⬜ |
| 18 | C. Screens | 4b filter sheet, 4d add/edit sheet, delete sheet | Claude | 17 | ⬜ |
| 19 | C. Screens | 5a–5c Advisor home + filter sheet | Claude | 12 | ⬜ |
| 20 | C. Screens | 5e add student, 5d student detail, unlink sheet | Claude | 19 | ⬜ |
| 21 | C. Screens | 6a/6b Profile | Claude | 12 | ⬜ |
| 22 | D. Finish | Remove the old client, build, tests | Claude | 13–21 | ⬜ |
| 23 | D. Finish | Visual check against the design, 390×844 and desktop | Claude + You | 22 | ⬜ |
| 24 | D. Finish | Update CLAUDE.md and the launch plan | Claude | 23 | ⬜ |

**Milestones**

| Milestone | Reached when | Status |
|---|---|---|
| M1 Backend matches design | Tasks 1–5 ✅: migration applied, rule tests and smoke test pass | ✅ |
| M2 Foundation ready | Tasks 6–12 ✅: logic tests green, app shell renders with tab bar | ⬜ |
| M3 Screens built | Tasks 13–21 ✅ | ⬜ |
| M4 Design verified | Tasks 22–24 ✅: you've approved the visual check | ⬜ |

---

## Decisions (confirmed by the user, 2026-10-05)

| # | Design vs system | Decision | Where |
|---|---|---|---|
| Q1 | 3e confirms an internship with no company; the system required one | **Remove the confirmed company entirely** (DB, API, views, README). Companies become freely deletable by their creator. | Tasks 2–5, 16, 20 |
| Q2 | 4d/4f treat the website as optional; the DB required it | **Website optional** (still validated when given) | Tasks 2, 3, 17, 18 |
| Q3 | The design never shows the info source (รุ่นพี่ / เพื่อนร่วมรุ่น) | **Show it everywhere**: chip row in the form, label on cards, section in the filter sheet, all in the design's chip/pill styles **(extrapolated)** | Tasks 9, 17, 18 |
| Q4 | Advisors have 2 tabs in the design; the API lets them moderate companies | **Keep 2 tabs** (ภาพรวม, ฉัน). The advisor company API stays in place, unused. | Task 12 |
| Q5 | Phone-only frames | **Centred phone column**, max 430px, canvas `#EDE4D9` outside | Task 12 |
| Q6 | The uploaded image shows a note + "added by" on cards | **Don't show** (match Directory.dc) | Task 17 |
| Q7 | States the design doesn't draw | **Extrapolate** from the design's patterns; each is marked **(extrapolated)** for review in Task 23 | Tasks 13–21 |

## Global translation rules (design → app)

1. **Device chrome is not built.** StatusBar.dc (9:41, notch, battery), the 134×5px home indicator and the iOS keypad in 2a/5e belong to the phone. Use `env(safe-area-inset-top|bottom)` instead, and `inputMode="numeric"` for the keypad.
2. **Vertical positions.** Design frames are 844px tall and include a 47px status bar and a 34px home-indicator strip. Use flex layouts instead of absolute positions: a design `top: Y` becomes `padding-top: calc(Y − 47px + env(safe-area-inset-top))`, and a design `bottom: B` becomes `calc(B − 34px + env(safe-area-inset-bottom))`. The TabBar (98px in the design) is 64px plus the bottom safe area.
3. **Centred column.** Anything `position: fixed` (tab bar, sticky bars, FABs, sheets, toasts) uses `inset-x-0 mx-auto max-w-[430px]`, **never** `left-1/2 -translate-x-1/2`. The motion engine animates the CSS `translate` property, which would overwrite Tailwind's translate classes.
4. **Motion demo delays.** `motion.js` delays `toast` (800ms), `sheet` (250ms) and `fade` (150ms) to stage a static canvas. In the app these respond to taps, so they're set to 0 in Task 10.
5. **Numbers that count up** (`data-anim="count"`) use a React `CountUp` component. The design engine rewrites DOM text, which fights React rendering.
6. **Thai text** comes verbatim from the design. Extrapolated strings are listed in the task that adds them.

## File map

**Backend**

| File | Action | Responsibility |
|---|---|---|
| `docs/design/cmm-internship-tracker-mobile/**` | Create (copy) | Design source of truth |
| `supabase/migrations/002_confirm_without_company.sql` | Create | Drop confirmed company; optional URL |
| `supabase/tests/rules.sql` | Modify | Rule tests for the new behaviour |
| `server/src/routes/student.js` | Modify | `CONFIRM` takes no company |
| `server/src/routes/companies.js` | Modify | Optional URL; no `COMPANY_IN_USE` |
| `server/src/lib/errors.js`, `server/test/errors.test.js` | Modify | Drop the 2 removed error codes |
| `server/scripts/smoke-api.mjs` | Create | Guarded end-to-end API check |
| `README.md` | Modify | Rules, API, setup |

**Client** (everything under `client/src/` is new or rewritten; the old components and pages are deleted in Task 22)

| File | Responsibility |
|---|---|
| `index.html`, `vite.config.js`, `package.json`, `.env.example` | Kanit font, `/api` proxy, Vitest, version |
| `src/index.css` | Tokens + shared component classes |
| `src/lib/api.js` | Same-origin fetch wrapper, network errors |
| `src/lib/supabase.js` | Google sign-in with PKCE |
| `src/lib/auth.jsx` | Session → `loading / signedOut / needsLink / ready`, rejected email |
| `src/lib/errors.js` | Thai messages for API error codes |
| `src/lib/status.js` (+test) | Status palette, plant stage, step index, hints, pill |
| `src/lib/format.js` (+test) | Thai date/time, initials, avatar colours |
| `src/lib/timeline.js` (+test) | Event titles, student history, advisor timeline rows |
| `src/lib/companies.js` (+test) | Modes, sources, URL helpers, directory query, filter count |
| `src/lib/roster.js` (+test) | Roster query, filter count, tile percentages |
| `src/lib/motion.js` | Port of the design's `motion.js` |
| `src/components/Sprout.jsx` | Mascot SVG (stage, mood, hold, wave) |
| `src/components/Icons.jsx` | Every SVG icon from the design |
| `src/components/ui.jsx` | `Pill`, `Chip`, `ErrorBanner`, `Fab`, `LeafIcon`, `CountUp` |
| `src/components/Sheet.jsx` | Bottom sheet (normal and full-height) |
| `src/components/Toast.jsx` | Dark green success toast |
| `src/components/StudentIdField.jsx` | 11-digit ID input with counter |
| `src/components/AppFrame.jsx`, `src/components/TabBar.jsx` | Column layout + tab bar |
| `src/App.jsx`, `src/main.jsx` | Routes by auth state and role |
| `src/pages/LoginPage.jsx` | 1a/1b |
| `src/pages/LinkStudentPage.jsx` | 2a–2c |
| `src/pages/student/StudentHomePage.jsx`, `ProgressParts.jsx`, `ActionSheet.jsx`, `Celebration.jsx` | 3a–3f |
| `src/pages/companies/DirectoryPage.jsx`, `CompanyCard.jsx`, `CompanyFilterSheet.jsx`, `CompanyFormSheet.jsx`, `DeleteCompanySheet.jsx` | 4a–4f |
| `src/pages/advisor/AdvisorHomePage.jsx`, `StudentRow.jsx`, `RosterFilterSheet.jsx`, `AddStudentSheet.jsx`, `StudentDetailPage.jsx` | 5a–5e |
| `src/pages/ProfilePage.jsx` | 6a/6b |

---

## Phase A — Backend changes the design needs

### Task 1: Copy the design bundle into the repo

**Files:**
- Create: `docs/design/cmm-internship-tracker-mobile/` (copied from `C:\Users\krittin pragopdee\Downloads\New folder (20)\cmm-internship-tracker-mobile`)

- [x] **Step 1: Copy it** (the bundle has no student data or secrets: HTML prototypes, `motion.js`, `support.js`, one PNG)

```bash
cd "C:/Users/krittin pragopdee/OneDrive/Desktop/University/CMM27-Internship"
mkdir -p docs/design
cp -r "/c/Users/krittin pragopdee/Downloads/New folder (20)/cmm-internship-tracker-mobile" docs/design/
ls docs/design/cmm-internship-tracker-mobile/project
```

Expected: `AdvisorHome.dc.html  CMM Internship Tracker Mobile.dc.html  Directory.dc.html  Sprout.dc.html  StatusBar.dc.html  StudentHome.dc.html  TabBar.dc.html  motion.js  support.js  uploads`

- [x] **Step 2: Commit**

```bash
git add docs/design
git commit -m "docs: add Claude Design bundle as the client's visual source of truth"
```

---

### Task 2: Migration 002 and updated rule tests

**Files:**
- Create: `supabase/migrations/002_confirm_without_company.sql`
- Modify: `supabase/tests/rules.sql` (full replacement below)

- [x] **Step 1: Replace `supabase/tests/rules.sql` with the new expectations (the test comes first)**

```sql
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
```

- [x] **Step 2: Run it against the current database: it must FAIL**

```bash
DB_URL="$(grep -m1 '^SUPABASE_DB_URL=' server/.env | cut -d= -f2- | tr -d '\r')"
"/c/Program Files/PostgreSQL/18/bin/psql.exe" "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/tests/rules.sql 2>&1 | grep -E 'ERROR|PASSED' | head -2
```

Expected: an `ERROR` (for example `null value in column "url"` or `COMPANY_REQUIRED`), and no `PASSED`.

- [x] **Step 3: Write `supabase/migrations/002_confirm_without_company.sql`**

```sql
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
```

- [x] **Step 4: Dry-run 002 + tests in one rolled-back session (writes nothing)**

The migration has its own `begin`/`commit`, so strip those into a scratch copy and run it inside the test's transaction:

```bash
SCRATCH="$(mktemp -d)"
sed '/^begin;$/d;/^commit;$/d' supabase/migrations/002_confirm_without_company.sql > "$SCRATCH/002.sql"
{ echo 'begin;'; cat "$SCRATCH/002.sql"; sed '/^begin;$/d' supabase/tests/rules.sql; } > "$SCRATCH/dry.sql"
"/c/Program Files/PostgreSQL/18/bin/psql.exe" "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$SCRATCH/dry.sql" 2>&1 | grep -E 'ERROR|PASSED'
rm -rf "$SCRATCH"
```

Expected: `NOTICE:  ALL RULE TESTS PASSED`. The final `rollback;` from `rules.sql` undoes the migration too.

- [x] **Step 5: Ask the user to confirm, then apply 002 for real** (a schema change to the one live database, per CLAUDE.md). The database is empty pre-launch, so no data is lost.

```bash
"/c/Program Files/PostgreSQL/18/bin/psql.exe" "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/migrations/002_confirm_without_company.sql
"/c/Program Files/PostgreSQL/18/bin/psql.exe" "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/tests/rules.sql 2>&1 | grep -E 'ERROR|PASSED'
```

Expected: no output from the first command, then `NOTICE:  ALL RULE TESTS PASSED`.

- [x] **Step 6: Re-check the browser lockdown** (the views and the function are new objects). Repeat launch-plan Task 7 Step 1, plus this call, which must say `permission denied`:

```bash
curl -s -X POST "$URL/rest/v1/rpc/student_apply_action" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H 'Content-Type: application/json' -d '{"p_user_id":"00000000-0000-0000-0000-000000000000","p_action":"SUBMIT","p_note":null,"p_actor_id":null}'
```

- [x] **Step 7: Commit**

```bash
git add supabase/migrations/002_confirm_without_company.sql supabase/tests/rules.sql
git commit -m "feat(db): confirm internship without a company; company website optional"
```

---

### Task 3: API — confirm without company, optional website

**Files:**
- Modify: `server/test/errors.test.js`, `server/src/lib/errors.js`
- Modify: `server/src/routes/student.js`
- Modify: `server/src/routes/companies.js`

- [x] **Step 1: Make the removed codes a failing expectation.** In `server/test/errors.test.js`, replace these two lines:

```js
  [{ message: 'COMPANY_REQUIRED: choose a company' }, 422, 'COMPANY_REQUIRED'],
```
```js
  [{ message: 'COMPANY_NOT_FOUND: missing' }, 404, 'COMPANY_NOT_FOUND'],
```

with:

```js
  // Removed in migration 002: no longer domain codes.
  [{ message: 'COMPANY_REQUIRED: gone' }, 500, 'DB_ERROR'],
  [{ message: 'COMPANY_NOT_FOUND: gone' }, 500, 'DB_ERROR'],
```

- [x] **Step 2: Run, expect 2 failures:** `cd server && npm test` → `# fail 2`.

- [x] **Step 3: In `server/src/lib/errors.js`, delete these two lines from `DOMAIN_CODES`**

```js
  COMPANY_REQUIRED: 422,
  COMPANY_NOT_FOUND: 404,
```

- [x] **Step 4: Run:** `npm test` → `# fail 0`.

- [x] **Step 5: `server/src/routes/student.js`.** Replace the `actionBody` definition with:

```js
const actionBody = z.object({
  action: z.enum(['COMPLETE_RESUME', 'COMPLETE_PORTFOLIO', 'SUBMIT', 'CONFIRM']),
});
```

and replace the RPC call inside `POST /actions` with:

```js
    unwrap(
      await supabase.rpc('student_apply_action', {
        p_user_id: req.profile.id,
        p_action: body.action,
        p_actor_id: req.profile.id,
      })
    );
```

and change the doc comment above it from `POST /api/me/actions  { action, company_id? }` to `POST /api/me/actions  { action }`, and `(prerequisites, forward-only, company required)` to `(prerequisites, forward-only)`.

- [x] **Step 6: `server/src/routes/companies.js`.** Replace the `url:` field of `companyBody` (the 5 lines from `url: z` to the `.regex(...)` line) with:

```js
  // Optional: empty string or null clears it. Validated when present.
  url: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string()
      .trim()
      .max(500)
      .regex(/^https?:\/\/\S+$/i, 'URL must start with http:// or https://')
      .nullable()
      .optional()
  ),
```

Then in the `DELETE /companies/:id` handler, replace:

```js
    const { error } = await supabase.from('companies').delete().eq('id', req.params.id);
    if (error?.code === '23503') {
      throw new HttpError(409, 'COMPANY_IN_USE',
        'A student has confirmed this company, so it cannot be deleted');
    }
    if (error) unwrap({ error });
```

with:

```js
    unwrap(await supabase.from('companies').delete().eq('id', req.params.id));
```

and change its doc comment to `/** DELETE /api/companies/:id — creator or advisor. */`.

- [x] **Step 7: Syntax-check and test:** `node --check src/routes/student.js && node --check src/routes/companies.js && npm test` → `# fail 0`.

- [x] **Step 8: Commit**

```bash
git add server/src server/test
git commit -m "feat(api): confirm without company; company website optional"
```

---

### Task 4: Guarded end-to-end API smoke test

This makes the earlier one-off check (69/69 passed on 2026-10-05) reusable. It **writes test data**, so it refuses to run once real students exist, and every run needs the user's OK (CLAUDE.md).

**Files:**
- Create: `server/scripts/smoke-api.mjs`
- Modify: `server/package.json` (add `"smoke": "node --env-file=.env scripts/smoke-api.mjs"` after `"import"`)

- [x] **Step 1: Write `server/scripts/smoke-api.mjs`**

```js
#!/usr/bin/env node
/**
 * End-to-end API smoke test against a running API (API_URL, default
 * http://localhost:4000) and the real Supabase project.
 *
 *   npm run smoke
 *
 * WRITES TEST DATA (student IDs 999…, smoke.* sign-in accounts). Refuses to
 * run when any real student exists. Clean up afterwards with
 * supabase/admin/reset_test_data.sql and the commands it prints.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const API = process.env.API_URL || 'http://localhost:4000';
const clientEnv = Object.fromEntries(
  readFileSync('../client/.env', 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const real = await admin.from('users').select('id', { count: 'exact', head: true })
  .eq('role', 'STUDENT').not('student_id', 'like', '999%');
if (real.error) throw real.error;
if (real.count > 0) {
  console.error(`Refusing to run: ${real.count} real student(s) exist. This test writes data that can't be removed per student.`);
  process.exit(1);
}

const PASSWORD = `Smoke-${crypto.randomUUID()}`;
const EMAIL = {
  advisor: 'smoke.advisor@example.com',
  student: 'smoke.student@mail.kmutt.ac.th',
  student2: 'smoke.student2@mail.kmutt.ac.th',
  outsider: 'smoke.outsider@example.com',
};

async function tokenFor(email) {
  const { error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error && !/already/i.test(error.message)) throw new Error(`createUser ${email}: ${error.message}`);
  const anon = createClient(clientEnv.VITE_SUPABASE_URL, clientEnv.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: e2 } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (e2) throw new Error(`signIn ${email}: ${e2.message}`);
  return data.session.access_token;
}

const results = [];
async function call(token, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: res.status === 204 ? null : await res.json().catch(() => null) };
}
async function check(name, token, method, path, body, expect, extra) {
  let r, ok, why = '';
  try {
    r = await call(token, method, path, body);
    ok = r.status === expect;
    if (!ok) why = `got ${r.status} ${JSON.stringify(r.json?.error ?? r.json).slice(0, 140)}`;
    if (ok && extra) { const m = extra(r.json); if (m !== true) { ok = false; why = String(m); } }
  } catch (e) { ok = false; why = e.message; }
  results.push({ ok, name: `${method} ${path} — ${name}`, why });
  return r?.json;
}
const code = (c) => (j) => j?.error?.code === c || j?.error?.code;
const len = (n) => (j) => j?.data?.length === n || `len=${j?.data?.length}`;

const SID = '99999999701';
const SID_OUT = '99999999702';

await admin.from('users').insert({ role: 'ADVISOR', full_name: 'Smoke Advisor', email: EMAIL.advisor });
const tAdv = await tokenFor(EMAIL.advisor);
const tStu = await tokenFor(EMAIL.student);
const tStu2 = await tokenFor(EMAIL.student2);
const tOut = await tokenFor(EMAIL.outsider);

// Auth + linking
await check('advisor auto-links', tAdv, 'GET', '/api/auth/me', null, 200, (j) => j.profile?.role === 'ADVISOR' || 'not advisor');
await check('advisor adds student', tAdv, 'POST', '/api/advisor/students', { student_id: SID, full_name: 'Smoke Student' }, 201);
await check('advisor adds outsider-email student', tAdv, 'POST', '/api/advisor/students', { student_id: SID_OUT, email: EMAIL.outsider }, 201);
await check('outsider rejected', tOut, 'GET', '/api/auth/me', null, 403, code('DOMAIN_NOT_ALLOWED'));
{
  const { data } = await admin.from('users').select('auth_user_id').eq('student_id', SID_OUT).single();
  results.push({ ok: data.auth_user_id === null, name: 'rejected sign-in did not claim the student row', why: `auth_user_id=${data.auth_user_id}` });
}
await check('student needs link', tStu, 'GET', '/api/auth/me', null, 200, (j) => j.needsLink === true || 'needsLink false');
await check('blocked before link', tStu, 'GET', '/api/me/progress', null, 409, code('NEEDS_LINK'));
await check('link unknown ID', tStu, 'POST', '/api/auth/link', { student_id: '99999999799' }, 404, code('STUDENT_NOT_FOUND'));
await check('link roster ID', tStu, 'POST', '/api/auth/link', { student_id: SID }, 200);
await check('second account same ID', tStu2, 'POST', '/api/auth/link', { student_id: SID }, 409, code('ALREADY_CLAIMED'));

// Companies (website optional)
const co = await check('add with website', tStu, 'POST', '/api/companies',
  { name: 'Smoke Studio 100%', business_type_id: 4, url: 'https://smoke.example.com', work_mode: 'ONSITE', source_type: 'SENIOR' }, 201);
const co2 = await check('add without website', tStu, 'POST', '/api/companies',
  { name: 'Smoke Agency', business_type_id: 10, work_mode: 'HYBRID', source_type: 'CLASSMATE' }, 201,
  (j) => j.data?.url === null || `url=${j.data?.url}`);
await check('empty website becomes null', tStu, 'PATCH', `/api/companies/${co?.data?.id}`, { url: '' }, 200,
  (j) => j.data?.url === null || `url=${j.data?.url}`);
await check('bad website rejected', tStu, 'POST', '/api/companies',
  { name: 'Bad', business_type_id: 1, url: 'example.com', work_mode: 'ONSITE', source_type: 'SENIOR' }, 400);
await check('duplicate name', tStu, 'POST', '/api/companies',
  { name: ' smoke agency ', business_type_id: 1, work_mode: 'ONSITE', source_type: 'SENIOR' }, 409, code('DUPLICATE_NAME'));
await check('literal % search', tStu, 'GET', '/api/companies?q=' + encodeURIComponent('%'), null, 200, len(1));
await check('source filter', tStu, 'GET', '/api/companies?source=SENIOR', null, 200, len(1));
await check('types + mode filter', tStu, 'GET', '/api/companies?types=4,10&mode=HYBRID', null, 200, len(1));

// Progress (confirm needs no company)
await check('submit too early', tStu, 'POST', '/api/me/actions', { action: 'SUBMIT' }, 422, code('PREREQ_NOT_MET'));
await check('portfolio', tStu, 'POST', '/api/me/actions', { action: 'COMPLETE_PORTFOLIO' }, 200);
await check('resume', tStu, 'POST', '/api/me/actions', { action: 'COMPLETE_RESUME' }, 200);
await check('confirm before submit', tStu, 'POST', '/api/me/actions', { action: 'CONFIRM' }, 409, code('INVALID_TRANSITION'));
await check('submit', tStu, 'POST', '/api/me/actions', { action: 'SUBMIT' }, 200);
await check('confirm', tStu, 'POST', '/api/me/actions', { action: 'CONFIRM' }, 200,
  (j) => j.data?.current_status === 'INTERNSHIP_CONFIRMED' || j.data?.current_status);
await check('timeline has 5 events', tStu, 'GET', '/api/me/timeline', null, 200, len(5));
await check('creator deletes company', tStu, 'DELETE', `/api/companies/${co?.data?.id}`, null, 204);
await check('other student cannot delete', tStu2, 'DELETE', `/api/companies/${co2?.data?.id}`, null, 409, code('NEEDS_LINK'));

// Advisor
await check('student cannot see metrics', tStu, 'GET', '/api/advisor/metrics', null, 403);
await check('metrics', tAdv, 'GET', '/api/advisor/metrics', null, 200,
  (j) => (j.data?.total === 2 && j.data?.by_status?.INTERNSHIP_CONFIRMED === 1) || JSON.stringify(j.data));
await check('roster filters', tAdv, 'GET', '/api/advisor/students?status=INTERNSHIP_CONFIRMED&resume=true', null, 200, len(1));
const roster = await call(tAdv, 'GET', '/api/advisor/students?q=Smoke');
const rowId = roster.json?.data?.[0]?.id;
await check('detail + timeline', tAdv, 'GET', `/api/advisor/students/${rowId}`, null, 200,
  (j) => (j.data?.timeline?.length === 5 && j.data?.student?.created_at) || 'missing timeline or created_at');
await check('unlink', tAdv, 'POST', `/api/advisor/students/${rowId}/unlink`, null, 200);
await check('relink keeps progress', tStu, 'POST', '/api/auth/link', { student_id: SID }, 200,
  (j) => j.profile?.current_status === 'INTERNSHIP_CONFIRMED' || j.profile?.current_status);

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.why}`}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
console.log('\nClean up: run supabase/admin/reset_test_data.sql (with confirm), then:');
console.log("  delete from public.users where email = 'smoke.advisor@example.com';");
console.log('  and delete the smoke.* sign-in accounts (Authentication → Users, or the admin API).');
process.exitCode = failed.length ? 1 : 0;
```

- [x] **Step 2: Ask the user to confirm the run.** Then start the API (`cd server && npm run dev`) and, in a second terminal, run `cd server && npm run smoke`.

Expected: every line `PASS`, final `N/N passed`.

- [x] **Step 3: Clean up (the same confirmation covers it).** Stop the API. Run a scratch copy of `supabase/admin/reset_test_data.sql` with `'no'` changed to `'yes'` (never commit that change). Then:

```bash
DB_URL="$(grep -m1 '^SUPABASE_DB_URL=' server/.env | cut -d= -f2- | tr -d '\r')"
"/c/Program Files/PostgreSQL/18/bin/psql.exe" "$DB_URL" -X -q -c "delete from public.users where email = 'smoke.advisor@example.com'"
cd server && node --env-file=.env --input-type=module -e "
import { supabase } from './src/lib/supabase.js';
const { data } = await supabase.auth.admin.listUsers();
for (const u of data.users.filter((u) => /^smoke\./.test(u.email))) await supabase.auth.admin.deleteUser(u.id);"
```

Verify the database is back to 0 users, 0 companies, 0 log rows and 0 `auth.users`.

- [x] **Step 4: Commit**

```bash
git add server/scripts/smoke-api.mjs server/package.json
git commit -m "test: guarded end-to-end API smoke test"
```

---

### Task 5: README — rules, API reference, setup

**Files:**
- Modify: `README.md` (lines 26, 27, 41, 134, 136, 141, 142, 150, 154 as of 2026-10-05)

- [x] **Step 1: Apply these replacements**

| Old | New |
|---|---|
| `\| ยืนยันที่ฝึกงาน requires a company from the catalog \| SQL function + \`users_confirmed_requires_company\` CHECK constraint \|` | `\| ยืนยันที่ฝึกงาน requires ยื่นแล้ว first \| \`student_apply_action()\` \|` |
| `…status can't drop, and the confirmed company can't change \|` | `…status can't drop \|` |
| `2. Open **SQL Editor**, paste in \`supabase/migrations/001_schema.sql\`, and run it.` | `2. Open **SQL Editor** and run each file in \`supabase/migrations/\` in order (\`001_schema.sql\`, then \`002_confirm_without_company.sql\`).` |
| `Add a company (\`name, business_type_id, url, work_mode, source_type, note?\`)` | `Add a company (\`name, business_type_id, work_mode, source_type, url?, note?\`)` |
| `Delete a company. Returns \`409 COMPANY_IN_USE\` if a student has confirmed it.` | `Delete a company.` |
| `\| GET \| \`/api/me/progress\` \| Flags, status, confirmed company \|` | `\| GET \| \`/api/me/progress\` \| Flags and status \|` |
| `CONFIRM, company_id? }\`` | `CONFIRM }\`` |
| the `COMPANY_REQUIRED` row | delete the row |
| the `COMPANY_NOT_FOUND` row | delete the row |

- [x] **Step 2: Check nothing stale remains:** `grep -nE "company_id|COMPANY_(IN_USE|REQUIRED|NOT_FOUND)|confirmed company" README.md` → no output.

- [x] **Step 3: Commit:** `git add README.md && git commit -m "docs: README for confirm-without-company and optional website"`

---

## Phase B — Client foundation

### Task 6: Tooling — Vitest, app version, same-origin `/api`, PKCE

This also completes the client half of launch-plan Task 9 (defects D4 and D5).

**Files:**
- Modify: `client/package.json`, `client/vite.config.js`, `client/.env.example`
- Rewrite: `client/src/lib/api.js`, `client/src/lib/supabase.js`

- [x] **Step 1: Upgrade the toolchain, install Vitest, add the script** (decided 2026-10-05: the old Vite 5 / React Router 6 had advisories, and every fix was a major version. `npm audit` must show 0 vulnerabilities afterwards. New code imports from `react-router`; `react-router-dom` stays only until Task 22.)

```bash
cd client && npm install react-router@^7.18.4 react-router-dom@^7.18.4
npm install -D vite@^8.3.2 vitest@^5.0.3 @vitejs/plugin-react@^6.1.1 @tailwindcss/vite@^4.3.3 tailwindcss@^4.3.3
```

In `client/package.json` `scripts`, add `"test": "vitest run"`.

- [x] **Step 2: Replace `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Shown on the profile screen as "เวอร์ชัน x.y.z".
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: {
    port: 5173,
    // Same-origin /api in dev, matching Caddy's routing in production.
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
```

- [x] **Step 3: Replace `client/.env.example`**

```
# Supabase project settings (Project Settings -> API Keys)
# The publishable (anon) key is safe in the browser: it is only used for
# Google sign-in. All data goes through the Express API at /api.
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key

# Shown as a hint on Google's account picker
VITE_STUDENT_EMAIL_DOMAIN=mail.kmutt.ac.th
```

- [x] **Step 4: Replace `client/src/lib/api.js`**

```js
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, body) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  let res;
  try {
    // Always same-origin: Caddy routes /api in production, Vite proxies it in dev.
    res = await fetch(path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Network error');
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error || {};
    throw new ApiError(res.status, e.code || 'HTTP_ERROR', e.message || res.statusText, e.details);
  }
  return json;
}

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return s ? `?${s}` : '';
};

export const api = {
  me: () => request('GET', '/api/auth/me'),
  link: (student_id) => request('POST', '/api/auth/link', { student_id }),

  businessTypes: () => request('GET', '/api/business-types'),
  companies: (params = {}) => request('GET', `/api/companies${qs(params)}`),
  createCompany: (body) => request('POST', '/api/companies', body),
  updateCompany: (id, body) => request('PATCH', `/api/companies/${id}`, body),
  deleteCompany: (id) => request('DELETE', `/api/companies/${id}`),

  myProgress: () => request('GET', '/api/me/progress'),
  myTimeline: () => request('GET', '/api/me/timeline'),
  applyAction: (action) => request('POST', '/api/me/actions', { action }),

  metrics: () => request('GET', '/api/advisor/metrics'),
  roster: (params = {}) => request('GET', `/api/advisor/students${qs(params)}`),
  studentDetail: (id) => request('GET', `/api/advisor/students/${id}`),
  addStudent: (body) => request('POST', '/api/advisor/students', body),
  unlinkStudent: (id) => request('POST', `/api/advisor/students/${id}/unlink`),
};
```

- [x] **Step 5: Replace `client/src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js';

// Used only for Google sign-in. Data access goes through the Express API.
// PKCE returns ?code= instead of a #token hash, so sign-in doesn't fight the router.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { flowType: 'pkce' } }
);

export const STUDENT_EMAIL_DOMAIN = import.meta.env.VITE_STUDENT_EMAIL_DOMAIN || 'mail.kmutt.ac.th';

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      // "hd" pre-filters Google's account picker; the server enforces the domain.
      queryParams: { hd: STUDENT_EMAIL_DOMAIN, prompt: 'select_account' },
    },
  });
}
```

- [x] **Step 6: Check:** `grep -rn "VITE_API_URL\|localhost:4000" client/src client/.env.example` → no output. (`client/.env` is git-ignored; delete a `VITE_API_URL` line there too if present.)

- [x] **Step 7: Commit**

```bash
git add client/package.json client/package-lock.json client/vite.config.js client/.env.example client/src/lib/api.js client/src/lib/supabase.js
git commit -m "chore(client): vitest, app version, same-origin /api, PKCE sign-in"
```

---

### Task 7: Design tokens, Kanit, base CSS

All values come from the design files' inline styles.

**Files:**
- Rewrite: `client/index.html`, `client/src/index.css`

- [ ] **Step 1: Replace `client/index.html`** (`viewport-fit=cover` enables the safe-area insets)

```html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#FFF8F0" />
    <title>CMM Internship Tracker</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Replace `client/src/index.css`**

```css
@import 'tailwindcss';

/* Tokens from the Claude Design bundle (docs/design/…). */
@theme {
  --font-sans: 'Kanit', system-ui, sans-serif;

  --color-canvas: #ede4d9;      /* outside the phone column */
  --color-cream: #fff8f0;       /* app background */
  --color-bark: #3b2f2f;        /* text */
  --color-muted: #8a7b76;
  --color-muted-strong: #6b5a50;
  --color-faint: #a89a94;       /* placeholders */
  --color-line: #e3d6c8;
  --color-line-soft: #f3e7da;
  --color-dash: #eadfd3;
  --color-sand: #f1ece6;
  --color-locked: #efeae5;
  --color-locked-ink: #a1948d;
  --color-leaf: #3dbe8b;
  --color-leaf-deep: #2e9e72;
  --color-forest: #0f3d2e;
  --color-mint: #d6f5e6;
  --color-mint-ink: #146b48;
  --color-vine: #9eddc2;
  --color-link: #1e7a57;
  --color-danger: #b42318;
  --color-danger-soft: #ffe3e3;
  --color-danger-tint: #fff7f7;
  --color-danger-line: #f6c9c4;
  --color-warn-soft: #fff1c9;
  --color-warn-ink: #8a5a00;

  --shadow-card: 0 1px 2px rgba(120, 80, 40, 0.06), 0 8px 24px rgba(120, 80, 40, 0.07);
  --shadow-sheet: 0 -10px 30px rgba(59, 47, 47, 0.12);
  --shadow-bar: 0 -6px 20px rgba(120, 80, 40, 0.08);
  --shadow-fab: 0 4px 0 #2e9e72, 0 12px 28px rgba(15, 61, 46, 0.3);
}

@layer base {
  html,
  body {
    background: var(--color-canvas);
  }
  body {
    margin: 0;
    font-family: var(--font-sans);
    color: var(--color-bark);
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
}

@layer components {
  .btn {
    display: flex;
    width: 100%;
    height: 52px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
  }
  .btn-primary {
    background: var(--color-leaf);
    color: var(--color-forest);
    box-shadow: 0 3px 0 var(--color-leaf-deep);
    transition: transform 0.12s, box-shadow 0.12s;
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--color-leaf-deep);
  }
  .btn-primary:disabled,
  .btn-locked {
    background: var(--color-locked);
    color: var(--color-locked-ink);
    box-shadow: none;
    cursor: not-allowed;
  }
  .btn-secondary {
    background: #fff;
    border: 1.5px solid var(--color-leaf);
    color: var(--color-forest);
  }
  /* (extrapolated) destructive sheet button, from the card's ลบ outline */
  .btn-danger {
    background: #fff;
    border: 1.5px solid var(--color-danger-line);
    color: var(--color-danger);
  }
  .card {
    background: #fff;
    border-radius: 20px;
    box-shadow: var(--shadow-card);
  }
  .chip {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1.5px solid var(--color-line);
    background: #fff;
    color: var(--color-bark);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.3;
  }
  .chip[aria-pressed='true'],
  .chip[aria-checked='true'] {
    background: var(--color-leaf);
    border-color: var(--color-leaf);
    color: var(--color-forest);
    font-weight: 600;
  }
  .pill {
    display: inline-flex;
    height: 28px;
    align-items: center;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }
  .pill-sm {
    height: 26px;
    padding: 0 10px;
  }
  .field {
    width: 100%;
    height: 48px;
    border-radius: 14px;
    border: 1.5px solid var(--color-line);
    background: #fff;
    padding: 0 14px;
    font-size: 16px;
    color: var(--color-bark);
    outline: none;
  }
  .field::placeholder {
    color: var(--color-faint);
  }
  .field:focus {
    border: 2px solid var(--color-leaf);
    box-shadow: 0 0 0 4px var(--color-mint);
  }
  .field[aria-invalid='true'] {
    border: 1.5px solid var(--color-danger);
    background: var(--color-danger-tint);
    box-shadow: none;
  }
  textarea.field {
    height: 80px;
    padding: 12px 14px;
    resize: none;
  }
  .label {
    font-size: 16px;
    font-weight: 600;
  }
  .hint {
    font-size: 13px;
    color: var(--color-muted);
  }
  .title-page {
    font: 500 24px/1.2 var(--font-sans);
  }
  .title-sheet {
    font: 500 24px/1.3 var(--font-sans);
  }
  .title-section {
    font: 500 18px/1.3 var(--font-sans);
  }
  .link-action {
    display: flex;
    height: 44px;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-link);
    text-decoration: underline;
  }
  .grabber {
    width: 40px;
    height: 5px;
    margin: 0 auto;
    border-radius: 3px;
    background: var(--color-line);
  }
  .no-scrollbar {
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 3: Build:** `cd client && npm run build` → `✓ built`. (The old pages still compile; they're replaced later.)

- [ ] **Step 4: Commit:** `git add client/index.html client/src/index.css && git commit -m "feat(client): design tokens, Kanit font, base component styles"`

---

### Task 8: Logic — status, dates, initials, avatar colours

**Files:**
- Create: `client/src/lib/status.js`, `client/src/lib/status.test.js`
- Create: `client/src/lib/format.js`, `client/src/lib/format.test.js`

- [ ] **Step 1: Write `client/src/lib/status.test.js`**

```js
import { describe, expect, test } from 'vitest';
import { homeHint, isReady, lockedSubmitHint, stageFor, statusPill, stepIndex } from './status';

const p = (current_status, r = false, pf = false) => ({ current_status, is_resume_ready: r, is_portfolio_ready: pf });

describe('stageFor / stepIndex', () => {
  test.each([
    [p('NOT_STARTED'), 'seed', 0],
    [p('RESUME_DONE', true), 'resume', 1],
    [p('PORTFOLIO_DONE', false, true), 'portfolio', 1],
    [p('RESUME_DONE', true, true), 'both', 2],
    [p('PORTFOLIO_DONE', true, true), 'both', 2],
    [p('APPLICATIONS_SUBMITTED', true, true), 'bud', 3],
    [p('INTERNSHIP_CONFIRMED', true, true), 'bloom', 4],
  ])('%o → %s', (progress, stage, step) => {
    expect(stageFor(progress)).toBe(stage);
    expect(stepIndex(progress)).toBe(step);
  });
});

test('locked submit hint names what is missing (design 3a)', () => {
  expect(lockedSubmitHint(p('PORTFOLIO_DONE', false, true))).toBe('ต้องทำ Resume ให้เสร็จก่อน');
  expect(lockedSubmitHint(p('NOT_STARTED'))).toBe('ต้องทำ Resume และ Portfolio ให้เสร็จก่อน');
});

test('home hints use the design copy', () => {
  expect(homeHint(p('PORTFOLIO_DONE', false, true))).toBe('อีกนิดเดียว! ทำ Resume ให้เสร็จเพื่อปลดล็อกการยื่นสมัคร');
  expect(homeHint(p('RESUME_DONE', true, true))).toBe('เอกสารครบแล้ว! ยื่นสมัครแล้วกด “ยื่นแล้ว” ด้านล่างได้เลย');
});

test('status pill adds เอกสารครบ when both documents are done (design 3c)', () => {
  expect(statusPill(p('RESUME_DONE', true, true))).toEqual({ label: 'ทำ Resume แล้ว · เอกสารครบ', bg: '#DDF0FF', fg: '#1F5A8A' });
  expect(statusPill(p('PORTFOLIO_DONE', false, true)).label).toBe('ทำ Portfolio แล้ว');
});

test('ready = both documents, not yet submitted', () => {
  expect(isReady(p('RESUME_DONE', true, true))).toBe(true);
  expect(isReady(p('APPLICATIONS_SUBMITTED', true, true))).toBe(false);
  expect(isReady(p('RESUME_DONE', true))).toBe(false);
});
```

- [ ] **Step 2: Write `client/src/lib/format.test.js`**

```js
import { expect, test } from 'vitest';
import { AVATARS, avatarColors, formatThaiDate, formatThaiDateTime, thaiInitial } from './format';

test('Thai dates in Bangkok time with the Buddhist year', () => {
  expect(formatThaiDateTime('2026-09-12T14:30:02Z')).toBe('12 ก.ย. 2569 21:30');
  expect(formatThaiDateTime('2026-09-12T14:30:02Z', { seconds: true })).toBe('12 ก.ย. 2569 21:30:02');
  expect(formatThaiDateTime('2026-10-01T17:05:00Z')).toBe('2 ต.ค. 2569 00:05');
  expect(formatThaiDate('2026-09-01T03:00:00Z')).toBe('1 ก.ย. 2569');
  expect(formatThaiDate(null)).toBe('');
});

test('initials skip leading vowels and academic titles', () => {
  expect(thaiInitial('สมชาย ใจดี')).toBe('ส');
  expect(thaiInitial('เกศินี ดีงาม')).toBe('ก');
  expect(thaiInitial('ไพลิน')).toBe('พ');
  expect(thaiInitial('ผศ.ดร. วรรณา ศรีงาม')).toBe('ว');
  expect(thaiInitial('อรุณ')).toBe('อ');
  expect(thaiInitial('pixel Forge')).toBe('P');
  expect(thaiInitial('')).toBe('?');
});

test('avatar colours are stable and from the design palette', () => {
  expect(avatarColors('Pixel Forge Studio')).toEqual(avatarColors('Pixel Forge Studio'));
  const { bg, fg } = avatarColors('Moonbeam Media');
  expect(AVATARS).toContainEqual([bg, fg]);
});
```

- [ ] **Step 3: Run, expect failure:** `cd client && npm test` → fails with `Failed to resolve import "./status"`.

- [ ] **Step 4: Write `client/src/lib/status.js`**

```js
// Status palette and plant stages, from the design's ST / stages tables.
export const STATUS = {
  NOT_STARTED: { label: 'ยังไม่เตรียมตัว', bg: '#F1ECE6', fg: '#6B5A50', stage: 'seed', leaf: '#E6D8C8', bar: '#BBA898' },
  RESUME_DONE: { label: 'ทำ Resume แล้ว', bg: '#DDF0FF', fg: '#1F5A8A', stage: 'resume', leaf: '#9CD2FF', bar: '#6DB4F0' },
  PORTFOLIO_DONE: { label: 'ทำ Portfolio แล้ว', bg: '#EDE4FF', fg: '#5B3FA8', stage: 'portfolio', leaf: '#C9B6FF', bar: '#A58BEA' },
  APPLICATIONS_SUBMITTED: { label: 'ยื่นแล้ว', bg: '#FFF1C9', fg: '#8A5A00', stage: 'bud', leaf: '#FFD66B', bar: '#F2C24B' },
  INTERNSHIP_CONFIRMED: { label: 'ยืนยันที่ฝึกงาน', bg: '#D6F5E6', fg: '#146B48', stage: 'bloom', leaf: '#86D9AE', bar: '#3DBE8B' },
};
export const STATUS_ORDER = Object.keys(STATUS);

// The 5-step strip on the student home card (StudentHome.dc).
export const STRIP_LABELS = ['เมล็ด', 'แตกใบ', 'ใบคู่', 'ตูม', 'บาน'];
const STAGE_STEP = { seed: 0, resume: 1, portfolio: 1, both: 2, bud: 3, bloom: 4 };

export const docsComplete = (p) => p.is_resume_ready && p.is_portfolio_ready;
export const isSubmitted = (p) =>
  p.current_status === 'APPLICATIONS_SUBMITTED' || p.current_status === 'INTERNSHIP_CONFIRMED';
export const isConfirmed = (p) => p.current_status === 'INTERNSHIP_CONFIRMED';
/** Both documents done but not submitted: the design's "ครบแต่ยังไม่ยื่น". */
export const isReady = (p) => docsComplete(p) && !isSubmitted(p);

export function stageFor(p) {
  if (isConfirmed(p)) return 'bloom';
  if (isSubmitted(p)) return 'bud';
  if (docsComplete(p)) return 'both';
  if (p.is_resume_ready) return 'resume';
  if (p.is_portfolio_ready) return 'portfolio';
  return 'seed';
}

export const stepIndex = (p) => STAGE_STEP[stageFor(p)];

export function missingDocs(p) {
  const missing = [];
  if (!p.is_resume_ready) missing.push('Resume');
  if (!p.is_portfolio_ready) missing.push('Portfolio');
  return missing;
}

export const lockedSubmitHint = (p) => `ต้องทำ ${missingDocs(p).join(' และ ')} ให้เสร็จก่อน`;

export function homeHint(p) {
  switch (stageFor(p)) {
    case 'seed':
      return 'เริ่มจากทำ Resume หรือ Portfolio ก่อนก็ได้ ทำเสร็จแล้วกดบันทึกได้เลย'; // (extrapolated)
    case 'resume':
    case 'portfolio':
      return `อีกนิดเดียว! ทำ ${missingDocs(p)[0]} ให้เสร็จเพื่อปลดล็อกการยื่นสมัคร`;
    case 'both':
      return 'เอกสารครบแล้ว! ยื่นสมัครแล้วกด “ยื่นแล้ว” ด้านล่างได้เลย';
    case 'bud':
      return 'ยื่นสมัครแล้ว! ได้ที่ฝึกงานเมื่อไหร่ กด “ยืนยันที่ฝึกงาน” ด้านล่างได้เลย'; // (extrapolated)
    default:
      return 'ยืนยันที่ฝึกงานแล้ว ต้นกล้าบานเต็มที่!'; // (extrapolated, from 3f)
  }
}

export function statusPill(p) {
  const s = STATUS[p.current_status];
  return { label: stageFor(p) === 'both' ? `${s.label} · เอกสารครบ` : s.label, bg: s.bg, fg: s.fg };
}
```

- [ ] **Step 5: Write `client/src/lib/format.js`**

```js
const DATETIME = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Bangkok',
});

const parts = (value) =>
  Object.fromEntries(DATETIME.formatToParts(new Date(value)).map((p) => [p.type, p.value]));

/** "1 ก.ย. 2569" */
export function formatThaiDate(value) {
  if (!value) return '';
  const p = parts(value);
  return `${p.day} ${p.month} ${p.year}`;
}

/** "12 ก.ย. 2569 21:30", or with seconds "12 ก.ย. 2569 21:30:02" (advisor timeline). */
export function formatThaiDateTime(value, { seconds = false } = {}) {
  if (!value) return '';
  const p = parts(value);
  return `${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute}${seconds ? `:${p.second}` : ''}`;
}

// Academic titles need a dot, so names that merely start with อ are kept.
const TITLES = /^(?:(?:ศ|รศ|ผศ|อ|ดร)\.\s*)+/;
const LEADING_VOWELS = /^[\sเ-ไ]+/; // เ แ โ ใ ไ

/** First letter for an avatar: "ผศ.ดร. วรรณา" → "ว", "เกศินี" → "ก". */
export function thaiInitial(name) {
  const s = (name || '').trim().replace(TITLES, '').replace(LEADING_VOWELS, '');
  return s ? s[0].toUpperCase() : '?';
}

// The design's AV palette: [background, text].
export const AVATARS = [
  ['#FFE1D2', '#9A3F12'],
  ['#DDF0FF', '#1F5A8A'],
  ['#EDE4FF', '#5B3FA8'],
  ['#FFF1C9', '#8A5A00'],
  ['#D6F5E6', '#146B48'],
  ['#FFE3EC', '#A3345B'],
];

/** Stable colour per name/id, so a company or person keeps its colour. */
export function avatarColors(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const [bg, fg] = AVATARS[h % AVATARS.length];
  return { bg, fg };
}
```

- [ ] **Step 6: Run:** `npm test` → all pass.

- [ ] **Step 7: Commit:** `git add client/src/lib/status.* client/src/lib/format.* && git commit -m "feat(client): status stages, Thai dates, initials, avatar colours"`

---

### Task 9: Logic — timeline/history, companies, roster

**Files:**
- Create: `client/src/lib/timeline.js` + `.test.js`, `client/src/lib/companies.js` + `.test.js`, `client/src/lib/roster.js` + `.test.js`

- [ ] **Step 1: Write the three tests**

`client/src/lib/timeline.test.js`:

```js
import { expect, test } from 'vitest';
import { eventTime, eventView, historyFor } from './timeline';

const ev = (id, event, previous_status, new_status, changed_at, note = null) =>
  ({ id, event, previous_status, new_status, changed_at, note });
const INIT = ev(1, 'INITIALIZED', null, 'NOT_STARTED', '2026-09-01T03:12:44Z', 'นำเข้าจากแบบฟอร์ม');
const PORT = ev(2, 'PORTFOLIO_COMPLETED', 'NOT_STARTED', 'PORTFOLIO_DONE', '2026-09-08T10:05:10Z');
const RES = ev(3, 'RESUME_COMPLETED', 'PORTFOLIO_DONE', 'RESUME_DONE', '2026-09-12T14:30:02Z');

test('history: done documents in completion order, then pending, then later steps (design 3a)', () => {
  const h = historyFor([INIT, PORT]);
  expect(h.map((r) => r.event)).toEqual([
    'INITIALIZED', 'PORTFOLIO_COMPLETED', 'RESUME_COMPLETED', 'APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED',
  ]);
  expect(h.map((r) => r.done)).toEqual([true, true, false, false, false]);
  expect(h[0]).toMatchObject({ title: 'เริ่มต้นสถานะ: ยังไม่เตรียมตัว', time: '1 ก.ย. 2569 10:12', note: 'นำเข้าจากแบบฟอร์ม' });
  expect(h[2]).toMatchObject({ title: 'ทำ Resume เสร็จ', time: null });
});

test('history: with nothing done, Resume is listed before Portfolio', () => {
  expect(historyFor([INIT]).slice(1, 3).map((r) => r.event)).toEqual(['RESUME_COMPLETED', 'PORTFOLIO_COMPLETED']);
});

test('advisor timeline row (design 5d)', () => {
  expect(eventView(RES)).toMatchObject({
    title: 'ทำ Resume เสร็จ',
    time: '12 ก.ย. 2569 21:30:02',
    leaf: '#9CD2FF',
    isConfirm: false,
  });
  expect(eventView(RES).from.label).toBe('ทำ Portfolio แล้ว');
  expect(eventView(INIT).from).toBeNull();
});

test('eventTime finds when a step happened', () => {
  expect(eventTime([INIT, PORT], 'PORTFOLIO_COMPLETED')).toBe('2026-09-08T10:05:10Z');
  expect(eventTime([INIT], 'RESUME_COMPLETED')).toBeNull();
});
```

`client/src/lib/companies.test.js`:

```js
import { expect, test } from 'vitest';
import { EMPTY_FILTERS, directoryQuery, displayUrl, hasAnyFilter, sheetFilterCount, toUrl } from './companies';

test('directory query drops "ALL" and empty values', () => {
  expect(directoryQuery(EMPTY_FILTERS)).toEqual({ q: undefined, mode: undefined, types: undefined, source: undefined });
  expect(directoryQuery({ q: ' pixel ', mode: 'ONSITE', types: [4, 1], source: 'SENIOR' }))
    .toEqual({ q: 'pixel', mode: 'ONSITE', types: '1,4', source: 'SENIOR' });
});

test('filter badge counts sheet filters only (design 4a shows 2)', () => {
  expect(sheetFilterCount({ ...EMPTY_FILTERS, types: [1, 4] })).toBe(2);
  expect(sheetFilterCount({ ...EMPTY_FILTERS, types: [1], source: 'SENIOR', mode: 'ONLINE' })).toBe(2);
  expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false);
  expect(hasAnyFilter({ ...EMPTY_FILTERS, mode: 'ONLINE' })).toBe(true);
});

test('website input: optional, https added when missing', () => {
  expect(toUrl('')).toBeNull();
  expect(toUrl('  ')).toBeNull();
  expect(toUrl('pixelforge.example.com')).toBe('https://pixelforge.example.com');
  expect(toUrl('http://a.example.com')).toBe('http://a.example.com');
  expect(displayUrl('https://pixelforge.example.com/')).toBe('pixelforge.example.com');
});
```

`client/src/lib/roster.test.js`:

```js
import { expect, test } from 'vitest';
import { EMPTY_ROSTER, percent, rosterFilterCount, rosterQuery } from './roster';

test('roster query drops "ALL"', () => {
  expect(rosterQuery(EMPTY_ROSTER)).toEqual({ q: undefined, status: undefined, resume: undefined, portfolio: undefined });
  expect(rosterQuery({ q: '6708', status: 'APPLICATIONS_SUBMITTED', resume: 'true', portfolio: 'false' }))
    .toEqual({ q: '6708', status: 'APPLICATIONS_SUBMITTED', resume: 'true', portfolio: 'false' });
});

test('filter count and tile percentages (design 5a: 9/42 = 21%, 13/42 = 31%, 8/42 = 19%)', () => {
  expect(rosterFilterCount({ ...EMPTY_ROSTER, status: 'RESUME_DONE', resume: 'true' })).toBe(2);
  expect(percent(9, 42)).toBe('21%');
  expect(percent(13, 42)).toBe('31%');
  expect(percent(8, 42)).toBe('19%');
  expect(percent(0, 0)).toBe('0%');
});
```

- [ ] **Step 2: Run, expect failure:** `npm test` → fails to resolve `./timeline`, `./companies`, `./roster`.

- [ ] **Step 3: Write `client/src/lib/timeline.js`**

```js
import { formatThaiDateTime } from './format';
import { STATUS } from './status';

export const EVENT_TITLE = {
  INITIALIZED: 'เริ่มต้นสถานะ: ยังไม่เตรียมตัว',
  RESUME_COMPLETED: 'ทำ Resume เสร็จ',
  PORTFOLIO_COMPLETED: 'ทำ Portfolio เสร็จ',
  APPLICATIONS_SUBMITTED: 'เอกสารครบ และยื่นสมัครแล้ว',
  INTERNSHIP_CONFIRMED: 'ยืนยันที่ฝึกงาน',
};

const DOCS = ['RESUME_COMPLETED', 'PORTFOLIO_COMPLETED'];

export const eventTime = (events, name) => events.find((e) => e.event === name)?.changed_at ?? null;

/** The 5 rows of "ประวัติของฉัน": done documents in the order they happened, then pending ones. */
export function historyFor(events) {
  const find = (name) => events.find((e) => e.event === name);
  const done = DOCS.filter(find).sort((a, b) => find(a).id - find(b).id);
  const pending = DOCS.filter((d) => !find(d));
  return ['INITIALIZED', ...done, ...pending, 'APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED'].map((name) => {
    const row = find(name);
    return {
      event: name,
      title: EVENT_TITLE[name],
      done: Boolean(row),
      time: row ? formatThaiDateTime(row.changed_at) : null,
      note: row?.note || null,
    };
  });
}

/** One row of the advisor's "ไทม์ไลน์สถานะ" (design 5d). */
export function eventView(e) {
  return {
    id: e.id,
    title: EVENT_TITLE[e.event],
    time: formatThaiDateTime(e.changed_at, { seconds: true }),
    from: e.previous_status ? STATUS[e.previous_status] : null,
    to: STATUS[e.new_status],
    leaf: STATUS[e.new_status].leaf,
    note: e.note || null,
    isConfirm: e.event === 'INTERNSHIP_CONFIRMED',
  };
}
```

- [ ] **Step 4: Write `client/src/lib/companies.js`**

```js
// Work-mode pills and filter dots, from Directory.dc.
export const MODES = [
  { value: 'ONSITE', label: 'Onsite', bg: '#FFE1D2', fg: '#9A3F12', dot: '#FFB088' },
  { value: 'ONLINE', label: 'Online', bg: '#DDF0FF', fg: '#1F5A8A', dot: '#8CC8FF' },
  { value: 'HYBRID', label: 'Hybrid', bg: '#EDE4FF', fg: '#5B3FA8', dot: '#B9A2F5' },
];
export const MODE = Object.fromEntries(MODES.map((m) => [m.value, m]));

// Labels from the design's unused srcChips / fromChips.
export const SOURCES = [
  { value: 'SENIOR', label: 'ข้อมูลจากรุ่นพี่' },
  { value: 'CLASSMATE', label: 'ข้อมูลจากเพื่อนร่วมรุ่น' },
];
export const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.value, s.label]));

export const EMPTY_FILTERS = { q: '', mode: 'ALL', types: [], source: 'ALL' };

export function directoryQuery(f) {
  return {
    q: f.q.trim() || undefined,
    mode: f.mode === 'ALL' ? undefined : f.mode,
    types: f.types.length ? [...f.types].sort((a, b) => a - b).join(',') : undefined,
    source: f.source === 'ALL' ? undefined : f.source,
  };
}

/** Badge on the ตัวกรอง button: filters chosen inside the sheet. */
export const sheetFilterCount = (f) => f.types.length + (f.source === 'ALL' ? 0 : 1);
export const hasAnyFilter = (f) => Boolean(f.q.trim()) || f.mode !== 'ALL' || sheetFilterCount(f) > 0;

/** Website field → value for the API: empty → null, scheme added when missing. */
export function toUrl(input) {
  const s = input.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export const displayUrl = (url) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
```

- [ ] **Step 5: Write `client/src/lib/roster.js`**

```js
export const EMPTY_ROSTER = { q: '', status: 'ALL', resume: 'ALL', portfolio: 'ALL' };

export const DOC_FILTERS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'true', label: 'ทำแล้ว' },
  { value: 'false', label: 'ยังไม่ทำ' },
];

export function rosterQuery(f) {
  const v = (x) => (x === 'ALL' ? undefined : x);
  return { q: f.q.trim() || undefined, status: v(f.status), resume: v(f.resume), portfolio: v(f.portfolio) };
}

export const rosterFilterCount = (f) => ['status', 'resume', 'portfolio'].filter((k) => f[k] !== 'ALL').length;

export const percent = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
```

- [ ] **Step 6: Run:** `npm test` → all pass.

- [ ] **Step 7: Commit:** `git add client/src/lib && git commit -m "feat(client): timeline history, directory and roster query helpers"`

---

### Task 10: Sprout mascot + motion engine

**Files:**
- Create: `client/src/lib/motion.js` (port of `docs/design/…/project/motion.js`)
- Create: `client/src/components/Sprout.jsx` (port of `Sprout.dc.html`)
- Modify: `client/src/main.jsx` (start the engine)

- [ ] **Step 1: Write `client/src/lib/motion.js`**

```js
// Port of the design's motion.js. Any element with data-anim="<name>"
// (and optional data-anim-delay="<ms>") is animated with the Web Animations API.
// Changes from the design: no "count" (use <CountUp>), no lively/calm switch,
// and toast/sheet/fade start at 0ms so taps respond immediately.
let started = false;

export function startMotion() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const OUT = 'cubic-bezier(.2,.8,.2,1)';
  const BACK = 'cubic-bezier(.34,1.56,.64,1)';
  const IO = 'ease-in-out';
  const r = (a, b) => a + Math.random() * (b - a);
  const inf = (duration, extra) => ({ duration, iterations: Infinity, easing: IO, ...extra });
  const sway = (deg, origin, delay) => ({
    k: 'loop', origin, kf: [{ rotate: '0deg' }, { rotate: `${deg}deg` }, { rotate: '0deg' }], o: inf(3200, { delay }),
  });

  const P = {
    bob: () => ({ k: 'loop', kf: [{ translate: '0 0' }, { translate: '0 -2.5px' }, { translate: '0 0' }], o: inf(2800, { delay: r(0, 900) }) }),
    'bob-slow': () => ({ k: 'loop', kf: [{ translate: '0 0' }, { translate: '0 -1.5px' }, { translate: '0 0' }], o: inf(3600, { delay: r(0, 900) }) }),
    blink: () => ({
      k: 'loop', origin: '50px 63px',
      kf: [{ scale: '1 1', offset: 0 }, { scale: '1 1', offset: 0.9 }, { scale: '1 .1', offset: 0.94 }, { scale: '1 1', offset: 0.98 }, { scale: '1 1', offset: 1 }],
      o: { duration: r(3800, 5600), iterations: Infinity, delay: r(0, 2500) },
    }),
    'sway-l': () => sway(-7, '50px 35px', 0),
    'sway-r': () => sway(7, '50px 35px', 220),
    'sway-c': () => sway(4, '50px 30px', 120),
    wave: () => ({
      k: 'fx', origin: '69px 62px',
      kf: [{ rotate: '0deg', offset: 0 }, { rotate: '-22deg', offset: 0.14 }, { rotate: '4deg', offset: 0.28 }, { rotate: '-22deg', offset: 0.42 }, { rotate: '0deg', offset: 0.56 }, { rotate: '0deg', offset: 1 }],
      o: inf(2600),
    }),
    drip: () => ({ k: 'fx', kf: [{ translate: '0 0', opacity: 1 }, { translate: '0 7px', opacity: 0 }], o: inf(1700, { easing: 'ease-in' }) }),
    twinkle: () => ({
      k: 'fx', box: 'fill-box', origin: 'center',
      kf: [{ scale: '1', opacity: 1 }, { scale: '.45', opacity: 0.35 }, { scale: '1', opacity: 1 }],
      o: inf(r(1500, 2400), { delay: r(0, 1200) }),
    }),
    float: () => ({ k: 'fx', kf: [{ translate: '0 0' }, { translate: '0 -8px' }, { translate: '0 0' }], o: inf(3800, { delay: r(0, 600) }) }),
    breathe: () => ({ k: 'fx', kf: [{ scale: '1' }, { scale: '1.045' }, { scale: '1' }], o: inf(2400) }),
    pulse: () => ({
      k: 'fx', kf: [{ boxShadow: '0 0 0 3px rgba(61,190,139,.45)' }, { boxShadow: '0 0 0 12px rgba(61,190,139,0)' }],
      o: inf(1700, { easing: 'ease-out' }),
    }),
    glow: () => ({ k: 'fx', kf: [{ scale: '1', opacity: 0.75 }, { scale: '1.1', opacity: 1 }, { scale: '1', opacity: 0.75 }], o: inf(3200) }),
    nudge: () => ({ k: 'fx', kf: [{ translate: '0 0' }, { translate: '0 4px' }, { translate: '0 0' }], o: inf(1100) }),
    fall: (el) => {
      const top = el.offsetTop || 0;
      const x = r(-40, 40);
      return {
        k: 'fx',
        kf: [{ translate: `0 ${-top - 40}px`, rotate: '0deg' }, { translate: `${x}px ${900 - top}px`, rotate: `${r(360, 900)}deg` }],
        o: { duration: r(3400, 6000), delay: r(-4000, 1500), iterations: Infinity, easing: 'linear' },
      };
    },
    rise: () => ({ k: 'once', kf: [{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], o: { duration: 560, easing: OUT } }),
    pop: () => ({ k: 'once', kf: [{ scale: '.6', opacity: 0 }, { scale: '1', opacity: 1 }], o: { duration: 560, easing: BACK, delay: 150 } }),
    'bloom-in': () => ({
      k: 'once', kf: [{ scale: '.4', rotate: '-14deg', opacity: 0 }, { scale: '1', rotate: '0deg', opacity: 1 }],
      o: { duration: 950, easing: BACK, delay: 200 },
    }),
    toast: () => ({ k: 'once', kf: [{ translate: '0 36px', scale: '.92', opacity: 0 }, { translate: '0 0', scale: '1', opacity: 1 }], o: { duration: 650, easing: BACK } }),
    sheet: () => ({ k: 'once', kf: [{ translate: '0 100%' }, { translate: '0 0' }], o: { duration: 560, easing: OUT } }),
    fade: () => ({ k: 'once', kf: [{ opacity: 0 }, { opacity: 1 }], o: { duration: 380, easing: 'ease-out' } }),
    'grow-x': () => ({ k: 'once', origin: 'left center', kf: [{ scale: '0 1' }, { scale: '1 1' }], o: { duration: 1000, easing: OUT, delay: 400 } }),
  };

  function start(el) {
    if (el.__cm && el.__cm.playState !== 'idle') return;
    const make = P[el.getAttribute('data-anim')];
    if (!make || !el.animate) return;
    const p = make(el);
    if (p.box) el.style.transformBox = p.box;
    if (p.origin) el.style.transformOrigin = p.origin;
    const o = { ...p.o, fill: p.k === 'once' ? 'both' : 'none' };
    o.delay = (o.delay || 0) + (parseFloat(el.getAttribute('data-anim-delay')) || 0);
    el.__cm = el.animate(p.kf, o);
  }
  function stop(el) {
    if (el.__cm) {
      el.__cm.cancel();
      el.__cm = null;
    }
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      document.querySelectorAll('[data-anim]').forEach(start);
    });
  };
  new MutationObserver((records) => {
    for (const m of records) if (m.type === 'attributes') stop(m.target);
    schedule();
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-anim'] });
  schedule();
}
```

- [ ] **Step 2: Write `client/src/components/Sprout.jsx`** (geometry copied from `Sprout.dc.html` lines 11–55)

```jsx
const SKY = '#9CD2FF';
const LAV = '#C9B6FF';
const GRN = '#86D9AE';
const LEAF_A = { resume: SKY, both: SKY, bud: GRN, bloom: GRN };
const LEAF_B = { portfolio: LAV, both: LAV, bud: GRN, bloom: GRN };
const NONE = { stroke: 'none' };

/**
 * น้องต้นกล้า. stage: seed | resume | portfolio | both | bud | bloom
 * mood: happy | worried · hold: none | resume | tag | glass · wave: boolean
 */
export default function Sprout({ stage = 'both', size = 80, mood = 'happy', hold = 'none', wave = false }) {
  const a = LEAF_A[stage];
  const b = LEAF_B[stage];
  const tall = stage === 'bud' || stage === 'bloom';
  const worried = mood === 'worried';
  const bodyFill = stage === 'bloom' ? '#CFF3E0' : '#E6F8EE';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', fill: 'none', stroke: '#2F5D4B', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
      <ellipse cx="50" cy="91" rx="32" ry="6" style={{ fill: '#EBD8C3', ...NONE }} />
      {stage === 'seed' ? (
        <g data-anim="bob-slow">
          <ellipse cx="50" cy="79" rx="15" ry="11.5" style={{ fill: '#E6B98C', stroke: '#7A5232' }} />
          <path d="M43 73 Q46 70.5 49 71" style={{ stroke: '#FFF3E2', strokeWidth: 2 }} />
          <circle cx="45" cy="79" r="1.8" style={{ fill: '#3B2F2F', ...NONE }} />
          <circle cx="55" cy="79" r="1.8" style={{ fill: '#3B2F2F', ...NONE }} />
          <path d="M47.5 82.3 Q50 84.3 52.5 82.3" style={{ stroke: '#3B2F2F', strokeWidth: 1.6 }} />
          <path d="M18 92 Q34 84 50 86.5 Q66 84 82 92 Z" style={{ fill: '#D8B894', ...NONE }} />
        </g>
      ) : (
        <g data-anim="bob">
          <path d={tall ? 'M50 43 L50 27' : 'M50 43 L50 35'} />
          {a && <path data-anim="sway-l" d="M50 35 C43 24 32 24 28 30 C33 38 43 39 50 35 Z" fill={a} />}
          {b && <path data-anim="sway-r" d="M50 35 C57 24 68 24 72 30 C67 38 57 39 50 35 Z" fill={b} />}
          {stage === 'bud' && (
            <g data-anim="sway-c">
              <path d="M50 30 C43.5 26 44 16 50 11 C56 16 56.5 26 50 30 Z" fill="#FFD66B" />
              <path d="M44.5 26 Q50 31.5 55.5 26" fill="#86D9AE" />
            </g>
          )}
          {stage === 'bloom' && (
            <g>
              <circle cx="50" cy="10.5" r="6.2" fill="#8FE3BC" />
              <circle cx="58.1" cy="16.4" r="6.2" fill="#8FE3BC" />
              <circle cx="55" cy="25.9" r="6.2" fill="#8FE3BC" />
              <circle cx="45" cy="25.9" r="6.2" fill="#8FE3BC" />
              <circle cx="41.9" cy="16.4" r="6.2" fill="#8FE3BC" />
              <circle cx="50" cy="19" r="5" fill="#FFD66B" />
              <path data-anim="twinkle" d="M16 18 Q16 25 23 25 Q16 25 16 32 Q16 25 9 25 Q16 25 16 18 Z" style={{ fill: '#FFD66B', ...NONE }} />
              <path data-anim="twinkle" d="M84 6 Q84 12 90 12 Q84 12 84 18 Q84 12 78 12 Q84 12 84 6 Z" style={{ fill: '#FFD66B', ...NONE }} />
              <path data-anim="twinkle" d="M89 38 Q89 42.5 93.5 42.5 Q89 42.5 89 47 Q89 42.5 84.5 42.5 Q89 42.5 89 38 Z" style={{ fill: '#9CD2FF', ...NONE }} />
            </g>
          )}
          {hold !== 'resume' && <path d="M30 70 Q22 73 23 80" />}
          {!wave && hold !== 'glass' && <path d="M70 70 Q78 73 77 80" />}
          {wave && (
            <g data-anim="wave">
              <path d="M69 62 Q80 56 81 46" />
              <circle cx="81" cy="44" r="3.6" fill={bodyFill} />
            </g>
          )}
          {hold === 'resume' && (
            <g>
              <path d="M31 66 Q24 64 21 61" />
              <g transform="rotate(-12 13 58)">
                <rect x="4" y="46" width="18" height="23" rx="2.5" fill="#FFFFFF" />
                <path d="M8 52 L18 52 M8 56.5 L18 56.5 M8 61 L14 61" style={{ stroke: '#8CC8FF', strokeWidth: 2 }} />
              </g>
            </g>
          )}
          {hold === 'glass' && <path d="M70 70 Q75 70 76 67" />}
          <circle cx="50" cy="65" r="22" fill={bodyFill} style={{ strokeWidth: 2.6 }} />
          <g data-anim="blink">
            <circle cx="43" cy="63" r="2.8" style={{ fill: '#3B2F2F', ...NONE }} />
            <circle cx="57" cy="63" r="2.8" style={{ fill: '#3B2F2F', ...NONE }} />
            <circle cx="44" cy="62" r="0.9" style={{ fill: '#FFFFFF', ...NONE }} />
            <circle cx="58" cy="62" r="0.9" style={{ fill: '#FFFFFF', ...NONE }} />
          </g>
          <ellipse cx="37" cy="69.5" rx="4" ry="2.5" style={{ fill: '#FFB5B5', ...NONE }} />
          <ellipse cx="63" cy="69.5" rx="4" ry="2.5" style={{ fill: '#FFB5B5', ...NONE }} />
          {worried ? (
            <g>
              <path d="M46.5 72.5 Q50 69.5 53.5 72.5" style={{ stroke: '#3B2F2F', strokeWidth: 2 }} />
              <path d="M38.5 57.5 L45 55.5 M61.5 57.5 L55 55.5" style={{ stroke: '#3B2F2F', strokeWidth: 1.8 }} />
              <path data-anim="drip" d="M71 46 Q74 51 71 53 Q68 51 71 46 Z" style={{ fill: '#9CD2FF', ...NONE }} />
            </g>
          ) : (
            <path d="M46 69.5 Q50 73.5 54 69.5" style={{ stroke: '#3B2F2F', strokeWidth: 2 }} />
          )}
          {hold === 'tag' && (
            <g>
              <rect x="40" y="75" width="20" height="11" rx="2.5" fill="#FFFFFF" style={{ strokeWidth: 1.8 }} />
              <path d="M44 79 L56 79 M44 82.5 L52 82.5" style={{ stroke: '#3DBE8B', strokeWidth: 1.6 }} />
            </g>
          )}
          {hold === 'glass' && (
            <g>
              <path d="M86 70 L93 77" style={{ strokeWidth: 3.4 }} />
              <circle cx="80" cy="63" r="9" fill="#DDF0FF" />
              <path d="M76 60 Q78 57.5 81 57.5" style={{ stroke: '#FFFFFF', strokeWidth: 2 }} />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
```

- [ ] **Step 3: Start the engine in `client/src/main.jsx`.** Add `import { startMotion } from './lib/motion';` and call `startMotion();` before `ReactDOM.createRoot(...)`.

- [ ] **Step 4: Check by eye.** Temporarily render `<div className="flex gap-3 p-6">{['seed','resume','portfolio','both','bud','bloom'].map((s) => <Sprout key={s} stage={s} size={88} />)}</div>` at the top of `App.jsx`, then run `npm run dev`. Compare with design board **0a**: same 6 stages, leaves sway, the body bobs, the eyes blink. Remove the temporary line.

- [ ] **Step 5: Commit:** `git add client/src/lib/motion.js client/src/components/Sprout.jsx client/src/main.jsx && git commit -m "feat(client): Sprout mascot and motion engine from the design"`

---

### Task 11: Shared UI — icons, primitives, sheet, toast, ID field, error messages

**Files:**
- Create: `client/src/components/Icons.jsx`, `client/src/components/ui.jsx`, `client/src/components/Sheet.jsx`, `client/src/components/Toast.jsx`, `client/src/components/StudentIdField.jsx`
- Create: `client/src/lib/errors.js`

- [ ] **Step 1: Write `client/src/components/Icons.jsx`** (paths copied from the design's inline SVGs)

```jsx
function Svg({ size = 20, color = 'currentColor', width = 2.2, children, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round', flex: 'none', ...style }}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p) => <Svg color="#8A7B76" {...p}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 L21 21" /></Svg>;
export const FilterIcon = (p) => <Svg color="#3B2F2F" {...p}><path d="M4 7 L20 7 M7 12 L17 12 M10 17 L14 17" /></Svg>;
export const CloseIcon = (p) => <Svg color="#3B2F2F" width={2.4} {...p}><path d="M6 6 L18 18 M18 6 L6 18" /></Svg>;
export const ChevronDownIcon = (p) => <Svg color="#8A7B76" {...p}><path d="M6 9 L12 15 L18 9" /></Svg>;
export const ChevronRightIcon = (p) => <Svg color="#C9BAAE" {...p}><path d="M9 6 L15 12 L9 18" /></Svg>;
export const BackIcon = (p) => <Svg size={24} color="#3B2F2F" width={2.4} {...p}><path d="M15 5 L8 12 L15 19" /></Svg>;
export const GlobeIcon = (p) => <Svg size={18} color="#1E7A57" width={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12 L21 12 M12 3 C15 6 15 18 12 21 M12 3 C9 6 9 18 12 21" /></Svg>;
export const EditIcon = (p) => <Svg size={16} color="#3B2F2F" {...p}><path d="M4 20 L8 20 L19 9 L15 5 L4 16 Z" /></Svg>;
export const TrashIcon = (p) => <Svg size={16} color="#B42318" {...p}><path d="M4 7 L20 7 M9 7 L9 4 L15 4 L15 7 M6 7 L7 20 L17 20 L18 7" /></Svg>;
export const SendIcon = (p) => <Svg color="#0F3D2E" {...p}><path d="M21 3 L10 14 M21 3 L14 21 L10 14 L3 10 Z" /></Svg>;
export const LogoutIcon = (p) => <Svg size={22} color="#B42318" {...p}><path d="M14 4 L18 4 C19.1 4 20 4.9 20 6 L20 18 C20 19.1 19.1 20 18 20 L14 20 M10 16 L6 12 L10 8 M6 12 L16 12" /></Svg>;
export const WarningIcon = (p) => <Svg size={18} color="#8A5A00" {...p}><path d="M12 3 L22 20 L2 20 Z M12 10 L12 14 M12 17 L12 17.01" /></Svg>;
export const InfoIcon = (p) => <Svg size={18} color="#8A7B76" width={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11 L12 16 M12 8 L12 8.01" /></Svg>;
export const PlusIcon = (p) => <Svg size={22} color="#D6F5E6" width={2.8} {...p}><path d="M12 5 L12 19 M5 12 L19 12" /></Svg>;
export const ArrowDownIcon = (p) => <Svg color="#3DBE8B" width={2.4} {...p}><path d="M12 4 L12 19 M6 13 L12 19 L18 13" /></Svg>;

export function CheckIcon({ size = 16, color = '#0F3D2E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"
      style={{ fill: 'none', stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M3 8.5 L6.5 12 L13 4.5" />
    </svg>
  );
}

/** Four-point sparkle used as decoration (twinkles). */
export function Sparkle({ size = 16, color = '#FFD66B', className, style }) {
  return (
    <svg data-anim="twinkle" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={className} style={style}>
      <path d="M10 1 Q10 10 19 10 Q10 10 10 19 Q10 10 1 10 Q10 10 10 1 Z" style={{ fill: color }} />
    </svg>
  );
}

/** Solid leaf used as decoration. */
export function LeafDeco({ size = 26, color = '#D6F5E6', className, style, anim }) {
  return (
    <svg data-anim={anim} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} style={style}>
      <path d="M3 21 C3 11 9 5 21 3 C19 15 13 21 3 21 Z" style={{ fill: color }} />
    </svg>
  );
}

/** Outlined leaf marking a timeline step (StudentHome.dc / 5d). */
export function LeafIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M4 20 C4 11 10 5 20 4 C19 14 13 20 4 20 Z" fill={color} style={{ stroke: '#2F5D4B', strokeWidth: 1.6, strokeLinejoin: 'round' }} />
      <path d="M4 20 L13 11" style={{ fill: 'none', stroke: '#2F5D4B', strokeWidth: 1.6, strokeLinecap: 'round' }} />
    </svg>
  );
}

// Tab bar icons (TabBar.dc)
export const TabSproutIcon = (p) => (
  <Svg size={24} width={2} {...p}>
    <path d="M12 21 L12 12" /><path d="M12 13 C8 13 5 10 5 6 C9 6 12 9 12 13 Z" /><path d="M12 11 C12 7.5 14.5 5 18.5 5 C18.5 8.5 16 11 12 11 Z" />
  </Svg>
);
export const TabGardenIcon = (p) => (
  <Svg size={24} width={2} {...p}>
    <path d="M3 20 L21 20" /><path d="M6.5 20 L6.5 15" /><path d="M6.5 15 C4.5 15 3 13.5 3 11.5 C5 11.5 6.5 13 6.5 15 Z" />
    <path d="M17.5 20 L17.5 15" /><path d="M17.5 15 C19.5 15 21 13.5 21 11.5 C19 11.5 17.5 13 17.5 15 Z" />
    <path d="M12 20 L12 11" /><circle cx="12" cy="7.5" r="3" />
  </Svg>
);
export const TabBuildingIcon = (p) => (
  <Svg size={24} width={2} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M9 7.5 L10 7.5 M14 7.5 L15 7.5 M9 11.5 L10 11.5 M14 11.5 L15 11.5" /><path d="M10 21 L10 16.5 L14 16.5 L14 21" />
  </Svg>
);
export const TabPersonIcon = (p) => (
  <Svg size={24} width={2} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21 C4 17 7.6 14 12 14 C16.4 14 20 17 20 21" /></Svg>
);
```

- [ ] **Step 2: Write `client/src/components/ui.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { PlusIcon } from './Icons';

export function Pill({ bg, fg, small = false, className = '', children }) {
  return (
    <span className={`pill ${small ? 'pill-sm' : ''} ${className}`} style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

/** Selectable chip: selected chips are leaf green and prefixed with ✓ (design chip()). */
export function Chip({ selected, onClick, className = '', children }) {
  return (
    <button type="button" className={`chip ${className}`} aria-pressed={selected} onClick={onClick}>
      {selected && '✓ '}
      {children}
    </button>
  );
}

/** Red "!" banner (1b, 2b/2c). */
export function ErrorBanner({ title, children }) {
  return (
    <div role="alert" className="flex items-start gap-[10px] rounded-[14px] bg-danger-soft px-[14px] py-3 text-danger">
      <div className="mt-px flex size-[22px] flex-none items-center justify-center rounded-full bg-danger text-sm font-bold text-danger-soft">!</div>
      <div>
        {title && <div className="text-base font-semibold leading-[1.45]">{title}</div>}
        {children && <div className={title ? 'mt-0.5 text-[13px]' : 'text-base leading-normal'}>{children}</div>}
      </div>
    </div>
  );
}

/** Floating "+ label" button above the tab bar (4a, 5a). */
export function Fab({ label, onClick }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[430px] justify-end px-4"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)' }}>
      <button type="button" onClick={onClick} data-anim="breathe"
        className="pointer-events-auto flex h-[60px] items-center gap-[10px] rounded-[30px] bg-leaf pr-[22px] pl-[10px] text-lg font-semibold text-forest shadow-[var(--shadow-fab)]">
        <span className="flex size-10 items-center justify-center rounded-full bg-forest"><PlusIcon /></span>
        {label}
      </button>
    </div>
  );
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Number that counts up from 0 (replaces the design's data-anim="count"). */
export function CountUp({ value, delay = 0 }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  useEffect(() => {
    if (reducedMotion()) {
      setShown(value);
      return undefined;
    }
    let raf;
    const t0 = performance.now() + delay + 300;
    const step = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / 900));
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  return shown;
}
```

- [ ] **Step 3: Write `client/src/components/Sheet.jsx`**

```jsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet from the design (3d, 3e, 4b, 4d, 5c, 5e): dimmed backdrop,
 * white panel with 28px top corners and a grabber. `full` = full-height (4d).
 * `footer` renders in a bordered strip pinned to the bottom (4b, 4d, 5c).
 */
export default function Sheet({ open, onClose, label, full = false, grabberGap = 18, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const previous = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <div data-anim="fade" className="absolute inset-0 bg-[rgba(59,47,47,.45)]" onClick={onClose} />
      <div
        data-anim="sheet"
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[430px] flex-col rounded-t-[28px] bg-white shadow-[var(--shadow-sheet)] ${
          full ? 'top-[calc(env(safe-area-inset-top)+7px)]' : 'max-h-[92dvh]'
        }`}
      >
        <div className={`min-h-0 flex-1 overflow-y-auto px-4 pt-[10px] ${footer ? 'pb-1' : 'pb-[calc(env(safe-area-inset-bottom)+8px)]'}`}>
          <div className="grabber" style={{ marginBottom: grabberGap }} />
          {children}
        </div>
        {footer && (
          <div className="border-t border-line-soft px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 4: Write `client/src/components/Toast.jsx`**

```jsx
import { useEffect } from 'react';
import Sprout from './Sprout';

/** Dark green success toast (3c). toast = { id, title, sub?, stage } */
export default function Toast({ toast, onDone, bottom }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-[430px] px-4" style={{ bottom }}>
      <div key={toast.id} data-anim="toast"
        className="flex items-center gap-3 rounded-[18px] bg-forest py-[10px] pr-4 pl-[10px] text-cream shadow-[0_10px_28px_rgba(15,61,46,.28)]">
        <div className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-mint">
          <Sprout stage={toast.stage} size={40} />
        </div>
        <div>
          <div className="text-base font-semibold">{toast.title}</div>
          {toast.sub && <div className="text-[13px] text-[#BDEBD3]">{toast.sub}</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `client/src/components/StudentIdField.jsx`**

```jsx
/** 11-digit student ID input with the n/11 counter (2a–2c, 5e). */
export default function StudentIdField({ id, value, onChange, invalid = false, required = false, autoFocus = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        รหัสนักศึกษา{required && <span className="text-danger"> *</span>}
      </label>
      <input
        id={id}
        className="field tracking-[1.5px] tabular-nums"
        inputMode="numeric"
        autoComplete="off"
        maxLength={11}
        value={value}
        aria-invalid={invalid || undefined}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
      />
      <div className={`hint flex ${invalid ? 'justify-end' : 'justify-between'}`}>
        {!invalid && <span>ตัวเลข 11 หลัก</span>}
        <span className="tabular-nums">{value.length}/11</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write `client/src/lib/errors.js`**

```js
/** Thai messages for API error codes. Unknown codes fall back to a generic message. */
const MESSAGES = {
  PREREQ_NOT_MET: 'ต้องทำ Resume และ Portfolio ให้ครบก่อนจึงจะยื่นได้',
  INVALID_TRANSITION: 'ต้องยื่นสมัครก่อนจึงจะยืนยันที่ฝึกงานได้',
  ALREADY_DONE: 'รายการนี้ทำเสร็จไปแล้ว',
  FORWARD_ONLY: 'สถานะย้อนกลับไม่ได้',
  DUPLICATE_NAME: 'มีบริษัทชื่อนี้ในระบบแล้ว',
  DUPLICATE: 'มีรหัสนักศึกษานี้ในรายชื่อแล้ว', // (extrapolated) 5e
  STUDENT_NOT_FOUND: 'ไม่พบรหัสนักศึกษานี้ในรายชื่อ กรุณาติดต่ออาจารย์ที่ปรึกษา',
  ALREADY_CLAIMED: 'รหัสนักศึกษานี้ถูกผูกกับบัญชีอื่นแล้ว กรุณาติดต่ออาจารย์ที่ปรึกษา',
  DOMAIN_NOT_ALLOWED: 'กรุณาเข้าสู่ระบบด้วยอีเมล @mail.kmutt.ac.th',
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  NETWORK: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง', // (extrapolated)
};

export const errorText = (err) => MESSAGES[err?.code] || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง';
```

- [ ] **Step 7: Build:** `npm run build` → `✓ built`.

- [ ] **Step 8: Commit:** `git add client/src/components client/src/lib/errors.js && git commit -m "feat(client): icons, chips, pills, sheet, toast, ID field, error messages"`

---

### Task 12: App frame, tab bar, auth state, routes

**Files:**
- Create: `client/src/components/AppFrame.jsx`, `client/src/components/TabBar.jsx`
- Rewrite: `client/src/lib/auth.jsx`, `client/src/App.jsx`, `client/src/main.jsx`
- Create stub pages (each replaced by its own task): `client/src/pages/student/StudentHomePage.jsx`, `client/src/pages/companies/DirectoryPage.jsx`, `client/src/pages/advisor/AdvisorHomePage.jsx`, `client/src/pages/advisor/StudentDetailPage.jsx`, `client/src/pages/ProfilePage.jsx`

- [ ] **Step 1: Write `client/src/components/TabBar.jsx`** (TabBar.dc; students get 3 tabs, advisors 2, per Q4)

```jsx
import { NavLink } from 'react-router';
import { TabBuildingIcon, TabGardenIcon, TabPersonIcon, TabSproutIcon } from './Icons';

const TABS = {
  student: [
    { to: '/', label: 'ความคืบหน้า', Icon: TabSproutIcon, end: true },
    { to: '/companies', label: 'บริษัท', Icon: TabBuildingIcon },
    { to: '/me', label: 'ฉัน', Icon: TabPersonIcon },
  ],
  advisor: [
    { to: '/', label: 'ภาพรวม', Icon: TabGardenIcon, end: true },
    { to: '/me', label: 'ฉัน', Icon: TabPersonIcon },
  ],
};

export default function TabBar({ role }) {
  const tabs = TABS[role];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[430px] border-t border-line-soft bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(120,80,40,.06)]"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="flex h-16 flex-col items-center justify-center gap-[3px]">
          {({ isActive }) => (
            <>
              <span
                data-anim={isActive ? 'pop' : ''}
                className="flex h-8 w-[60px] items-center justify-center rounded-2xl"
                style={{ background: isActive ? '#3DBE8B' : 'transparent' }}
              >
                <Icon color={isActive ? '#0F3D2E' : '#8A7B76'} />
              </span>
              <span className="text-[13px] leading-4" style={{ color: isActive ? '#0F3D2E' : '#8A7B76', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Write `client/src/components/AppFrame.jsx`** (Q5: centred phone column)

```jsx
import TabBar from './TabBar';

/** The phone-width column every screen lives in. tabs = 'student' | 'advisor' | undefined. */
export default function AppFrame({ tabs, children }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream pt-[env(safe-area-inset-top)]">
      <main className={`flex-1 ${tabs ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : ''}`}>{children}</main>
      {tabs && <TabBar role={tabs} />}
    </div>
  );
}
```

- [ ] **Step 3: Replace `client/src/lib/auth.jsx`** (keeps the rejected email for screen 1b)

```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { api } from './api';
import { errorText } from './errors';

export const AuthContext = createContext(null);

/**
 * state: loading | signedOut | needsLink | ready
 * error: { code, message, email } from the last failed sign-in (e.g. wrong domain)
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState('loading');
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async (session) => {
    if (!session) {
      setMe(null);
      setState('signedOut');
      return;
    }
    try {
      const data = await api.me();
      setMe(data);
      setError(null);
      setState(data.needsLink ? 'needsLink' : 'ready');
    } catch (err) {
      setError({ code: err.code, message: errorText(err), email: session.user?.email ?? null });
      await supabase.auth.signOut();
      setMe(null);
      setState('signedOut');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadMe(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadMe(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadMe]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadMe(data.session);
  }, [loadMe]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return (
    <AuthContext.Provider value={{ state, me, profile: me?.profile, error, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 4: Create the five stub pages** (each is fully replaced by Tasks 15, 17, 19, 20 and 21). For example `client/src/pages/student/StudentHomePage.jsx`:

```jsx
export default function StudentHomePage() {
  return <h1 className="title-page flex h-14 items-center px-4">ความคืบหน้าของฉัน</h1>;
}
```

and the same shape with these titles: `companies/DirectoryPage.jsx` → `ทำเนียบบริษัท`, `advisor/AdvisorHomePage.jsx` → `ภาพรวมนักศึกษา`, `advisor/StudentDetailPage.jsx` → `ข้อมูลนักศึกษา`, `ProfilePage.jsx` → `ฉัน`.

- [ ] **Step 5: Replace `client/src/App.jsx`**

```jsx
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './lib/auth';
import AppFrame from './components/AppFrame';
import Sprout from './components/Sprout';
import LoginPage from './pages/LoginPage';
import LinkStudentPage from './pages/LinkStudentPage';
import ProfilePage from './pages/ProfilePage';
import StudentHomePage from './pages/student/StudentHomePage';
import DirectoryPage from './pages/companies/DirectoryPage';
import AdvisorHomePage from './pages/advisor/AdvisorHomePage';
import StudentDetailPage from './pages/advisor/StudentDetailPage';

// (extrapolated) loading screen: the seed on cream
function Splash() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[430px] items-center justify-center bg-cream">
      <Sprout stage="seed" size={96} />
    </div>
  );
}

export default function App() {
  const { state, profile } = useAuth();

  if (state === 'loading') return <Splash />;
  if (state === 'signedOut') return <LoginPage />;
  if (state === 'needsLink') return <LinkStudentPage />;

  if (profile.role === 'ADVISOR') {
    return (
      <Routes>
        <Route path="/" element={<AppFrame tabs="advisor"><AdvisorHomePage /></AppFrame>} />
        <Route path="/students/:id" element={<AppFrame><StudentDetailPage /></AppFrame>} />
        <Route path="/me" element={<AppFrame tabs="advisor"><ProfilePage /></AppFrame>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppFrame tabs="student"><StudentHomePage /></AppFrame>} />
      <Route path="/companies" element={<AppFrame tabs="student"><DirectoryPage /></AppFrame>} />
      <Route path="/me" element={<AppFrame tabs="student"><ProfilePage /></AppFrame>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 6: Replace `client/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { AuthProvider } from './lib/auth';
import { startMotion } from './lib/motion';
import { supabase } from './lib/supabase';
import './index.css';

startMotion();

// Dev only: lets the Task 23 visual check sign in test accounts from the console.
if (import.meta.env.DEV) window.__supabase = supabase;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 7: Build and look:** `npm run build` → `✓ built`. `npm run dev` → http://localhost:5173 shows the existing login page in the cream column on a `#EDE4D9` background at desktop width.

- [ ] **Step 8: Commit:** `git add client/src && git commit -m "feat(client): phone-column frame, tab bar, auth state and role routes"`

---

## Phase C — Screens

Every screen task ends with a quick look in `npm run dev`. The full side-by-side check against the design is Task 23.

### Task 13: 1a/1b Login

**Files:**
- Rewrite: `client/src/pages/LoginPage.jsx`

- [ ] **Step 1: Replace `client/src/pages/LoginPage.jsx`** (design 1a and 1b; positions follow translation rule 2)

```jsx
import { useState } from 'react';
import Sprout from '../components/Sprout';
import { LeafDeco, Sparkle } from '../components/Icons';
import { ErrorBanner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { STUDENT_EMAIL_DOMAIN, signInWithGoogle } from '../lib/supabase';

const top = (px) => `calc(env(safe-area-inset-top) + ${px}px)`;

export default function LoginPage() {
  const { error } = useAuth();
  const wrongDomain = error?.code === 'DOMAIN_NOT_ALLOWED';
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error: e } = await signInWithGoogle();
    if (e) setBusy(false);
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col overflow-hidden bg-cream">
      <div
        className="absolute top-[-250px] left-1/2 size-[640px] -translate-x-1/2 rounded-full"
        style={{ background: wrongDomain ? '#FBEDE6' : '#E3F6EC' }}
      />
      {!wrongDomain && (
        <>
          <Sparkle size={22} className="absolute" style={{ left: 36, top: top(63) }} />
          <Sparkle size={14} color="#C9B6FF" className="absolute" style={{ right: 52, top: top(49) }} />
          <LeafDeco size={30} color="#BDEBD3" anim="float" className="absolute" style={{ right: 30, top: top(253) }} />
        </>
      )}

      <div className="relative flex flex-col items-center px-8 text-center" style={{ paddingTop: top(49) }}>
        <div
          data-anim={wrongDomain ? undefined : 'float'}
          className="flex size-[236px] items-center justify-center rounded-full bg-white"
          style={{ boxShadow: wrongDomain ? '0 12px 30px rgba(180,35,24,.10)' : '0 12px 30px rgba(61,190,139,.18)' }}
        >
          {wrongDomain ? <Sprout stage="both" mood="worried" size={190} /> : <Sprout stage="both" wave hold="resume" size={190} />}
        </div>
        <h1 className="mt-10 text-[26px] leading-[1.25] font-medium">CMM Internship Tracker</h1>
        <p className="mt-[10px] text-base leading-[1.55] text-pretty text-muted">ติดตามการเตรียมตัวฝึกงาน และแบ่งปันข้อมูลบริษัทในรุ่น</p>
      </div>

      <div className="relative mt-auto flex flex-col gap-3 px-4 pt-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 22px)' }}>
        {wrongDomain && (
          <ErrorBanner title={`กรุณาเข้าสู่ระบบด้วยอีเมล @${STUDENT_EMAIL_DOMAIN}`}>
            {error.email && `คุณใช้ ${error.email}`}
          </ErrorBanner>
        )}
        {/* (extrapolated) any other sign-in failure, e.g. network */}
        {error && !wrongDomain && <ErrorBanner>{error.message}</ErrorBanner>}
        <button type="button" onClick={signIn} disabled={busy} className="btn btn-primary h-14 gap-3">
          <span className="flex size-[30px] items-center justify-center rounded-full bg-white [font-family:Arial,sans-serif] text-[17px] font-bold text-[#4285F4]">
            G
          </span>
          เข้าสู่ระบบด้วย Google
        </button>
        <p className="hint text-center">ใช้อีเมล @{STUDENT_EMAIL_DOMAIN}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Look:** `npm run dev`, signed out → matches **1a**: green halo, waving sprout holding a resume, floating circle, two sparkles, a leaf, and the Google button at the bottom.

- [ ] **Step 3: Commit:** `git add client/src/pages/LoginPage.jsx && git commit -m "feat(client): login screen (1a/1b)"`

---

### Task 14: 2a–2c Verify student ID

**Extrapolated:** 2a shows "ใช้บัญชีอื่น" under the field because the iOS keypad covers the bottom. The app uses the 2b/2c layout (button and link at the bottom) in every state, and the real keyboard handles itself.

**Files:**
- Rewrite: `client/src/pages/LinkStudentPage.jsx`

- [ ] **Step 1: Replace `client/src/pages/LinkStudentPage.jsx`**

```jsx
import { useState } from 'react';
import Sprout from '../components/Sprout';
import StudentIdField from '../components/StudentIdField';
import { ErrorBanner } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorText } from '../lib/errors';

/** First sign-in: the student types their ID once to connect their Google account. */
export default function LinkStudentPage() {
  const { me, refresh, signOut } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const valid = studentId.length === 11;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.link(studentId);
      await refresh();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-cream px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >
      <div className="flex flex-col gap-[14px]">
        <div className="flex items-center gap-[14px]">
          <div className="flex size-[88px] flex-none items-center justify-center rounded-[28px] bg-white shadow-[0_6px_18px_rgba(120,80,40,.08)]">
            <Sprout stage="both" hold="tag" mood={error ? 'worried' : 'happy'} size={76} />
          </div>
          <h1 className="text-2xl leading-[1.25] font-medium">ยืนยันรหัสนักศึกษา</h1>
        </div>
        <p className="text-base leading-[1.55] text-pretty">
          เข้าสู่ระบบในชื่อ <span className="font-semibold">{me?.email}</span> — กรอกรหัสนักศึกษาเพื่อเชื่อมกับข้อมูลของคุณ{' '}
          <span className="text-muted">(ทำครั้งเดียว)</span>
        </p>
        <div className="mt-1 flex flex-col gap-1.5">
          <StudentIdField
            id="sid"
            value={studentId}
            invalid={Boolean(error)}
            autoFocus
            onChange={(v) => {
              setStudentId(v);
              setError(null);
            }}
          />
          {error && <ErrorBanner>{error}</ErrorBanner>}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pt-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <button type="submit" className="btn btn-primary" disabled={!valid || busy}>
          {busy ? 'กำลังตรวจสอบ…' : 'ยืนยัน'}
        </button>
        <button type="button" onClick={signOut} className="link-action h-12">
          ใช้บัญชีอื่น
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Build:** `npm run build` → `✓ built`. (The screen itself is checked in Task 23, which needs a signed-in, unlinked account.)

- [ ] **Step 3: Commit:** `git add client/src/pages/LinkStudentPage.jsx && git commit -m "feat(client): verify student ID screen (2a–2c)"`

---

### Task 15: 3a–3c Student home

Source: `StudentHome.dc.html` (the full card markup) plus the main file's 3c sticky bar. The design draws two states, Portfolio done and both documents done. The other states use the same parts:

| State | Step 1 | Step 2 | Step 3 | Sticky bar |
|---|---|---|---|---|
| nothing / one doc | active "1", pending rows | locked "🔒 ยื่นแล้ว" + missing-docs hint | locked | none |
| both docs (3c) | done ✓ | active, "ปลดล็อกแล้ว!" note | locked | ยื่นแล้ว (design) |
| submitted **(extrapolated)** | done | done row "ยื่นแล้ว" + time | active, "ได้ที่ฝึกงานแล้ว?" note | ยืนยันที่ฝึกงาน |
| confirmed **(extrapolated)** | done | done | done row "ยืนยันที่ฝึกงานแล้ว" + time | none |

**Files:**
- Create: `client/src/pages/student/ProgressParts.jsx`
- Rewrite: `client/src/pages/student/StudentHomePage.jsx`

- [ ] **Step 1: Write `client/src/pages/student/ProgressParts.jsx`**

```jsx
import Sprout from '../../components/Sprout';
import { ArrowDownIcon, ChevronRightIcon, CheckIcon, InfoIcon, LeafDeco, LeafIcon, Sparkle } from '../../components/Icons';
import { Pill } from '../../components/ui';
import { formatThaiDateTime } from '../../lib/format';
import { STRIP_LABELS, docsComplete, homeHint, isConfirmed, isSubmitted, lockedSubmitHint, stageFor, statusPill, stepIndex } from '../../lib/status';
import { eventTime, historyFor } from '../../lib/timeline';

export const STICKY_BAR_HEIGHT = 100;

export const DOCS = [
  { name: 'Resume', flag: 'is_resume_ready', action: 'COMPLETE_RESUME', event: 'RESUME_COMPLETED', leaf: '#9CD2FF' },
  { name: 'Portfolio', flag: 'is_portfolio_ready', action: 'COMPLETE_PORTFOLIO', event: 'PORTFOLIO_COMPLETED', leaf: '#C9B6FF' },
];

export function HeroCard({ progress, name }) {
  const pill = statusPill(progress);
  const step = stepIndex(progress);
  return (
    <section data-anim="rise" className="card relative overflow-hidden p-5">
      <Sparkle size={16} className="absolute top-3 right-[14px]" />
      <LeafDeco size={26} className="absolute -bottom-[5px] -left-[5px]" />
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[10px]">
          <h2 className="text-2xl leading-[1.25] font-medium">{name ? `สวัสดี ${name} 👋` : 'สวัสดี 👋'}</h2>
          <Pill bg={pill.bg} fg={pill.fg}>{pill.label}</Pill>
        </div>
        <div data-anim="pop" className="flex size-[124px] flex-none items-center justify-center rounded-full bg-cream">
          <Sprout stage={stageFor(progress)} size={104} />
        </div>
      </div>
      <p className="mt-[14px] rounded-[14px] bg-cream px-[14px] py-3 text-base leading-normal text-pretty">{homeHint(progress)}</p>
      <div className="relative mt-[18px]">
        <div className="absolute top-[13px] right-[10%] left-[10%] border-t-2 border-dashed border-line" />
        <div data-anim="grow-x" data-anim-delay="300" className="absolute top-[13px] left-[10%] border-t-2 border-leaf" style={{ width: `${step * 20}%` }} />
        <ol className="relative grid grid-cols-5">
          {STRIP_LABELS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="flex flex-col items-center gap-1.5">
                <span
                  data-anim={current ? 'pulse' : undefined}
                  className="box-border flex items-center justify-center rounded-full border-2 text-xs font-bold text-forest"
                  style={{
                    width: current ? 28 : 24,
                    height: current ? 28 : 24,
                    marginTop: current ? 0 : 2,
                    background: done ? '#3DBE8B' : '#FFFFFF',
                    borderColor: done || current ? '#3DBE8B' : '#E3D6C8',
                    boxShadow: current ? '0 0 0 4px #D6F5E6' : 'none',
                  }}
                >
                  {done ? '✓' : ''}
                </span>
                <span className="text-[13px]" style={{ color: current ? '#0F3D2E' : '#8A7B76', fontWeight: current ? 600 : 400 }}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const CIRCLE = {
  active: { bg: '#FFFFFF', bd: '#3DBE8B', fg: '#0F3D2E' },
  done: { bg: '#3DBE8B', bd: '#3DBE8B', fg: '#0F3D2E' },
  locked: { bg: '#F1ECE6', bd: '#F1ECE6', fg: '#A1948D' },
};

function Step({ n, state, vine, title, extra, children }) {
  const c = CIRCLE[state];
  return (
    <div className="flex gap-3">
      <div className="flex w-8 flex-none flex-col items-center">
        <div className="box-border flex size-8 items-center justify-center rounded-full border-2 text-[15px] font-medium"
          style={{ background: c.bg, borderColor: c.bd, color: c.fg }}>
          {state === 'done' ? '✓' : n}
        </div>
        {vine && <div className="my-1.5 w-0 flex-1" style={{ borderLeft: `3px dotted ${vine}` }} />}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${n === 1 ? 'gap-[10px]' : 'gap-2'} ${vine ? 'pb-[22px]' : ''}`}>
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <div className="text-base font-semibold">{title}</div>
          {extra}
        </div>
        {children}
      </div>
    </div>
  );
}

function DoneRow({ title, time, leaf }) {
  return (
    <div className="box-border flex min-h-16 items-center gap-3 rounded-[14px] border-[1.5px] border-leaf bg-mint px-[14px] py-3">
      <div className="flex size-7 flex-none items-center justify-center rounded-[9px] bg-leaf"><CheckIcon /></div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold text-forest">{title}</div>
        <div className="text-[13px] text-mint-ink">{time}</div>
      </div>
      <LeafIcon color={leaf} />
    </div>
  );
}

function PendingDocRow({ name, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="box-border flex min-h-16 w-full items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-[#D9CBBE] bg-white px-[14px] py-3 text-left">
      <span className="box-border size-7 flex-none rounded-[9px] border-2 border-[#C9BAAE]" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">ทำ {name} แล้ว</span>
        <span className="block text-[13px] text-muted">กดเมื่อทำเสร็จ</span>
      </span>
      <ChevronRightIcon />
    </button>
  );
}

function Locked({ label, hint }) {
  return (
    <>
      <div className="btn btn-locked h-12">🔒 {label}</div>
      <div className="hint">{hint}</div>
    </>
  );
}

function UnlockedNote({ children }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[14px] border-[1.5px] border-leaf bg-white px-[14px] py-3 text-base leading-normal text-forest">
      <span data-anim="nudge" className="mt-0.5 flex-none"><ArrowDownIcon /></span>
      <div>{children}</div>
    </div>
  );
}

export function StepsCard({ progress, events, onPickDoc }) {
  const both = docsComplete(progress);
  const submitted = isSubmitted(progress);
  const confirmed = isConfirmed(progress);
  const at = (name) => formatThaiDateTime(eventTime(events, name));

  return (
    <section data-anim="rise" data-anim-delay="120" className="card p-5">
      <h2 className="title-section mb-4">สถานะการเตรียมตัวฝึกงาน</h2>

      <Step n={1} state={both ? 'done' : 'active'} vine="#9EDDC2" title="เตรียมเอกสาร"
        extra={<span className="rounded-full border border-dash bg-cream px-[10px] py-px text-[13px] text-muted">ทำได้ตามลำดับใดก็ได้</span>}>
        {DOCS.map((d) =>
          progress[d.flag]
            ? <DoneRow key={d.name} title={`ทำ ${d.name} แล้ว`} time={at(d.event)} leaf={d.leaf} />
            : <PendingDocRow key={d.name} name={d.name} onClick={() => onPickDoc(d.action)} />
        )}
      </Step>

      <Step n={2} state={submitted ? 'done' : both ? 'active' : 'locked'} vine={submitted ? '#9EDDC2' : '#E3D6C8'} title="ยื่นสมัครฝึกงาน">
        {submitted ? (
          <DoneRow title="ยื่นแล้ว" time={at('APPLICATIONS_SUBMITTED')} leaf="#FFD66B" />
        ) : both ? (
          <UnlockedNote>ปลดล็อกแล้ว! กด “ยื่นแล้ว” ด้านล่างเมื่อส่งใบสมัคร</UnlockedNote>
        ) : (
          <Locked label="ยื่นแล้ว" hint={lockedSubmitHint(progress)} />
        )}
      </Step>

      <Step n={3} state={confirmed ? 'done' : submitted ? 'active' : 'locked'} title="ยืนยันที่ฝึกงาน">
        {confirmed ? (
          <DoneRow title="ยืนยันที่ฝึกงานแล้ว" time={at('INTERNSHIP_CONFIRMED')} leaf="#86D9AE" />
        ) : submitted ? (
          <UnlockedNote>ได้ที่ฝึกงานแล้ว? กด “ยืนยันที่ฝึกงาน” ด้านล่าง</UnlockedNote>
        ) : (
          <Locked label="ยืนยันที่ฝึกงานแล้ว" hint="ต้องยื่นสมัครก่อน" />
        )}
      </Step>

      <div className="mt-[18px] flex items-center gap-2 rounded-xl bg-cream px-3 py-[10px] text-[13px] text-muted">
        <InfoIcon />
        <div>ทุกขั้นตอนบันทึกเวลาไว้ และย้อนกลับไม่ได้</div>
      </div>
    </section>
  );
}

export function HistoryCard({ events }) {
  const rows = historyFor(events);
  return (
    <section data-anim="rise" data-anim-delay="240" className="card p-5">
      <h2 className="title-section mb-4">ประวัติของฉัน</h2>
      <ol>
        {rows.map((h, i) => {
          const next = rows[i + 1];
          return (
            <li key={h.event} className="flex gap-3" style={{ opacity: h.done ? 1 : 0.55 }}>
              <div className="flex w-6 flex-none flex-col items-center">
                {h.done ? <LeafIcon color="#86D9AE" /> : <span className="m-0.5 box-border size-5 flex-none rounded-full border-2 border-dashed border-[#C9BAAE]" />}
                {next && <span className="my-1 w-0 flex-1" style={{ borderLeft: `2.5px ${next.done ? 'solid' : 'dashed'} #CFE9DC` }} />}
              </div>
              <div className="min-w-0 flex-1 pb-[18px]">
                <div className="text-base leading-6 font-semibold">{h.title}</div>
                <div className="mt-0.5 text-[13px] text-muted">{h.time ?? 'ยังไม่ถึงขั้นนี้'}</div>
                {h.note && <span className="mt-1.5 inline-flex rounded-full bg-sand px-[10px] py-0.5 text-[13px] text-muted-strong">{h.note}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** White bar pinned above the tab bar (3c). */
export function StickyActionBar({ hint, label, icon, onClick }) {
  return (
    <div className="fixed inset-x-0 z-30 mx-auto flex max-w-[430px] flex-col gap-1.5 border-t border-line-soft bg-white px-4 pt-[10px] pb-3 shadow-[var(--shadow-bar)]"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <p className="hint text-center">{hint}</p>
      <button type="button" className="btn btn-primary" onClick={onClick}>{icon}{label}</button>
    </div>
  );
}
```

- [ ] **Step 2: Replace `client/src/pages/student/StudentHomePage.jsx`** (sheets, toast and celebration are added in Task 16)

```jsx
import { useCallback, useEffect, useState } from 'react';
import Sprout from '../../components/Sprout';
import { CheckIcon, SendIcon } from '../../components/Icons';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';
import { isConfirmed, isReady, isSubmitted } from '../../lib/status';
import { HeroCard, HistoryCard, STICKY_BAR_HEIGHT, StepsCard, StickyActionBar } from './ProgressParts';

function barFor(p) {
  if (isReady(p)) {
    return { action: 'SUBMIT', hint: 'ส่งใบสมัครให้บริษัทแล้ว? กดเพื่อบันทึก', label: 'ยื่นแล้ว', icon: <SendIcon /> };
  }
  if (isSubmitted(p) && !isConfirmed(p)) {
    // (extrapolated) same bar for the last step
    return { action: 'CONFIRM', hint: 'ได้รับการตอบรับแล้ว? กดเพื่อบันทึก', label: 'ยืนยันที่ฝึกงาน', icon: <CheckIcon size={18} /> };
  }
  return null;
}

export default function StudentHomePage() {
  const [progress, setProgress] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.myProgress(), api.myTimeline()]);
      setProgress(p.data);
      setEvents(t.data);
      setError(null);
      return { progress: p.data, events: t.data };
    } catch (err) {
      setError(errorText(err));
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-24">
        <Sprout stage="seed" mood={error ? 'worried' : 'happy'} size={72} />
        {error && (
          <>
            <ErrorBanner>{error}</ErrorBanner>
            <button type="button" className="btn btn-secondary" onClick={load}>ลองใหม่</button>
          </>
        )}
      </div>
    );
  }

  const bar = barFor(progress);
  const name = (progress.full_name || '').trim().split(/\s+/)[0];

  return (
    <>
      <h1 className="title-page flex h-14 items-center px-4">ความคืบหน้าของฉัน</h1>
      <div className="flex flex-col gap-4 px-4 pt-1" style={{ paddingBottom: bar ? STICKY_BAR_HEIGHT + 24 : 24 }}>
        <HeroCard progress={progress} name={name} />
        <StepsCard progress={progress} events={events} onPickDoc={setSheet} />
        <HistoryCard events={events} />
      </div>
      {bar && <StickyActionBar {...bar} onClick={() => setSheet(bar.action)} />}
    </>
  );
}
```

- [ ] **Step 3: Build:** `npm run build` → `✓ built`.

- [ ] **Step 4: Commit:** `git add client/src/pages/student && git commit -m "feat(client): student home — hero, steps, history, sticky bar (3a–3c)"`

---

### Task 16: 3d/3e action sheets, success toast, 3f celebration

**Extrapolated:** the design has no sheet for ยื่นแล้ว, so it uses the 3d pattern (bud sprout, title "ยืนยันว่ายื่นสมัครแล้ว?"). The toasts for the first document ("ต้นกล้าแตกใบแรกแล้ว") and for ยื่นแล้ว ("ยื่นสมัครแล้ว! 🎉" / "ต้นกล้าออกดอกตูมแล้ว") follow the 3c toast.

**Files:**
- Modify: `client/src/lib/status.js`, `client/src/lib/status.test.js`
- Create: `client/src/pages/student/ActionSheet.jsx`, `client/src/pages/student/Celebration.jsx`
- Modify: `client/src/pages/student/StudentHomePage.jsx`

- [ ] **Step 1: Add failing tests to `client/src/lib/status.test.js`**

Add `progressAfter, toastFor` to the import from `./status`, then append:

```js
test('progressAfter predicts the state the sheet will show', () => {
  expect(stageFor(progressAfter(p('PORTFOLIO_DONE', false, true), 'COMPLETE_RESUME'))).toBe('both');
  expect(stageFor(progressAfter(p('RESUME_DONE', true, true), 'SUBMIT'))).toBe('bud');
  expect(stageFor(progressAfter(p('APPLICATIONS_SUBMITTED', true, true), 'CONFIRM'))).toBe('bloom');
});

test('toast copy (design 3c + extrapolated)', () => {
  expect(toastFor('COMPLETE_RESUME', p('RESUME_DONE', true, true)))
    .toEqual({ title: 'เก่งมาก! ทำ Resume เสร็จแล้ว 🎉', sub: 'เอกสารครบ ต้นกล้าแตกใบคู่แล้ว', stage: 'both' });
  expect(toastFor('COMPLETE_PORTFOLIO', p('PORTFOLIO_DONE', false, true)))
    .toEqual({ title: 'เก่งมาก! ทำ Portfolio เสร็จแล้ว 🎉', sub: 'ต้นกล้าแตกใบแรกแล้ว', stage: 'portfolio' });
  expect(toastFor('SUBMIT', p('APPLICATIONS_SUBMITTED', true, true)))
    .toEqual({ title: 'ยื่นสมัครแล้ว! 🎉', sub: 'ต้นกล้าออกดอกตูมแล้ว', stage: 'bud' });
});
```

- [ ] **Step 2: Run, expect failure:** `npm test` → `progressAfter is not a function`.

- [ ] **Step 3: Append to `client/src/lib/status.js`**

```js
/** What progress will look like after an action (used to preview the sprout). */
export function progressAfter(p, action) {
  switch (action) {
    case 'COMPLETE_RESUME':
      return { ...p, is_resume_ready: true, current_status: 'RESUME_DONE' };
    case 'COMPLETE_PORTFOLIO':
      return { ...p, is_portfolio_ready: true, current_status: 'PORTFOLIO_DONE' };
    case 'SUBMIT':
      return { ...p, current_status: 'APPLICATIONS_SUBMITTED' };
    default:
      return { ...p, current_status: 'INTERNSHIP_CONFIRMED' };
  }
}

/** Success toast after an action; p is the progress returned by the API. */
export function toastFor(action, p) {
  if (action === 'SUBMIT') return { title: 'ยื่นสมัครแล้ว! 🎉', sub: 'ต้นกล้าออกดอกตูมแล้ว', stage: 'bud' };
  const doc = action === 'COMPLETE_RESUME' ? 'Resume' : 'Portfolio';
  return {
    title: `เก่งมาก! ทำ ${doc} เสร็จแล้ว 🎉`,
    sub: docsComplete(p) ? 'เอกสารครบ ต้นกล้าแตกใบคู่แล้ว' : 'ต้นกล้าแตกใบแรกแล้ว',
    stage: stageFor(p),
  };
}
```

- [ ] **Step 4: Run:** `npm test` → all pass.

- [ ] **Step 5: Write `client/src/pages/student/ActionSheet.jsx`** (3d for documents and ยื่นแล้ว, 3e for confirming)

```jsx
import { useState } from 'react';
import Sheet from '../../components/Sheet';
import Sprout from '../../components/Sprout';
import { WarningIcon } from '../../components/Icons';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';
import { formatThaiDateTime } from '../../lib/format';
import { progressAfter, stageFor } from '../../lib/status';

const TITLE = {
  COMPLETE_RESUME: 'ยืนยันว่าทำ Resume เสร็จแล้ว?',
  COMPLETE_PORTFOLIO: 'ยืนยันว่าทำ Portfolio เสร็จแล้ว?',
  SUBMIT: 'ยืนยันว่ายื่นสมัครแล้ว?', // (extrapolated)
  CONFIRM: 'ยืนยันว่าได้ที่ฝึกงานแล้ว?',
};

export default function ActionSheet({ action, progress, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const confirm = action === 'CONFIRM';

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.applyAction(action);
      onDone(action, res.data);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={busy ? undefined : onClose} label={TITLE[action]}>
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[108px] items-center justify-center rounded-full" style={{ background: confirm ? '#D6F5E6' : '#FFF8F0' }}>
          <Sprout stage={stageFor(progressAfter(progress, action))} size={92} />
        </div>
        <h2 className="title-sheet mt-[14px]">{TITLE[action]}</h2>
        <p className="mt-2 text-base leading-[1.55] text-pretty text-muted">
          {confirm ? 'ระบบจะบันทึกวันและเวลาไว้ในประวัติ' : 'ระบบจะบันทึกวันและเวลาไว้ในประวัติ และจะย้อนกลับขั้นตอนนี้ไม่ได้'}
        </p>
        {confirm ? (
          <div className="mt-[14px] flex items-start gap-[10px] self-stretch rounded-[14px] bg-warn-soft px-3 py-[10px] text-left text-[13px] leading-normal text-warn-ink">
            <WarningIcon style={{ marginTop: 1 }} />
            <div>เมื่อยืนยันแล้วจะย้อนสถานะไม่ได้</div>
          </div>
        ) : (
          <div className="mt-3 rounded-full bg-sand px-3 py-1 text-[13px] text-muted-strong">
            จะบันทึกเป็น {formatThaiDateTime(new Date())}
          </div>
        )}
        {error && <div className="mt-3 self-stretch text-left"><ErrorBanner>{error}</ErrorBanner></div>}
        <div className={`flex flex-col gap-[10px] self-stretch ${confirm ? 'mt-5' : 'mt-[22px]'}`}>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={go}>ยืนยัน</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
        </div>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 6: Write `client/src/pages/student/Celebration.jsx`** (3f; confetti generator copied from the design's `renderVals`)

```jsx
import { createPortal } from 'react-dom';
import Sprout from '../../components/Sprout';
import { formatThaiDateTime } from '../../lib/format';

const COLORS = ['#3DBE8B', '#FFD66B', '#9CD2FF', '#C9B6FF', '#FFB5B5', '#FFB088'];
const rnd = (i, n) => {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const strip = i % 3 !== 0;
  return {
    left: `${((Math.round(rnd(i, 1) * 366 + 6)) / 390) * 100}%`,
    top: Math.round(rnd(i, 2) * 400 + 60),
    height: strip ? 14 : 8,
    radius: strip ? '2px' : '50%',
    background: COLORS[i % 6],
    rotate: Math.round(rnd(i, 3) * 360),
  };
});

const top = (px) => `calc(env(safe-area-inset-top) + ${px}px)`;

export default function Celebration({ at, onClose }) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="ยินดีด้วย" className="fixed inset-y-0 inset-x-0 z-[60] mx-auto max-w-[430px] overflow-hidden bg-cream">
      <div data-anim="glow" className="absolute left-1/2 size-[520px] -translate-x-1/2 rounded-full"
        style={{ top: top(73), background: 'radial-gradient(circle,#D6F5E6 0%,rgba(214,245,230,0) 68%)' }} />
      {CONFETTI.map((c, i) => (
        <div key={i} data-anim="fall" className="absolute w-2"
          style={{ left: c.left, top: c.top, height: c.height, borderRadius: c.radius, background: c.background, transform: `rotate(${c.rotate}deg)` }} />
      ))}
      <div className="absolute inset-x-0 flex flex-col items-center px-7 text-center" style={{ top: top(103) }}>
        <div data-anim="bloom-in" className="flex size-[240px] items-center justify-center rounded-full bg-white"
          style={{ boxShadow: '0 0 0 14px rgba(214,245,230,.7),0 20px 40px rgba(61,190,139,.2)' }}>
          <Sprout stage="bloom" wave size={196} />
        </div>
        <h2 data-anim="rise" data-anim-delay="700" className="mt-10 text-[30px] leading-[1.25] font-medium">ยินดีด้วย! 🎉</h2>
        <p className="mt-2 text-lg leading-normal text-pretty">ยืนยันที่ฝึกงานแล้ว ต้นกล้าบานเต็มที่!</p>
        <span className="pill mt-4 h-9 bg-mint px-[14px] text-mint-ink">ยืนยันที่ฝึกงาน</span>
        {at && <p className="hint mt-3">บันทึกเมื่อ {formatThaiDateTime(at)}</p>}
      </div>
      <div className="absolute inset-x-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}>
        <button type="button" className="btn btn-primary h-14" onClick={onClose}>กลับหน้าหลัก</button>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 7: Wire them into `client/src/pages/student/StudentHomePage.jsx`**

Add imports:

```jsx
import Toast from '../../components/Toast';
import { eventTime } from '../../lib/timeline';
import { toastFor } from '../../lib/status';
import ActionSheet from './ActionSheet';
import Celebration from './Celebration';
```

Add state next to `sheet`:

```jsx
  const [toast, setToast] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const clearToast = useCallback(() => setToast(null), []);
```

Add this handler after `load` (before the `if (!progress)` return):

```jsx
  async function handleDone(action, updated) {
    setSheet(null);
    await load();
    if (action === 'CONFIRM') setCelebrate(true);
    else setToast({ id: Date.now(), ...toastFor(action, updated) });
  }
```

and render these after the sticky bar, inside the fragment:

```jsx
      {sheet && <ActionSheet action={sheet} progress={progress} onClose={() => setSheet(null)} onDone={handleDone} />}
      <Toast toast={toast} onDone={clearToast}
        bottom={`calc(64px + env(safe-area-inset-bottom) + ${bar ? STICKY_BAR_HEIGHT + 12 : 12}px)`} />
      {celebrate && <Celebration at={eventTime(events, 'INTERNSHIP_CONFIRMED')} onClose={() => setCelebrate(false)} />}
```

- [ ] **Step 8: Build and test:** `npm run build && npm test` → both pass.

- [ ] **Step 9: Commit:** `git add client/src && git commit -m "feat(client): action sheets, success toast and celebration (3d–3f)"`

---

### Task 17: 4a/4c/4f Directory and company card

Source: `Directory.dc.html` + 4a/4c/4f in the main file. Students only (Q4). **Extrapolated:**
- a sand source pill under the business type (Q3);
- the "ล้างตัวกรองทั้งหมด" link only when a filter is active;
- an empty-directory title "ยังไม่มีบริษัทในทำเนียบ" when nothing is filtered;
- a chosen mode chip shows ✓ plus its dot.

**Files:**
- Create: `client/src/pages/companies/CompanyCard.jsx`
- Rewrite: `client/src/pages/companies/DirectoryPage.jsx` (sheets are wired in Task 18)

- [ ] **Step 1: Write `client/src/pages/companies/CompanyCard.jsx`**

```jsx
import { EditIcon, GlobeIcon, TrashIcon } from '../../components/Icons';
import { Pill } from '../../components/ui';
import { MODE, SOURCE_LABEL, displayUrl } from '../../lib/companies';
import { avatarColors, thaiInitial } from '../../lib/format';

/** Company card (4f). Notes and "added by" are intentionally not shown (Q6). */
export default function CompanyCard({ company, editable, onEdit, onDelete, delay = 0 }) {
  const av = avatarColors(company.id);
  const mode = MODE[company.work_mode];
  return (
    <article data-anim="rise" data-anim-delay={delay} className="card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-12 flex-none items-center justify-center rounded-[14px] text-xl font-medium" style={{ background: av.bg, color: av.fg }}>
          {thaiInitial(company.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base leading-[1.35] font-semibold">{company.name}</h3>
          <p className="mt-0.5 text-[13px] leading-[1.45] text-muted">{company.business_type}</p>
          <Pill small bg="#F1ECE6" fg="#6B5A50" className="mt-1.5">{SOURCE_LABEL[company.source_type]}</Pill>
        </div>
        <Pill small bg={mode.bg} fg={mode.fg} className="flex-none">{mode.label}</Pill>
      </div>

      {company.url ? (
        <a href={company.url} target="_blank" rel="noopener noreferrer"
          className="box-border flex h-12 items-center gap-[10px] rounded-xl border-[1.5px] border-dash px-[14px] text-base text-link">
          <GlobeIcon />
          <span className="min-w-0 flex-1 truncate">{displayUrl(company.url)}</span>
          <span className="text-lg">↗</span>
        </a>
      ) : (
        <div className="box-border flex h-12 items-center gap-[10px] rounded-xl border-[1.5px] border-dashed border-line px-[14px] text-base text-faint">
          <GlobeIcon color="#C9BAAE" />
          ไม่มีข้อมูลเว็บไซต์
        </div>
      )}

      {editable && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onEdit} className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-line text-base font-semibold">
            <EditIcon />แก้ไข
          </button>
          <button type="button" onClick={onDelete} className="flex h-11 items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-danger-line text-base font-semibold text-danger">
            <TrashIcon />ลบ
          </button>
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Replace `client/src/pages/companies/DirectoryPage.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import Sprout from '../../components/Sprout';
import { FilterIcon, SearchIcon, Sparkle } from '../../components/Icons';
import { Chip, ErrorBanner, Fab } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { EMPTY_FILTERS, MODES, directoryQuery, hasAnyFilter, sheetFilterCount } from '../../lib/companies';
import { errorText } from '../../lib/errors';
import CompanyCard from './CompanyCard';

function EmptyState({ filtered, onAdd }) {
  return (
    <div data-anim="rise" className="card relative mx-4 mt-3 flex flex-col items-center gap-[10px] overflow-hidden px-6 py-8 text-center">
      <Sparkle size={16} className="absolute top-4 right-[18px]" />
      <div className="mb-1.5 flex size-[150px] items-center justify-center rounded-full bg-cream">
        <Sprout stage="both" hold="glass" size={124} />
      </div>
      <h2 className="text-lg leading-[1.4] font-medium">{filtered ? 'ไม่พบบริษัทที่ตรงกับตัวกรอง' : 'ยังไม่มีบริษัทในทำเนียบ'}</h2>
      <p className="text-base leading-normal text-pretty text-muted">รู้จักบริษัทที่น่าสนใจ? เพิ่มให้เพื่อน ๆ ได้เลย</p>
      <button type="button" onClick={onAdd} className="btn btn-primary mt-[10px] w-auto px-7">+ เพิ่มบริษัท</button>
    </div>
  );
}

export default function DirectoryPage() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState(null);
  const [types, setTypes] = useState([]);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null); // { kind: 'filter' } | { kind: 'form', company? } | { kind: 'delete', company }

  useEffect(() => {
    api.businessTypes().then((r) => setTypes(r.data)).catch((err) => setError(errorText(err)));
  }, []);

  // Typing updates the list after a short pause.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search ? f : { ...f, q: search })), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const r = await api.companies(directoryQuery(filters));
      setCompanies(r.data);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const badge = sheetFilterCount(filters);
  const filtered = hasAnyFilter(filters);
  const clearAll = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <>
      <header className="px-4 pt-2 pb-3">
        <h1 className="title-sheet">ทำเนียบบริษัท</h1>
        <p className="mt-1 text-[13px] leading-[1.55] text-pretty text-muted">
          ข้อมูลบริษัทที่เพื่อนในรุ่นรวบรวมไว้ ทั้งจากประสบการณ์รุ่นพี่และที่ค้นหาเอง
        </p>
      </header>

      <div className="sticky top-0 z-20 flex flex-col gap-[10px] bg-cream px-4 pt-1 pb-3">
        <div className="flex gap-2">
          <label className="box-border flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-white px-[14px] focus-within:border-2 focus-within:border-leaf focus-within:shadow-[0_0_0_4px_#D6F5E6]">
            <SearchIcon />
            <input
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
              placeholder="ค้นหาชื่อบริษัท…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={() => setSheet({ kind: 'filter' })}
            className="box-border flex h-12 flex-none items-center gap-1.5 rounded-[14px] border-[1.5px] border-line bg-white px-3 text-base font-semibold">
            <FilterIcon />
            ตัวกรอง
            {badge > 0 && (
              <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] bg-leaf text-[13px] font-bold text-forest">{badge}</span>
            )}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip className="h-11 flex-none px-4" selected={filters.mode === 'ALL'} onClick={() => setFilters((f) => ({ ...f, mode: 'ALL' }))}>
            ทั้งหมด
          </Chip>
          {MODES.map((m) => (
            <Chip key={m.value} className="h-11 flex-none px-4" selected={filters.mode === m.value}
              onClick={() => setFilters((f) => ({ ...f, mode: m.value }))}>
              <span className="size-[10px] rounded-full" style={{ background: m.dot }} />
              {m.label}
            </Chip>
          ))}
        </div>
      </div>

      {error && <div className="px-4 pb-3"><ErrorBanner>{error}</ErrorBanner></div>}

      {companies === null ? (
        <div className="flex justify-center py-16"><Sprout stage="seed" size={64} /></div>
      ) : companies.length === 0 ? (
        <EmptyState filtered={filtered} onAdd={() => setSheet({ kind: 'form' })} />
      ) : (
        <>
          <div className="flex items-center gap-1.5 px-4 pb-3 text-[13px] text-muted">
            <span>พบ {companies.length} บริษัท</span>
            {filtered && (
              <>
                <span>·</span>
                <button type="button" onClick={clearAll} className="font-semibold text-link underline">ล้างตัวกรองทั้งหมด</button>
              </>
            )}
          </div>
          <div className="flex flex-col gap-3 px-4 pb-[120px]">
            {companies.map((c, i) => (
              <CompanyCard
                key={c.id}
                company={c}
                delay={80 + Math.min(i, 6) * 90}
                editable={c.created_by === profile.id}
                onEdit={() => setSheet({ kind: 'form', company: c })}
                onDelete={() => setSheet({ kind: 'delete', company: c })}
              />
            ))}
          </div>
        </>
      )}

      <Fab label="เพิ่มบริษัท" onClick={() => setSheet({ kind: 'form' })} />
    </>
  );
}
```

- [ ] **Step 3: Build:** `npm run build` → `✓ built`.

- [ ] **Step 4: Commit:** `git add client/src/pages/companies && git commit -m "feat(client): company directory and card (4a/4c/4f)"`

---

### Task 18: 4b filter sheet, 4d add/edit sheet, delete sheet

**Extrapolated:**
- the filter sheet's "ที่มาของข้อมูล" section and the form's "ข้อมูลจาก *" chips (Q3, the design's `srcChips` / `fromChips` labels);
- the business-type placeholder "เลือกประเภทธุรกิจ";
- the edit title "แก้ไขบริษัท";
- the whole delete sheet (3d pattern, worried sprout, red outline button).

**Files:**
- Create: `client/src/pages/companies/CompanyFilterSheet.jsx`, `CompanyFormSheet.jsx`, `DeleteCompanySheet.jsx`
- Modify: `client/src/pages/companies/DirectoryPage.jsx`

- [ ] **Step 1: Write `client/src/pages/companies/CompanyFilterSheet.jsx`** (4b)

```jsx
import { useEffect, useState } from 'react';
import Sheet from '../../components/Sheet';
import { Chip } from '../../components/ui';
import { api } from '../../lib/api';
import { SOURCES, directoryQuery } from '../../lib/companies';

export default function CompanyFilterSheet({ filters, types, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState(null);

  // Live "แสดง N บริษัท" for the filters being chosen.
  useEffect(() => {
    let live = true;
    setCount(null);
    const t = setTimeout(async () => {
      try {
        const r = await api.companies(directoryQuery(draft));
        if (live) setCount(r.data.length);
      } catch {
        /* the button falls back to a plain label */
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [draft]);

  const toggleType = (id) =>
    setDraft((d) => ({ ...d, types: d.types.includes(id) ? d.types.filter((x) => x !== id) : [...d.types, id] }));

  return (
    <Sheet
      open
      onClose={onClose}
      label="ตัวกรอง"
      footer={
        <div className="grid grid-cols-[1fr_1.6fr] gap-[10px]">
          <button type="button" className="btn btn-secondary" onClick={() => setDraft((d) => ({ ...d, types: [], source: 'ALL' }))}>ล้าง</button>
          <button type="button" className="btn btn-primary" onClick={() => onApply(draft)}>
            {count === null ? 'แสดงผล' : `แสดง ${count} บริษัท`}
          </button>
        </div>
      }
    >
      <h2 className="title-sheet">ตัวกรอง</h2>
      <section className="mt-[18px]">
        <div className="mb-[10px] flex items-baseline justify-between">
          <h3 className="title-section">ประเภทธุรกิจ</h3>
          {draft.types.length > 0 && <span className="hint">เลือกแล้ว {draft.types.length}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Chip key={t.id} selected={draft.types.includes(t.id)} onClick={() => toggleType(t.id)}>{t.name_th}</Chip>
          ))}
        </div>
      </section>
      <section className="mt-[18px] pb-1">
        <h3 className="title-section mb-[10px]">ที่มาของข้อมูล</h3>
        <div className="flex flex-wrap gap-2">
          {[{ value: 'ALL', label: 'ทั้งหมด' }, ...SOURCES].map((s) => (
            <Chip key={s.value} selected={draft.source === s.value} onClick={() => setDraft((d) => ({ ...d, source: s.value }))}>{s.label}</Chip>
          ))}
        </div>
      </section>
    </Sheet>
  );
}
```

- [ ] **Step 2: Write `client/src/pages/companies/CompanyFormSheet.jsx`** (4d)

```jsx
import { useState } from 'react';
import Sheet from '../../components/Sheet';
import { ChevronDownIcon, CloseIcon } from '../../components/Icons';
import { Chip, ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { MODES, SOURCES, displayUrl, toUrl } from '../../lib/companies';
import { errorText } from '../../lib/errors';

function Field({ label, required, optional, error, gap = 'gap-1.5', children }) {
  return (
    <div className={`flex flex-col ${gap}`}>
      <div className="label">
        {label}
        {required && <span className="text-danger"> *</span>}
        {optional && <span className="font-normal text-muted"> (ไม่บังคับ)</span>}
      </div>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-[13px] text-danger">
          <span className="flex size-4 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-danger-soft">!</span>
          {error}
        </div>
      )}
    </div>
  );
}

export default function CompanyFormSheet({ company, types, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: company?.name ?? '',
    business_type_id: company ? String(company.business_type_id) : '',
    url: company?.url ? displayUrl(company.url) : '',
    work_mode: company?.work_mode ?? 'ONSITE',
    source_type: company?.source_type ?? 'SENIOR',
    note: company?.note ?? '',
  }));
  const [nameError, setNameError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const canSave = form.name.trim() && form.business_type_id;
  const title = company ? 'แก้ไขบริษัท' : 'เพิ่มบริษัท';

  async function save() {
    setBusy(true);
    setNameError(null);
    setError(null);
    const body = {
      name: form.name.trim(),
      business_type_id: Number(form.business_type_id),
      url: toUrl(form.url),
      work_mode: form.work_mode,
      source_type: form.source_type,
      note: form.note.trim() || null,
    };
    try {
      if (company) await api.updateCompany(company.id, body);
      else await api.createCompany(body);
      onSaved();
    } catch (err) {
      if (err.code === 'DUPLICATE_NAME') setNameError(errorText(err));
      else setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open full grabberGap={10} label={title} onClose={onClose}
      footer={<button type="button" className="btn btn-primary" disabled={!canSave || busy} onClick={save}>บันทึก</button>}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="title-sheet">{title}</h2>
        <button type="button" aria-label="ปิด" onClick={onClose} className="flex size-11 items-center justify-center rounded-[14px] bg-cream">
          <CloseIcon />
        </button>
      </div>
      <div className="flex flex-col gap-[14px] pt-1 pb-3">
        <Field label="ชื่อบริษัท" required error={nameError}>
          <input className="field" value={form.name} maxLength={200} aria-invalid={Boolean(nameError) || undefined}
            onChange={(e) => { setNameError(null); set('name')(e); }} />
        </Field>
        <Field label="ประเภทธุรกิจ (อ้างอิงจาก JobDB)" required>
          <div className="relative">
            <select className="field appearance-none pr-10" value={form.business_type_id} onChange={set('business_type_id')}>
              <option value="" disabled>เลือกประเภทธุรกิจ</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name_th}</option>)}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2"><ChevronDownIcon /></span>
          </div>
        </Field>
        <Field label="เว็บไซต์บริษัท" optional>
          <input className="field" inputMode="url" autoCapitalize="off" placeholder="https://example.com" value={form.url} onChange={set('url')} />
        </Field>
        <Field label="รูปแบบการฝึกงาน" required gap="gap-2">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <Chip key={m.value} className="px-4" selected={form.work_mode === m.value}
                onClick={() => setForm((f) => ({ ...f, work_mode: m.value }))}>{m.label}</Chip>
            ))}
          </div>
        </Field>
        <Field label="ข้อมูลจาก" required gap="gap-2">
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <Chip key={s.value} selected={form.source_type === s.value}
                onClick={() => setForm((f) => ({ ...f, source_type: s.value }))}>{s.label}</Chip>
            ))}
          </div>
        </Field>
        <Field label="หมายเหตุ" optional>
          <textarea className="field" maxLength={1000} placeholder="เช่น ตำแหน่งที่รับ, ช่วงเวลาที่เปิดรับ" value={form.note} onChange={set('note')} />
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 3: Write `client/src/pages/companies/DeleteCompanySheet.jsx`** (extrapolated)

```jsx
import { useState } from 'react';
import Sheet from '../../components/Sheet';
import Sprout from '../../components/Sprout';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';

export default function DeleteCompanySheet({ company, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteCompany(company.id);
      onDeleted();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={busy ? undefined : onClose} label="ลบบริษัท">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[108px] items-center justify-center rounded-full bg-cream">
          <Sprout stage="both" mood="worried" size={92} />
        </div>
        <h2 className="title-sheet mt-[14px]">ลบบริษัทนี้?</h2>
        <p className="mt-2 text-base leading-[1.55] text-pretty text-muted">“{company.name}” จะถูกลบออกจากทำเนียบ และกู้คืนไม่ได้</p>
        {error && <div className="mt-3 self-stretch text-left"><ErrorBanner>{error}</ErrorBanner></div>}
        <div className="mt-[22px] flex flex-col gap-[10px] self-stretch">
          <button type="button" className="btn btn-danger" disabled={busy} onClick={remove}>ลบ</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
        </div>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 4: Wire the sheets into `DirectoryPage.jsx`.** Add imports:

```jsx
import CompanyFilterSheet from './CompanyFilterSheet';
import CompanyFormSheet from './CompanyFormSheet';
import DeleteCompanySheet from './DeleteCompanySheet';
```

Add after `clearAll`:

```jsx
  const closeAndReload = () => {
    setSheet(null);
    load();
  };
```

and render just before `<Fab …/>`:

```jsx
      {sheet?.kind === 'filter' && (
        <CompanyFilterSheet filters={filters} types={types} onClose={() => setSheet(null)}
          onApply={(f) => { setFilters(f); setSheet(null); }} />
      )}
      {sheet?.kind === 'form' && (
        <CompanyFormSheet key={sheet.company?.id ?? 'new'} company={sheet.company} types={types}
          onClose={() => setSheet(null)} onSaved={closeAndReload} />
      )}
      {sheet?.kind === 'delete' && (
        <DeleteCompanySheet company={sheet.company} onClose={() => setSheet(null)} onDeleted={closeAndReload} />
      )}
```

- [ ] **Step 5: Build:** `npm run build` → `✓ built`.

- [ ] **Step 6: Commit:** `git add client/src/pages/companies && git commit -m "feat(client): directory filter, add/edit and delete sheets (4b/4d)"`

---

### Task 19: 5a–5c Advisor home and roster filter sheet

Source: `AdvisorHome.dc.html` and 5a–5c. Data: `GET /api/advisor/metrics` (`total`, `by_status`, `resume_done`, `portfolio_done`, `ready_to_apply`, `linked_accounts`) and `GET /api/advisor/students`. **Extrapolated:**
- a tapped tile gets a 2px leaf ring and filters the roster by that status (the design only says "แตะเพื่อกรอง");
- the filter button shows a count badge when roster filters are active (directory pattern).

A student with no name shows "(ยังไม่เข้าระบบ)", as in the design.

**Files:**
- Create: `client/src/pages/advisor/StudentRow.jsx`, `client/src/pages/advisor/RosterFilterSheet.jsx`
- Rewrite: `client/src/pages/advisor/AdvisorHomePage.jsx` (the add-student sheet is wired in Task 20)

- [ ] **Step 1: Write `client/src/pages/advisor/StudentRow.jsx`**

```jsx
import Sprout from '../../components/Sprout';
import { ChevronRightIcon } from '../../components/Icons';
import { Pill } from '../../components/ui';
import { STATUS, isReady, stageFor } from '../../lib/status';

function DocPill({ name, done }) {
  return (
    <Pill small bg={done ? '#D6F5E6' : '#F6F1EB'} fg={done ? '#146B48' : '#8A7B76'}>
      {name} {done ? '✓' : '–'}
    </Pill>
  );
}

export default function StudentRow({ row, delay, onClick }) {
  const s = STATUS[row.current_status];
  return (
    <button type="button" onClick={onClick} data-anim="rise" data-anim-delay={delay}
      className="card flex w-full items-center gap-1.5 py-[14px] pr-[10px] pl-4 text-left active:scale-[.98]">
      <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {row.full_name ? (
              <div className="text-base leading-[1.35] font-semibold">{row.full_name}</div>
            ) : (
              <span className="inline-flex rounded-full bg-sand px-[10px] py-0.5 text-[13px] font-semibold text-muted">(ยังไม่เข้าระบบ)</span>
            )}
            <div className="mt-0.5 text-[13px] text-muted tabular-nums">{row.student_id}</div>
          </div>
          <div className="flex flex-none items-center gap-1">
            <Pill small bg={s.bg} fg={s.fg}>{s.label}</Pill>
            <Sprout stage={stageFor(row)} size={32} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <DocPill name="Resume" done={row.is_resume_ready} />
          <DocPill name="Portfolio" done={row.is_portfolio_ready} />
          {isReady(row) && <Pill small bg="#FFF1C9" fg="#8A5A00">ครบแต่ยังไม่ยื่น</Pill>}
        </div>
      </div>
      <ChevronRightIcon size={22} />
    </button>
  );
}
```

- [ ] **Step 2: Write `client/src/pages/advisor/RosterFilterSheet.jsx`** (5c)

```jsx
import { useEffect, useState } from 'react';
import Sheet from '../../components/Sheet';
import { Chip } from '../../components/ui';
import { api } from '../../lib/api';
import { DOC_FILTERS, rosterQuery } from '../../lib/roster';
import { STATUS, STATUS_ORDER } from '../../lib/status';

const STATUS_CHIPS = [{ value: 'ALL', label: 'ทั้งหมด' }, ...STATUS_ORDER.map((k) => ({ value: k, label: STATUS[k].label }))];

function Group({ title, options, value, onChange }) {
  return (
    <section>
      <h3 className="title-section mb-[10px]">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} selected={value === o.value} onClick={() => onChange(o.value)}>{o.label}</Chip>
        ))}
      </div>
    </section>
  );
}

export default function RosterFilterSheet({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState(null);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    let live = true;
    setCount(null);
    const t = setTimeout(async () => {
      try {
        const r = await api.roster(rosterQuery(draft));
        if (live) setCount(r.data.length);
      } catch {
        /* the button falls back to a plain label */
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [draft]);

  return (
    <Sheet
      open
      onClose={onClose}
      label="ตัวกรอง"
      footer={
        <div className="grid grid-cols-[1fr_1.6fr] gap-[10px]">
          <button type="button" className="btn btn-secondary"
            onClick={() => setDraft((d) => ({ ...d, status: 'ALL', resume: 'ALL', portfolio: 'ALL' }))}>ล้าง</button>
          <button type="button" className="btn btn-primary" onClick={() => onApply(draft)}>
            {count === null ? 'แสดงผล' : `แสดง ${count} คน`}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-[18px] pb-3">
        <h2 className="title-sheet">ตัวกรอง</h2>
        <Group title="สถานะ" options={STATUS_CHIPS} value={draft.status} onChange={set('status')} />
        <Group title="Resume" options={DOC_FILTERS} value={draft.resume} onChange={set('resume')} />
        <Group title="Portfolio" options={DOC_FILTERS} value={draft.portfolio} onChange={set('portfolio')} />
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 3: Replace `client/src/pages/advisor/AdvisorHomePage.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sprout from '../../components/Sprout';
import { FilterIcon, SearchIcon } from '../../components/Icons';
import { CountUp, ErrorBanner, Fab } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';
import { EMPTY_ROSTER, percent, rosterFilterCount, rosterQuery } from '../../lib/roster';
import { STATUS } from '../../lib/status';
import RosterFilterSheet from './RosterFilterSheet';
import StudentRow from './StudentRow';

const TILES = ['NOT_STARTED', 'RESUME_DONE', 'PORTFOLIO_DONE', 'APPLICATIONS_SUBMITTED'];

function Bar({ pct, color, fg, delay }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-white/80">
        <div data-anim="grow-x" data-anim-delay={delay} className="h-full rounded-[3px]" style={{ width: pct, background: color }} />
      </div>
      <div className="text-[13px]" style={{ color: fg }}>{pct}</div>
    </div>
  );
}

function GardenTile({ status, n, total, delay, selected, onClick }) {
  const s = STATUS[status];
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} data-anim="rise" data-anim-delay={delay}
      className="box-border flex min-h-[132px] flex-col gap-1.5 rounded-[20px] p-[14px] text-left"
      style={{ background: s.bg, boxShadow: selected ? '0 0 0 2px #3DBE8B' : 'none' }}>
      <div className="flex items-start justify-between">
        <div className="pt-1 text-[34px] leading-none font-medium" style={{ color: s.fg }}><CountUp value={n} delay={delay} /></div>
        <div className="flex size-[50px] items-center justify-center rounded-2xl bg-white/75"><Sprout stage={s.stage} size={44} /></div>
      </div>
      <div className="mt-auto text-[13px] font-semibold" style={{ color: s.fg }}>{s.label}</div>
      <Bar pct={percent(n, total)} color={s.bar} fg={s.fg} delay={delay} />
    </button>
  );
}

function ConfirmedTile({ n, total, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} data-anim="rise" data-anim-delay="360"
      className="col-span-2 flex items-center gap-[14px] rounded-[20px] bg-mint p-[14px] text-left"
      style={{ boxShadow: selected ? '0 0 0 2px #3DBE8B' : 'none' }}>
      <div className="flex size-16 flex-none items-center justify-center rounded-[18px] bg-white/75"><Sprout stage="bloom" size={56} /></div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <div className="text-[13px] font-semibold text-mint-ink">ยืนยันที่ฝึกงาน</div>
          <div className="text-[34px] leading-none font-medium text-mint-ink"><CountUp value={n} delay={360} /></div>
        </div>
        <Bar pct={percent(n, total)} color="#3DBE8B" fg="#146B48" delay={360} />
      </div>
    </button>
  );
}

function CountRow({ label, value, dashed }) {
  return (
    <div className={`flex h-11 items-center justify-between ${dashed ? 'border-b border-dashed border-dash' : ''}`}>
      <div className="text-base">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

export default function AdvisorHomePage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useState(EMPTY_ROSTER);
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState(null); // 'filter' | 'add'
  const [error, setError] = useState(null);

  const loadMetrics = useCallback(async () => {
    try {
      setMetrics((await api.metrics()).data);
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  const loadRoster = useCallback(async () => {
    try {
      setRows((await api.roster(rosterQuery(filters))).data);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [filters]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);
  useEffect(() => {
    loadRoster();
  }, [loadRoster]);
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search ? f : { ...f, q: search })), 250);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = (k) => setFilters((f) => ({ ...f, status: f.status === k ? 'ALL' : k }));
  const badge = rosterFilterCount(filters);

  return (
    <>
      <h1 className="title-page flex h-14 items-center px-4">ภาพรวมนักศึกษา</h1>
      {error && <div className="px-4 pb-2"><ErrorBanner>{error}</ErrorBanner></div>}

      {metrics && (
        <>
          <p className="px-4 text-[13px] text-muted">
            นักศึกษาทั้งหมด {metrics.total} คน · เข้าสู่ระบบแล้ว {metrics.linked_accounts} คน
          </p>
          <section className="px-4 pt-[18px]">
            <div className="mb-[10px] flex items-baseline justify-between">
              <h2 className="title-section">สวนของรุ่น</h2>
              <span className="hint">แตะเพื่อกรอง</span>
            </div>
            <div className="grid grid-cols-2 gap-[10px]">
              {TILES.map((k, i) => (
                <GardenTile key={k} status={k} n={metrics.by_status[k]} total={metrics.total} delay={i * 90}
                  selected={filters.status === k} onClick={() => toggleStatus(k)} />
              ))}
              <ConfirmedTile n={metrics.by_status.INTERNSHIP_CONFIRMED} total={metrics.total}
                selected={filters.status === 'INTERNSHIP_CONFIRMED'} onClick={() => toggleStatus('INTERNSHIP_CONFIRMED')} />
            </div>
          </section>
          <div className="px-4 pt-3">
            <div className="card px-4 py-2">
              <CountRow label="ทำ Resume แล้ว (รวม)" value={metrics.resume_done} dashed />
              <CountRow label="ทำ Portfolio แล้ว (รวม)" value={metrics.portfolio_done} />
              <div className="-mx-2 mb-1 flex h-12 items-center justify-between rounded-xl bg-warn-soft px-2 text-warn-ink">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <span className="size-2 rounded-full bg-[#F2C24B]" />เอกสารครบ แต่ยังไม่ยื่น
                </div>
                <div className="text-lg font-medium">{metrics.ready_to_apply}</div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="sticky top-0 z-20 flex gap-2 bg-cream px-4 pt-4 pb-3">
        <label className="box-border flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-white px-[14px] focus-within:border-2 focus-within:border-leaf focus-within:shadow-[0_0_0_4px_#D6F5E6]">
          <SearchIcon />
          <input className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
            placeholder="ค้นหารหัสหรือชื่อนักศึกษา…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <button type="button" onClick={() => setSheet('filter')}
          className="box-border flex h-12 flex-none items-center gap-1.5 rounded-[14px] border-[1.5px] border-line bg-white px-3 text-base font-semibold">
          <FilterIcon />
          ตัวกรอง
          {badge > 0 && <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] bg-leaf text-[13px] font-bold text-forest">{badge}</span>}
        </button>
      </div>

      <div className="flex items-baseline justify-between px-4 pb-[10px]">
        <h2 className="title-section">รายชื่อนักศึกษา</h2>
        {rows && <span className="hint">{rows.length} คน</span>}
      </div>
      <div className="flex flex-col gap-[10px] px-4 pb-[120px]">
        {rows?.map((row, i) => (
          <StudentRow key={row.id} row={row} delay={200 + Math.min(i, 6) * 80} onClick={() => navigate(`/students/${row.id}`)} />
        ))}
      </div>

      <Fab label="เพิ่มนักศึกษา" onClick={() => setSheet('add')} />
      {sheet === 'filter' && (
        <RosterFilterSheet filters={filters} onClose={() => setSheet(null)} onApply={(f) => { setFilters(f); setSheet(null); }} />
      )}
    </>
  );
}
```

- [ ] **Step 4: Build:** `npm run build` → `✓ built`.

- [ ] **Step 5: Commit:** `git add client/src/pages/advisor && git commit -m "feat(client): advisor home — cohort garden, totals, roster, filter sheet (5a–5c)"`

---

### Task 20: 5e add student, 5d student detail, unlink sheet

**Extrapolated:**
- the success toast after adding a student;
- "– Resume" badges for missing documents in 5d;
- "—" when there's no email;
- the unlink confirmation sheet;
- the back button returns to the roster when there's history, otherwise home.

Per Q1, the confirm event shows the bloom sprout with **no company name**, exactly as 5d draws it.

**Files:**
- Create: `client/src/pages/advisor/AddStudentSheet.jsx`
- Rewrite: `client/src/pages/advisor/StudentDetailPage.jsx`
- Modify: `client/src/pages/advisor/AdvisorHomePage.jsx`

- [ ] **Step 1: Write `client/src/pages/advisor/AddStudentSheet.jsx`** (5e)

```jsx
import { useState } from 'react';
import Sheet from '../../components/Sheet';
import StudentIdField from '../../components/StudentIdField';
import { ErrorBanner } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';

export default function AddStudentSheet({ onClose, onAdded }) {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      await api.addStudent({ student_id: studentId, full_name: name.trim() || undefined });
      onAdded(studentId);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={busy ? undefined : onClose} label="เพิ่มนักศึกษาในรายชื่อ" grabberGap={14}>
      <div className="flex flex-col gap-[14px] pb-[14px]">
        <h2 className="title-sheet">เพิ่มนักศึกษาในรายชื่อ</h2>
        <StudentIdField id="new-sid" required autoFocus value={studentId} invalid={Boolean(error)}
          onChange={(v) => { setStudentId(v); setError(null); }} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-name" className="label">ชื่อ-นามสกุล</label>
          <input id="new-name" className="field" maxLength={200} placeholder="เช่น สมหญิง รักเรียน" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <div className="mt-1 grid grid-cols-[1fr_1.6fr] gap-[10px]">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-primary" disabled={studentId.length !== 11 || busy} onClick={add}>เพิ่ม</button>
        </div>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 2: Wire it into `AdvisorHomePage.jsx`.** Add imports:

```jsx
import Toast from '../../components/Toast';
import AddStudentSheet from './AddStudentSheet';
```

Add state and a stable callback with the others:

```jsx
  const [toast, setToast] = useState(null);
  const clearToast = useCallback(() => setToast(null), []);
```

and render after the filter sheet:

```jsx
      {sheet === 'add' && (
        <AddStudentSheet
          onClose={() => setSheet(null)}
          onAdded={(sid) => {
            setSheet(null);
            loadMetrics();
            loadRoster();
            setToast({ id: Date.now(), title: `เพิ่ม ${sid} ในรายชื่อแล้ว`, stage: 'seed' });
          }}
        />
      )}
      <Toast toast={toast} onDone={clearToast} bottom="calc(64px + env(safe-area-inset-bottom) + 88px)" />
```

- [ ] **Step 3: Replace `client/src/pages/advisor/StudentDetailPage.jsx`** (5d)

```jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Sheet from '../../components/Sheet';
import Sprout from '../../components/Sprout';
import { BackIcon, LeafIcon } from '../../components/Icons';
import { ErrorBanner, Pill } from '../../components/ui';
import { api } from '../../lib/api';
import { errorText } from '../../lib/errors';
import { formatThaiDateTime } from '../../lib/format';
import { STATUS, stageFor } from '../../lib/status';
import { eventView } from '../../lib/timeline';

function InfoRow({ label, children }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-dashed border-dash">
      <div className="hint">{label}</div>
      {children}
    </div>
  );
}

function DocBadge({ name, done }) {
  return (
    <Pill small bg={done ? '#D6F5E6' : '#F6F1EB'} fg={done ? '#146B48' : '#8A7B76'}>
      {done ? '✓' : '–'} {name}
    </Pill>
  );
}

const StatusChip = ({ s }) => (
  <span className="flex h-6 items-center rounded-full px-2 font-semibold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
);

function UnlinkSheet({ studentId, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function unlink() {
    setBusy(true);
    try {
      await api.unlinkStudent(studentId);
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }
  return (
    <Sheet open onClose={busy ? undefined : onClose} label="ยกเลิกการผูกบัญชี">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[108px] items-center justify-center rounded-full bg-cream"><Sprout stage="both" mood="worried" size={92} /></div>
        <h2 className="title-sheet mt-[14px]">ยกเลิกการผูกบัญชี?</h2>
        <p className="mt-2 text-base leading-[1.55] text-pretty text-muted">
          นักศึกษาจะต้องกรอกรหัสนักศึกษาใหม่เมื่อเข้าสู่ระบบครั้งถัดไป ความคืบหน้าและประวัติยังอยู่ครบ
        </p>
        {error && <div className="mt-3 self-stretch text-left"><ErrorBanner>{error}</ErrorBanner></div>}
        <div className="mt-[22px] flex flex-col gap-[10px] self-stretch">
          <button type="button" className="btn btn-danger" disabled={busy} onClick={unlink}>ยกเลิกการผูก</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ปิด</button>
        </div>
      </div>
    </Sheet>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [unlinking, setUnlinking] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await api.studentDetail(id)).data);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  const s = data?.student;
  const events = data?.timeline.map(eventView) ?? [];

  return (
    <>
      <div className="flex h-14 items-center gap-1.5 px-2">
        <button type="button" aria-label="กลับ" onClick={back} className="flex size-12 items-center justify-center rounded-[14px]"><BackIcon /></button>
        <h1 className="title-section">ข้อมูลนักศึกษา</h1>
      </div>

      {error && <div className="px-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {s && (
        <div className="flex flex-col gap-4 px-4 pt-1 pb-12">
          <div className="flex items-center gap-3 px-1">
            <div className="min-w-0 flex-1">
              <h2 className="title-sheet">{s.full_name || '(ยังไม่เข้าระบบ)'}</h2>
              <p className="hint mt-1">อัปเดตล่าสุด {formatThaiDateTime(s.updated_at)}</p>
            </div>
            <div className="flex size-32 flex-none items-center justify-center rounded-full" style={{ background: STATUS[s.current_status].bg }}>
              <Sprout stage={stageFor(s)} size={108} />
            </div>
          </div>

          <div className="card px-4 py-1">
            <InfoRow label="รหัสนักศึกษา"><span className="text-base font-semibold tabular-nums">{s.student_id}</span></InfoRow>
            <InfoRow label="สถานะ"><Pill bg={STATUS[s.current_status].bg} fg={STATUS[s.current_status].fg}>{STATUS[s.current_status].label}</Pill></InfoRow>
            <InfoRow label="เอกสาร">
              <div className="flex gap-1.5">
                <DocBadge name="Resume" done={s.is_resume_ready} />
                <DocBadge name="Portfolio" done={s.is_portfolio_ready} />
              </div>
            </InfoRow>
            <div className="flex flex-col gap-2 py-3">
              <div className="hint">อีเมล</div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate text-base">{s.email || '—'}</div>
                {s.is_linked && (
                  <button type="button" onClick={() => setUnlinking(true)}
                    className="box-border flex h-8 flex-none items-center rounded-full border-[1.5px] border-danger-line px-[10px] text-[13px] font-semibold text-danger">
                    ยกเลิกการผูก
                  </button>
                )}
              </div>
            </div>
          </div>

          <section className="card p-5">
            <h2 className="title-section mb-4">ไทม์ไลน์สถานะ</h2>
            <ol>
              {events.map((e, i) => (
                <li key={e.id} className="flex gap-3">
                  <div className="flex w-[26px] flex-none flex-col items-center">
                    <LeafIcon color={e.leaf} size={26} />
                    {i < events.length - 1 && <span className="my-1 w-0 flex-1 border-l-[3px] border-dotted border-vine" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pb-5">
                    <div className="text-base leading-[26px] font-semibold">{e.title}</div>
                    <div className="text-[13px] text-muted tabular-nums">{e.time}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                      สถานะ:{e.from ? <StatusChip s={e.from} /> : <span className="px-2 font-semibold">—</span>}→<StatusChip s={e.to} />
                    </div>
                    {e.note && <span className="mt-0.5 self-start rounded-full bg-sand px-[10px] py-0.5 text-[13px] text-muted-strong">{e.note}</span>}
                    {e.isConfirm && <div className="mt-1"><Sprout stage="bloom" size={44} /></div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {unlinking && <UnlinkSheet studentId={id} onClose={() => setUnlinking(false)} onDone={() => { setUnlinking(false); load(); }} />}
    </>
  );
}
```

- [ ] **Step 4: Build:** `npm run build` → `✓ built`.

- [ ] **Step 5: Commit:** `git add client/src/pages/advisor && git commit -m "feat(client): add student, student detail and unlink (5d/5e)"`

---

### Task 21: 6a/6b Profile

"เข้าร่วมเมื่อ" uses the roster record's `created_at`. Avatar colours come from `avatarColors(profile.id)`; the design's specific colours are sample data.

**Files:**
- Rewrite: `client/src/pages/ProfilePage.jsx`

- [ ] **Step 1: Replace `client/src/pages/ProfilePage.jsx`**

```jsx
import { useEffect, useState } from 'react';
import Sprout from '../components/Sprout';
import { LogoutIcon } from '../components/Icons';
import { Pill } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { avatarColors, formatThaiDate, thaiInitial } from '../lib/format';
import { stageFor, statusPill } from '../lib/status';

export default function ProfilePage() {
  const { me, profile, signOut } = useAuth();
  const isAdvisor = profile.role === 'ADVISOR';
  const [progress, setProgress] = useState(null);

  // The profile from sign-in can be stale after actions on the home tab.
  useEffect(() => {
    if (!isAdvisor) api.myProgress().then((r) => setProgress(r.data)).catch(() => {});
  }, [isAdvisor]);

  const p = progress ?? profile;
  const name = profile.full_name || me?.googleName || profile.email;
  const av = avatarColors(profile.id);
  const pill = isAdvisor ? null : statusPill(p);

  return (
    <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-64px-env(safe-area-inset-bottom))] flex-col">
      <h1 className="title-page flex h-14 items-center px-4">ฉัน</h1>

      <div className="flex flex-col items-center px-4 pt-3 text-center">
        <div className="relative size-[116px]">
          <div className="flex size-[116px] items-center justify-center rounded-full text-[46px] leading-none font-medium shadow-[0_0_0_5px_#FFFFFF,0_10px_24px_rgba(120,80,40,.12)]"
            style={{ background: av.bg, color: av.fg }}>
            {thaiInitial(name)}
          </div>
          {!isAdvisor && (
            <div className="absolute -right-1.5 -bottom-1 flex size-[46px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(120,80,40,.15)]">
              <Sprout stage={stageFor(p)} size={38} />
            </div>
          )}
        </div>
        <h2 className="title-sheet mt-[18px]">{name}</h2>
        {isAdvisor ? (
          <>
            <Pill bg="#D6F5E6" fg="#146B48" className="mt-1.5">อาจารย์ที่ปรึกษา</Pill>
            <p className="mt-1.5 text-base text-muted">{profile.email}</p>
          </>
        ) : (
          <>
            <p className="mt-0.5 text-base text-muted tabular-nums">{profile.student_id}</p>
            <p className="text-base text-muted">{profile.email}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-6">
        {pill && (
          <div className="card flex items-center justify-between gap-3 p-4">
            <div className="flex flex-col items-start gap-1.5">
              <div className="hint">สถานะปัจจุบัน</div>
              <Pill bg={pill.bg} fg={pill.fg}>{pill.label}</Pill>
            </div>
            <div className="text-right text-[13px] text-muted">
              เข้าร่วมเมื่อ<br />{formatThaiDate(profile.created_at)}
            </div>
          </div>
        )}
        <button type="button" onClick={signOut} className="card flex h-14 items-center gap-3 px-4 text-left text-base font-semibold text-danger">
          <LogoutIcon />
          <span className="flex-1">ออกจากระบบ</span>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-0.5 pt-8 pb-5 text-[13px] text-muted">
        <div className="font-semibold">CMM Internship Tracker</div>
        <div>เวอร์ชัน {__APP_VERSION__}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build:** `npm run build` → `✓ built`.

- [ ] **Step 3: Commit:** `git add client/src/pages/ProfilePage.jsx && git commit -m "feat(client): profile screen (6a/6b)"`

---

## Phase D — Finish

### Task 22: Remove the old client and verify

**Files:**
- Delete: `client/src/components/{CompanyCard,CompanyFilterBar,CompanyFormModal,ConfirmCompanyModal,Modal,Navbar,StatusBadge,StatusChecklist,StudentDetailModal,Timeline}.jsx`
- Delete: `client/src/pages/{AdvisorDashboardPage,CompaniesPage,StudentProgressPage}.jsx`, `client/src/lib/constants.js`

- [ ] **Step 1: Delete them**

```bash
cd client/src
git rm components/{CompanyCard,CompanyFilterBar,CompanyFormModal,ConfirmCompanyModal,Modal,Navbar,StatusBadge,StatusChecklist,StudentDetailModal,Timeline}.jsx \
       pages/{AdvisorDashboardPage,CompaniesPage,StudentProgressPage}.jsx lib/constants.js
```

- [ ] **Step 2: Nothing may still reference them:** `grep -rnE "lib/constants|StatusChecklist|ConfirmCompanyModal|Navbar|company_id|confirmed_company|react-router-dom" client/src` → no output. Then drop the compatibility package: `cd client && npm uninstall react-router-dom`.

- [ ] **Step 3: Full check:** `cd client && npm test && npm run build` → tests pass, `✓ built`. Then `cd ../server && npm test` → `# fail 0`.

- [ ] **Step 4: Commit:** `git commit -m "chore(client): remove the pre-design client"`

---

### Task 23: Visual check against the design (390×844 and desktop)

This needs signed-in test accounts, so it **writes test data**: ask the user first (CLAUDE.md). It uses the email/password test accounts from Task 4 (the dev-only `window.__supabase` hook from Task 12 signs them in), so Google OAuth isn't needed yet.

- [ ] **Step 1: Ask the user to confirm.** Then start the API (`cd server && npm run dev`) and the client (`cd client && npm run dev`).

- [ ] **Step 2: Create the accounts** (same emails as Task 4; choose any password and keep it in a shell variable, never in a file):

```bash
cd server && PW='<choose one>' node --env-file=.env --input-type=module -e "
import { supabase } from './src/lib/supabase.js';
await supabase.from('users').insert({ role: 'ADVISOR', full_name: 'ผศ.ดร. ทดสอบ ระบบ', email: 'smoke.advisor@example.com' });
for (const email of ['smoke.advisor@example.com','smoke.student@mail.kmutt.ac.th','smoke.outsider@example.com'])
  await supabase.auth.admin.createUser({ email, password: process.env.PW, email_confirm: true });"
```

- [ ] **Step 3: Walk every screen at 390×844** (Playwright `browser_resize` 390×844, or Chrome device mode). In the browser console, sign in with `await window.__supabase.auth.signInWithPassword({ email, password })`. Screenshot each state and compare it with the design source (sizes, colours, copy):

| Design | How to reach it |
|---|---|
| 1a | signed out |
| 1b | sign in as `smoke.outsider@example.com` |
| 2a–2c | sign in as the student before an advisor adds them (2b), add them, then link (2a); link the same ID from a second student account (2c) |
| 5a–5c, 5e | sign in as the advisor; add the student (5e); open ตัวกรอง (5c) |
| 3a–3c | as the student: complete Portfolio (3a), then Resume (3c, toast + sticky bar) |
| 3d / 3e / 3f | tap a pending document (3d); after ยื่นแล้ว, tap ยืนยันที่ฝึกงาน (3e) → celebration (3f) |
| 4a–4d, 4f | บริษัท tab: empty (4c), add with and without a website (4d/4f), filter sheet (4b), duplicate name error |
| 5d | advisor → tap the student; check the 5-event timeline and unlink |
| 6a / 6b | ฉัน tab for each role |

Then resize to 1280×800 and confirm the centred 430px column, the `#EDE4D9` canvas, and that the tab bar, sheets, FABs and toast stay inside the column.

- [ ] **Step 4: Show the screenshots to the user,** listing each **(extrapolated)** state separately for approval. Fix anything they flag before continuing.

- [ ] **Step 5: Clean up** exactly as in Task 4 Step 3 (reset script copy with `'yes'`, delete the smoke advisor row, delete the `smoke.*` sign-in accounts), then confirm 0 users, 0 companies, 0 log rows, 0 `auth.users`.

---

### Task 24: Update CLAUDE.md and the launch plan

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/plans/2026-10-04-cmm-internship-launch.md`, this plan

- [ ] **Step 1: `CLAUDE.md`.**
  - Replace `` `ERROR_MESSAGE` in `client/src/lib/constants.js` `` with `` `MESSAGES` in `client/src/lib/errors.js` ``.
  - Add `cd client && npm test        # Vitest logic tests` and `cd server && npm run smoke       # writes test data: ask first` under Commands.
  - Under Current plan, add: "Client UI follows `docs/design/cmm-internship-tracker-mobile/` (see `docs/superpowers/plans/2026-10-05-client-design-migration.md` for the decisions and extrapolated states)."

- [ ] **Step 2: Launch plan.**
  - Set Task 2 and Task 9 to ✅ with the note "client half done in the design migration plan".
  - In its Task 12 workflow, add a `npm test` line to the "Client build" step before `npm run build`.
  - In its Task 13, add: "the database already has migration 002".

- [ ] **Step 3: This plan:** set every task and milestone to ✅.

- [ ] **Step 4: Commit:** `git add CLAUDE.md docs/superpowers/plans && git commit -m "docs: record the design migration in CLAUDE.md and the launch plan"`

