import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { HttpError, asyncHandler, parse, unwrap } from '../lib/errors.js';
import { requireProfile } from '../middleware/auth.js';

const router = Router();

const WORK_MODES = ['ONSITE', 'ONLINE', 'HYBRID'];
const SOURCES = ['SENIOR', 'CLASSMATE'];

const companyBody = z.object({
  name: z.string().trim().min(1).max(200),
  business_type_id: z.coerce.number().int().positive(),
  url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\/\S+$/i, 'URL must start with http:// or https://'),
  work_mode: z.enum(WORK_MODES),
  source_type: z.enum(SOURCES),
  note: z.string().trim().max(1000).optional().nullable(),
});

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  types: z.string().optional(), // comma-separated business_type_id list
  mode: z.enum([...WORK_MODES, 'ALL']).optional(),
  source: z.enum([...SOURCES, 'ALL']).optional(),
});

// Escape LIKE wildcards so user input is matched literally.
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** GET /api/business-types */
router.get(
  '/business-types',
  asyncHandler(async (_req, res) => {
    const data = unwrap(
      await supabase.from('business_types').select('id, name_th').order('sort_order')
    );
    res.json({ data });
  })
);

/** GET /api/companies?q=&types=1,2&mode=ONSITE|ONLINE|HYBRID|ALL&source= */
router.get(
  '/companies',
  asyncHandler(async (req, res) => {
    const query = parse(listQuery, req.query);
    let request = supabase.from('company_directory').select('*').order('name');

    if (query.q) request = request.ilike('name', `%${escapeLike(query.q)}%`);
    if (query.types) {
      const ids = query.types.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
      if (ids.length) request = request.in('business_type_id', ids);
    }
    if (query.mode && query.mode !== 'ALL') request = request.eq('work_mode', query.mode);
    if (query.source && query.source !== 'ALL') request = request.eq('source_type', query.source);

    res.json({ data: unwrap(await request) });
  })
);

/** GET /api/companies/:id */
router.get(
  '/companies/:id',
  asyncHandler(async (req, res) => {
    const data = unwrap(
      await supabase.from('company_directory').select('*').eq('id', req.params.id).maybeSingle()
    );
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Company not found');
    res.json({ data });
  })
);

/** POST /api/companies — classmates only. */
router.post(
  '/companies',
  requireProfile('STUDENT'),
  asyncHandler(async (req, res) => {
    const body = parse(companyBody, req.body);
    const { data, error } = await supabase
      .from('companies')
      .insert({ ...body, note: body.note || null, created_by: req.profile.id })
      .select('id')
      .single();
    if (error?.code === '23505') {
      throw new HttpError(409, 'DUPLICATE_NAME', 'A company with this name already exists');
    }
    if (error) unwrap({ error });
    const row = unwrap(await supabase.from('company_directory').select('*').eq('id', data.id).single());
    res.status(201).json({ data: row });
  })
);

/** Loads a company and checks the caller may change it (creator or advisor). */
async function loadEditable(req) {
  const company = unwrap(
    await supabase.from('companies').select('id, created_by').eq('id', req.params.id).maybeSingle()
  );
  if (!company) throw new HttpError(404, 'NOT_FOUND', 'Company not found');
  const isOwner = company.created_by === req.profile.id;
  if (!isOwner && req.profile.role !== 'ADVISOR') {
    throw new HttpError(403, 'FORBIDDEN', 'Only the person who added this company or an advisor can change it');
  }
  return company;
}

/** PATCH /api/companies/:id — creator or advisor. */
router.patch(
  '/companies/:id',
  requireProfile(),
  asyncHandler(async (req, res) => {
    await loadEditable(req);
    const body = parse(companyBody.partial(), req.body);
    if (!Object.keys(body).length) throw new HttpError(400, 'VALIDATION_ERROR', 'Nothing to update');
    const { error } = await supabase.from('companies').update(body).eq('id', req.params.id);
    if (error?.code === '23505') {
      throw new HttpError(409, 'DUPLICATE_NAME', 'A company with this name already exists');
    }
    if (error) unwrap({ error });
    const row = unwrap(await supabase.from('company_directory').select('*').eq('id', req.params.id).single());
    res.json({ data: row });
  })
);

/** DELETE /api/companies/:id — creator or advisor; blocked if a student confirmed it. */
router.delete(
  '/companies/:id',
  requireProfile(),
  asyncHandler(async (req, res) => {
    await loadEditable(req);
    const { error } = await supabase.from('companies').delete().eq('id', req.params.id);
    if (error?.code === '23503') {
      throw new HttpError(409, 'COMPANY_IN_USE',
        'A student has confirmed this company, so it cannot be deleted');
    }
    if (error) unwrap({ error });
    res.status(204).end();
  })
);

export default router;
