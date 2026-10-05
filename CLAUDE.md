# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working with the user

- **If you are unsure about anything, or want to ask, ask the user first.** Don't guess at requirements,
  values (domains, usernames, keys, student data), or which option to take. A short question is
  always better than a wrong assumption. This applies to design choices, deployment steps, and anything
  that touches real student data or shared infrastructure.
- Actions on shared infrastructure (the CMM droplet, `/opt/cmm`, the shared Caddy, DNS) affect other
  people's projects. Confirm before doing any of them.
- There is **one Supabase project** for both local work and the live site. Confirm before any write
  to it beyond rolled-back tests: imports with `--commit`, the reset script, adding or removing users.

## Project

CMM Internship Tracker for KMUTT CMM students and advisors. Full description, rules, setup and API
reference are in `README.md`. Read it before making changes.

- `supabase/migrations/001_schema.sql`: schema, guard rules, triggers, RPC functions
- `server/`: Express API (service-role key) and the CSV import script
- `client/`: React + Vite + Tailwind v4 frontend (Thai UI)

## Current plan

Work follows `docs/superpowers/plans/2026-10-04-cmm-internship-launch.md`. Update its **Progress
overview** table (⬜ → 🟨 → ✅, or ⛔ with a note) and the task checkboxes as work completes, and commit
the plan along with the work.

Deployment target: `https://cmm27.cmm.works` on the shared CMM droplet, following
`DEPLOYMENT_GUIDE.md` (project slug `cmm27`, images under the user's personal GitHub account).

Client UI follows the design v2 spec, `docs/superpowers/specs/2026-10-05-design-v2-design.md`, built in
phases (`docs/superpowers/plans/2026-10-05-design-v2-phase*.md`). The Claude Design bundle in
`docs/design/cmm-internship-tracker-mobile/` and `docs/superpowers/plans/2026-10-05-client-design-migration.md`
are the record of v1. Ask before changing a decision in the spec.

Visual checks use the mocked API in `client/e2e/mock-api.js` (Playwright MCP, dev server on port 5180).
The live database has real students, so never create test students for screenshots.

## Commands

```bash
cd server && npm run dev        # API on http://localhost:4000 (needs server/.env)
cd server && npm test           # node:test unit tests
cd server && npm run import -- ../responses.csv [--commit]   # dry run unless --commit
cd server && npm run smoke      # end-to-end API check; WRITES test data: ask first
cd client && npm run dev        # http://localhost:5173
cd client && npm test           # Vitest logic tests
cd client && node scripts/make-sfx.mjs   # regenerate the UI sounds in src/assets/sfx
cd client && npm run build
```

## Rules that must not be broken

- **All business rules live in SQL** (`student_apply_action()`, CHECK constraints, triggers). Don't
  move rule enforcement into JavaScript or bypass the RPC when changing progress.
- **Progress is forward-only**, and `status_timeline_logs` is immutable. Never write code that unticks
  flags, lowers a status, or edits or deletes log rows.
- **The browser never touches data directly.** The client uses Supabase only for Google sign-in; all
  data goes through the Express API. Never add RLS policies or grants for `anon`/`authenticated`.
- The service-role/secret key is server-only. Never put it in `client/` or any `VITE_*` variable.
- Student rows can't be deleted (the immutable log references them). Test data created before go-live
  is cleared once with `supabase/admin/reset_test_data.sql`. After real students sign in, never create
  test students, and never run that script.
- Database tests (`supabase/tests/rules.sql`) must stay wrapped in `begin; … rollback;`, because they
  run against the live database.
- Never commit `.env` / `.env.*` (except `.env.example`), `*.csv`, `import-report.json` or
  `cmm_deploy_key`. They hold secrets or student data.
- The client calls the API with relative `/api/...` paths. Don't reintroduce a hostname in the build.

## Conventions

- ES modules everywhere (`"type": "module"`). Validate input with zod via `parse()`. Wrap handlers
  in `asyncHandler()`. Errors use the shape `{ error: { code, message, details } }`.
- SQL raises errors as `"<CODE>: message"`. Add new codes to `DOMAIN_CODES` in
  `server/src/lib/errors.js` and a Thai message to `MESSAGES` in `client/src/lib/errors.js`.
- UI text is Thai. Code, comments and commit messages are English.
- Student IDs are exactly 11 digits. The student email domain is `mail.kmutt.ac.th`.
