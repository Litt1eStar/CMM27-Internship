import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { asyncHandler, parse, unwrap } from '../lib/errors.js';
import { requireProfile } from '../middleware/auth.js';

const router = Router();
router.use(requireProfile('STUDENT'));

const actionBody = z
  .object({
    action: z.enum(['COMPLETE_RESUME', 'COMPLETE_PORTFOLIO', 'SUBMIT', 'CONFIRM']),
    company_id: z.string().uuid().optional(),
  })
  .refine((b) => b.action !== 'CONFIRM' || b.company_id, {
    message: 'company_id is required to confirm an internship',
    path: ['company_id'],
  });

async function loadProgress(userId) {
  return unwrap(await supabase.from('student_roster').select('*').eq('id', userId).single());
}

/** GET /api/me/progress */
router.get(
  '/progress',
  asyncHandler(async (req, res) => {
    res.json({ data: await loadProgress(req.profile.id) });
  })
);

/**
 * POST /api/me/actions  { action, company_id? }
 * All guard rules (prerequisites, forward-only, company required) are
 * enforced atomically by the student_apply_action() SQL function.
 */
router.post(
  '/actions',
  asyncHandler(async (req, res) => {
    const body = parse(actionBody, req.body);
    unwrap(
      await supabase.rpc('student_apply_action', {
        p_user_id: req.profile.id,
        p_action: body.action,
        p_company_id: body.company_id ?? null,
        p_actor_id: req.profile.id,
      })
    );
    res.json({ data: await loadProgress(req.profile.id) });
  })
);

/** GET /api/me/timeline */
router.get(
  '/timeline',
  asyncHandler(async (req, res) => {
    const data = unwrap(
      await supabase
        .from('student_timeline')
        .select('*')
        .eq('user_id', req.profile.id)
        .order('changed_at')
        .order('id')
    );
    res.json({ data });
  })
);

export default router;
