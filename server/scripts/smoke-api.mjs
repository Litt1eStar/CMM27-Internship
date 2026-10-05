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
  (j) => (j.data?.timeline?.length === 5 && Boolean(j.data?.student?.created_at)) || 'missing timeline or created_at');
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
