// Visual-check harness for Playwright MCP (browser_run_code_unsafe). Fakes a signed-in session and
// answers /api in the browser, so no request reaches Supabase or the real database.
// Set SCENARIO / DELAY_MS, then pass the whole file as the code. Needs the Vite dev server on :5180
// (dev mode exposes window.__supabase, used to find the session storage key).
async (page) => {
  const SCENARIO = 'student-seed'; // student-seed | student-both | student-submitted | advisor | offline
  const DELAY_MS = 0; // delay every /api answer, to see loaders and skeletons
  const BASE = 'http://localhost:5180';

  const now = Date.now();
  const iso = (daysAgo) => new Date(now - daysAgo * 864e5).toISOString();
  const advisor = SCENARIO === 'advisor';

  const me = advisor
    ? { id: 'adv-1', role: 'ADVISOR', student_id: null, full_name: 'อาจารย์ ทดสอบ', email: 'advisor.test@kmutt.ac.th', created_at: iso(60), updated_at: iso(1) }
    : { id: 'stu-1', role: 'STUDENT', student_id: '99999999901', full_name: 'สมชาย ทดสอบ', email: 'somchai.test@mail.kmutt.ac.th', created_at: iso(20), updated_at: iso(1) };

  const flags = {
    'student-seed': [false, false, 'NOT_STARTED'],
    'student-both': [true, true, 'PORTFOLIO_DONE'],
    'student-submitted': [true, true, 'APPLICATIONS_SUBMITTED'],
  }[SCENARIO] ?? [false, false, 'NOT_STARTED'];
  let progress = { ...me, is_resume_ready: flags[0], is_portfolio_ready: flags[1], current_status: flags[2], is_linked: true };

  const ev = (id, event, prev, next, daysAgo) => ({ id, user_id: me.id, event, previous_status: prev, new_status: next, changed_at: iso(daysAgo), note: null });
  let timeline = [ev(1, 'INITIALIZED', null, 'NOT_STARTED', 20)];
  if (flags[0]) timeline.push(ev(2, 'RESUME_COMPLETED', 'NOT_STARTED', 'RESUME_DONE', 9));
  if (flags[1]) timeline.push(ev(3, 'PORTFOLIO_COMPLETED', 'RESUME_DONE', 'PORTFOLIO_DONE', 5));
  if (flags[2] === 'APPLICATIONS_SUBMITTED') timeline.push(ev(4, 'APPLICATIONS_SUBMITTED', 'PORTFOLIO_DONE', 'APPLICATIONS_SUBMITTED', 2));

  const types = [
    { id: 1, name_th: 'ซอฟต์แวร์และไอที' },
    { id: 2, name_th: 'สื่อและโฆษณา' },
    { id: 3, name_th: 'เกมและแอนิเมชัน' },
  ];
  const company = (id, name, typeId, mode, source, url, daysAgo, mine) => ({
    id, name, url, work_mode: mode, source_type: source, note: null, business_type_id: typeId,
    business_type: types.find((t) => t.id === typeId).name_th, created_by: mine ? me.id : 'someone-else',
    created_by_name: null, created_at: iso(daysAgo), updated_at: iso(daysAgo),
  });
  let companies = [
    company('c1', 'บริษัท ตัวอย่าง ดิจิทัล จำกัด', 1, 'HYBRID', 'SENIOR', 'https://example.com', 30, false),
    company('c2', 'Pixel Test Studio', 3, 'ONSITE', 'CLASSMATE', null, 3, true),
    company('c3', 'Mock Media Co.', 2, 'ONLINE', 'SENIOR', 'https://example.org', 12, false),
    company('c4', 'บริษัท ทดลอง ครีเอทีฟ', 2, 'ONSITE', 'CLASSMATE', 'https://example.net', 40, false),
  ];

  const statuses = ['NOT_STARTED', 'RESUME_DONE', 'PORTFOLIO_DONE', 'APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED'];
  const roster = Array.from({ length: 8 }, (_, i) => {
    const status = statuses[i % 5];
    const step = statuses.indexOf(status);
    return {
      id: `r${i}`, student_id: `999999999${String(10 + i)}`, full_name: i === 3 ? null : `นักศึกษา ทดสอบ ${i + 1}`,
      email: i === 3 ? null : `test${i}@mail.kmutt.ac.th`, is_resume_ready: step >= 1 || i === 7, is_portfolio_ready: step >= 2,
      current_status: status, is_linked: i !== 3, created_at: iso(30), updated_at: iso(i),
    };
  });
  const metrics = {
    total: roster.length, linked_accounts: roster.filter((r) => r.is_linked).length,
    by_status: Object.fromEntries(statuses.map((s) => [s, roster.filter((r) => r.current_status === s).length])),
    resume_done: roster.filter((r) => r.is_resume_ready).length,
    portfolio_done: roster.filter((r) => r.is_portfolio_ready).length,
    ready_to_apply: roster.filter((r) => r.is_resume_ready && r.is_portfolio_ready && ['RESUME_DONE', 'PORTFOLIO_DONE'].includes(r.current_status)).length,
  };

  // Same outcomes as progressAfter() in src/lib/status.js.
  const NEXT = {
    COMPLETE_RESUME: ['RESUME_COMPLETED', (p) => ({ ...p, is_resume_ready: true, current_status: 'RESUME_DONE' })],
    COMPLETE_PORTFOLIO: ['PORTFOLIO_COMPLETED', (p) => ({ ...p, is_portfolio_ready: true, current_status: 'PORTFOLIO_DONE' })],
    SUBMIT: ['APPLICATIONS_SUBMITTED', (p) => ({ ...p, current_status: 'APPLICATIONS_SUBMITTED' })],
    CONFIRM: ['INTERNSHIP_CONFIRMED', (p) => ({ ...p, current_status: 'INTERNSHIP_CONFIRMED' })],
  };

  await page.unrouteAll({ behavior: 'ignoreErrors' }); // forget the previous scenario
  await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    // offline: signed in, but every data request fails (shows the pages' error states)
    if (SCENARIO === 'offline' && path !== '/api/auth/me') return route.abort('internetdisconnected');
    if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
    const method = req.method();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/api/auth/me') return json({ email: me.email, googleName: me.full_name, needsLink: false, profile: progress });
    if (path === '/api/business-types') return json({ data: types });
    if (path === '/api/companies' && method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return json({ data: companies.filter((c) => c.name.toLowerCase().includes(q)) });
    }
    if (path === '/api/companies' && method === 'POST') {
      const body = req.postDataJSON();
      const row = company(`c${companies.length + 1}`, body.name, body.business_type_id, body.work_mode, body.source_type, body.url, 0, true);
      companies = [...companies, row];
      return json({ data: row }, 201);
    }
    if (path.startsWith('/api/companies/') && method === 'DELETE') {
      companies = companies.filter((c) => c.id !== path.split('/').pop());
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/me/progress') return json({ data: progress });
    if (path === '/api/me/timeline') return json({ data: timeline });
    if (path === '/api/me/actions' && method === 'POST') {
      const { action } = req.postDataJSON();
      const [event, apply] = NEXT[action];
      const prev = progress.current_status;
      progress = { ...apply(progress), updated_at: new Date().toISOString() };
      timeline = [...timeline, { ...ev(timeline.length + 1, event, prev, progress.current_status, 0), changed_at: new Date().toISOString() }];
      return json({ data: progress });
    }
    if (path === '/api/advisor/metrics') return json({ data: metrics });
    if (path === '/api/advisor/students' && method === 'GET') return json({ data: roster });
    if (path.startsWith('/api/advisor/students/')) {
      const student = roster.find((r) => r.id === path.split('/').pop());
      return json({ data: { student, timeline: [{ id: 1, user_id: student.id, event: 'INITIALIZED', previous_status: null, new_status: 'NOT_STARTED', changed_at: iso(30), note: null }] } });
    }
    return json({ error: { code: 'NOT_MOCKED', message: `${method} ${path}` } }, 500);
  });

  // Fake session: far-future expiry so supabase-js never tries to refresh it.
  const session = {
    access_token: 'mock-access-token', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(now / 1000) + 365 * 24 * 3600, refresh_token: 'mock-refresh-token',
    user: { id: 'mock-auth-user', aud: 'authenticated', role: 'authenticated', email: me.email,
      app_metadata: { provider: 'google' }, user_metadata: { full_name: me.full_name }, created_at: iso(20) },
  };
  await page.goto(BASE);
  const key = await page.evaluate(() => window.__supabase.auth.storageKey);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, JSON.stringify(session)]);
  await page.reload();
  return `scenario ${SCENARIO} ready (session key ${key})`;
}
