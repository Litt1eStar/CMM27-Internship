import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { HttpError, asyncHandler, parse, unwrap } from '../lib/errors.js';
import { isStudentEmail } from '../middleware/auth.js';

const router = Router();

const ALLOW_SELF_REGISTER = process.env.ALLOW_SELF_REGISTER === 'true';
const STUDENT_ID_PREFIX = process.env.STUDENT_ID_PREFIX || '';

/** GET /api/auth/me — who am I, and do I still need to link a student ID? */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({
      email: req.authUser.email,
      googleName: req.authUser.name,
      needsLink: !req.profile,
      profile: req.profile,
    });
  })
);

const linkSchema = z.object({
  student_id: z.string().trim().regex(/^[0-9]{11}$/, 'Student ID must be 11 digits'),
  full_name: z.string().trim().min(1).max(200).optional(),
});

/** POST /api/auth/link — attach this Google account to a student record. */
router.post(
  '/link',
  asyncHandler(async (req, res) => {
    if (req.profile) throw new HttpError(409, 'ALREADY_LINKED', 'This account is already linked');
    if (!isStudentEmail(req.authUser.email)) {
      throw new HttpError(403, 'DOMAIN_NOT_ALLOWED', 'Only student accounts can link a student ID');
    }

    const body = parse(linkSchema, req.body);
    const fullName = body.full_name || req.authUser.name;

    const existing = unwrap(
      await supabase.from('users').select('*').eq('student_id', body.student_id).maybeSingle()
    );

    if (!existing) {
      if (!ALLOW_SELF_REGISTER) {
        throw new HttpError(404, 'STUDENT_NOT_FOUND',
          'This student ID is not in the cohort roster. Please contact your advisor.');
      }
      if (STUDENT_ID_PREFIX && !body.student_id.startsWith(STUDENT_ID_PREFIX)) {
        throw new HttpError(403, 'NOT_IN_COHORT', 'This student ID is not part of this cohort');
      }
      const created = unwrap(
        await supabase
          .from('users')
          .insert({
            student_id: body.student_id,
            full_name: fullName,
            email: req.authUser.email,
            auth_user_id: req.authUser.id,
          })
          .select('*')
          .single()
      );
      return res.status(201).json({ profile: created });
    }

    if (existing.auth_user_id) {
      throw new HttpError(409, 'ALREADY_CLAIMED',
        'This student ID is already linked to another account. Please contact your advisor.');
    }

    // Conditional update: only succeeds if nobody claimed it in the meantime.
    const linked = unwrap(
      await supabase
        .from('users')
        .update({
          auth_user_id: req.authUser.id,
          email: req.authUser.email,
          full_name: existing.full_name || fullName,
        })
        .eq('id', existing.id)
        .is('auth_user_id', null)
        .select('*')
        .maybeSingle()
    );
    if (!linked) throw new HttpError(409, 'ALREADY_CLAIMED', 'This student ID was just linked by another account');

    res.json({ profile: linked });
  })
);

export default router;
