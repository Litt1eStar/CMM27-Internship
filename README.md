# CMM Internship Tracker

A cohort internship tracker and shared company directory for KMUTT CMM students and their advisors.

- **Students** report their own progress: Resume → Portfolio (any order) → ยื่นแล้ว → ยืนยันที่ฝึกงาน.
- **Classmates** add companies to a shared directory. Each entry is tagged with where the info came from (a senior or the classmate's own research).
- **Advisors** see a cohort funnel, a filterable roster, and a timestamped timeline for each student.

**Stack:** Supabase (Postgres + Google Auth) · Express API · React + Vite + Tailwind CSS v4

```
cmm-internship/
├─ supabase/migrations/001_schema.sql   database schema, rules, functions
├─ server/                              Express API + CSV import script
└─ client/                              React frontend
```

---

## How the rules are enforced

| Rule | Where it's enforced |
|---|---|
| Resume and Portfolio can be done in any order | `student_apply_action()` |
| ยื่นแล้ว requires both Resume and Portfolio | UI lock, the SQL function, **and** the `users_submit_requires_docs` CHECK constraint |
| ยืนยันที่ฝึกงาน requires ยื่นแล้ว first | `student_apply_action()` |
| Forward-only (no going back) | `users_forward_only` trigger: flags can't be unticked, status can't drop |
| Every change is logged | `users_timeline` trigger writes to `status_timeline_logs` automatically |
| The log is immutable | Triggers block UPDATE, DELETE and TRUNCATE on `status_timeline_logs` |
| Browser can't touch data directly | RLS on with no policies, and grants revoked from `anon`/`authenticated`. Only the Express server (service-role key) can read or write. |

**Status during preparation:** `current_status` shows the most recent document completed. The Resume and Portfolio flags show what's actually done. The advisor funnel also reports "เอกสารครบ แต่ยังไม่ยื่น" (both documents done, not yet submitted).

---

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run each file in `supabase/migrations/` in order (`001_schema.sql`, then `002_confirm_without_company.sql`).
3. Register each advisor with the email they will sign in with:
   ```sql
   insert into public.users (role, full_name, email)
   values ('ADVISOR', 'อ.ชื่อ นามสกุล', 'advisor@kmutt.ac.th');
   ```
   Advisor emails can be on any domain. They are allowed in because they are pre-registered.

### 2. Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/), go to **APIs & Services → Credentials → Create OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
2. In Supabase, go to **Authentication → Providers → Google**. Enable it and paste the client ID and secret.
3. In Supabase, go to **Authentication → URL Configuration**:
   - Site URL: your frontend URL (e.g. `http://localhost:5173`)
   - Redirect URLs: add the same URL, plus your production URL later.

Sign-in is limited to `@mail.kmutt.ac.th` in two places:
- The Google account picker is pre-filtered (`hd` parameter).
- The Express API rejects any other domain unless the email belongs to a registered advisor.

### 3. Server

```bash
cd server
cp .env.example .env        # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev                 # http://localhost:4000
```

### 4. Client

```bash
cd client
cp .env.example .env        # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                 # http://localhost:5173
```

### 5. Import the Google Form CSV

Export the form responses from **Google Sheets → File → Download → CSV**. Don't open the file in Excel first, because Excel turns student IDs into numbers like `6.70805E+10`.

```bash
cd server
npm run import -- ../responses.csv            # dry run: prints a report, writes nothing
npm run import -- ../responses.csv --commit   # writes to Supabase
```

The importer maps the form columns like this:

| Form answer | Result |
|---|---|
| รหัสนักศึกษา | `student_id` (must be 11 digits; bad rows are skipped and listed) |
| ☑ ทำ Resume แล้ว | Resume complete |
| ☑ ทำ Portfolio แล้ว | Portfolio complete |
| ☑ ยื่นแล้ว | ยื่นแล้ว, **only if** Resume and Portfolio are both ticked. Otherwise the student stays at the preparation stage and is listed in the report. |
| ☑ หาข้อมูลที่ฝึกงานแล้ว | Ignored |
| เริ่มเตรียมตัวฝึกงานหรือยัง | Only used for warnings. If it conflicts with the checkboxes, the checkboxes win. |

Other behaviour:
- If a student answered more than once, their answers are combined.
- Re-running the import is safe, because it only ever moves students forward.
- Each imported student's timeline notes "นำเข้าจากแบบฟอร์ม".
- If the form also collected a name or `@mail.kmutt.ac.th` email column, the importer uses it. A student with a known email is linked automatically on first sign-in.

### First sign-in for students

1. A student signs in with Google.
2. They enter their student ID once to link their account to their roster record.
3. If someone links the wrong ID, an advisor can open the student and click **ยกเลิกการผูก**. Progress and history are kept.

By default, only students already in the roster can link. Advisors can add missing students from the dashboard. To let students create their own record instead, set `ALLOW_SELF_REGISTER=true`, and optionally `STUDENT_ID_PREFIX`, in `server/.env`.

---

## API reference

All `/api` routes need `Authorization: Bearer <supabase access token>`. Errors are returned as `{ "error": { "code", "message", "details" } }`.

### Auth
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/auth/me` | anyone signed in | Current identity, plus `needsLink` |
| POST | `/api/auth/link` | student | `{ student_id }`: link the Google account to a roster record |

### Companies
| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/business-types` | all | The 12 JobDB business types |
| GET | `/api/companies?q=&types=1,2&mode=ONSITE\|ONLINE\|HYBRID\|ALL&source=SENIOR\|CLASSMATE\|ALL` | all | Search and filter the directory |
| GET | `/api/companies/:id` | all | One company |
| POST | `/api/companies` | student | Add a company (`name, business_type_id, work_mode, source_type, url?, note?`) |
| PATCH | `/api/companies/:id` | creator or advisor | Edit a company |
| DELETE | `/api/companies/:id` | creator or advisor | Delete a company. |

### Student progress
| Method | Path | Description |
|---|---|---|
| GET | `/api/me/progress` | Flags and status |
| POST | `/api/me/actions` | `{ action: COMPLETE_RESUME \| COMPLETE_PORTFOLIO \| SUBMIT \| CONFIRM }` |
| GET | `/api/me/timeline` | Your audit log |

`POST /api/me/actions` can return these errors:

| Code | Status | Meaning |
|---|---|---|
| `PREREQ_NOT_MET` | 422 | Resume and Portfolio aren't both done |
| `INVALID_TRANSITION` | 409 | Confirming before submitting |
| `ALREADY_DONE` | 409 | That step is already complete |
| `FORWARD_ONLY` | 409 | The change would move progress backward |

### Advisor
| Method | Path | Description |
|---|---|---|
| GET | `/api/advisor/metrics` | Funnel counts per status, plus resume/portfolio totals and ready-to-apply |
| GET | `/api/advisor/students?q=&status=&resume=&portfolio=` | Roster |
| GET | `/api/advisor/students/:id` | One student plus their full timeline |
| POST | `/api/advisor/students` | Add a student `{ student_id, full_name? }` |
| POST | `/api/advisor/students/:id/unlink` | Detach a wrongly linked Google account |

---

## Deploying

- **Client:** `npm run build` produces static files in `client/dist`. Host them on Vercel, Netlify, or Cloudflare Pages. Set the `VITE_*` environment variables in the host.
- **Server:** deploy anywhere that runs Node 20+ (Render, Railway, Fly.io). Set the variables from `.env.example` there, and set `CLIENT_ORIGIN` to your frontend URL.
- Add the production frontend URL to Supabase's **Redirect URLs**.
