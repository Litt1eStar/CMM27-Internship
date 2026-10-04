import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { HttpError, asyncHandler, parse, unwrap } from '../lib/errors.js';
import { requireProfile } from '../middleware/auth.js';

const router = Router();
router.use(requireProfile('ADVISOR'));

const STATUSES = [
  'NOT_STARTED',
  'RESUME_DONE',
  'PORTFOLIO_DONE',
  'APPLICATIONS_SUBMITTED',
  'INTERNSHIP_CONFIRMED',
];

const rosterQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum([...STATUSES, 'ALL']).optional(),
  resume: z.enum(['true', 'false']).optional(),
  portfolio: z.enum(['true', 'false']).optional(),
});

// Characters with meaning in a PostgREST or() filter are dropped; LIKE
// wildcards are escaped so the search is literal.
const escapeLike = (s) => s.replace(/[,()"]/g, ' ').replace(/[\\%_]/g, (c) => `\\${c}`);

/** GET /api/advisor/metrics — cohort funnel counts. */
router.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    res.json({ data: unwrap(await supabase.rpc('get_cohort_metrics')) });
  })
);

/** GET /api/advisor/students?q=&status=&resume=&portfolio= */
router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const query = parse(rosterQuery, req.query);
    let request = supabase.from('student_roster').select('*').order('student_id');

    if (query.q) {
      const q = escapeLike(query.q);
      request = request.or(`student_id.ilike.%${q}%,full_name.ilike.%${q}%`);
    }
    if (query.status && query.status !== 'ALL') request = request.eq('current_status', query.status);
    if (query.resume) request = request.eq('is_resume_ready', query.resume === 'true');
    if (query.portfolio) request = request.eq('is_portfolio_ready', query.portfolio === 'true');

    res.json({ data: unwrap(await request) });
  })
);

/** GET /api/advisor/students/:id — student + full timeline. */
router.get(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const student = unwrap(
      await supabase.from('student_roster').select('*').eq('id', req.params.id).maybeSingle()
    );
    if (!student) throw new HttpError(404, 'NOT_FOUND', 'Student not found');
    const timeline = unwrap(
      await supabase
        .from('student_timeline')
        .select('*')
        .eq('user_id', req.params.id)
        .order('changed_at')
        .order('id')
    );
    res.json({ data: { student, timeline } });
  })
);

const newStudent = z.object({
  student_id: z.string().trim().regex(/^[0-9]{11}$/, 'Student ID must be 11 digits'),
  full_name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

/** POST /api/advisor/students — add a student to the roster. */
router.post(
  '/students',
  asyncHandler(async (req, res) => {
    const body = parse(newStudent, req.body);
    const created = unwrap(
      await supabase
        .from('users')
        .insert({ student_id: body.student_id, full_name: body.full_name, email: body.email })
        .select('id')
        .single()
    );
    const row = unwrap(await supabase.from('student_roster').select('*').eq('id', created.id).single());
    res.status(201).json({ data: row });
  })
);

/**
 * POST /api/advisor/students/:id/unlink — detach a Google account that
 * linked the wrong student ID. Progress and history are kept.
 */
router.post(
  '/students/:id/unlink',
  asyncHandler(async (req, res) => {
    const updated = unwrap(
      await supabase
        .from('users')
        .update({ auth_user_id: null, email: null })
        .eq('id', req.params.id)
        .eq('role', 'STUDENT')
        .select('id')
        .maybeSingle()
    );
    if (!updated) throw new HttpError(404, 'NOT_FOUND', 'Student not found');
    res.json({ data: { id: updated.id, unlinked: true } });
  })
);

export default router;
