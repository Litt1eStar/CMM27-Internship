import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
  link: (student_id, full_name) => request('POST', '/api/auth/link', { student_id, full_name }),

  businessTypes: () => request('GET', '/api/business-types'),
  companies: (params = {}) => request('GET', `/api/companies${qs(params)}`),
  createCompany: (body) => request('POST', '/api/companies', body),
  updateCompany: (id, body) => request('PATCH', `/api/companies/${id}`, body),
  deleteCompany: (id) => request('DELETE', `/api/companies/${id}`),

  myProgress: () => request('GET', '/api/me/progress'),
  myTimeline: () => request('GET', '/api/me/timeline'),
  applyAction: (action, company_id) => request('POST', '/api/me/actions', { action, company_id }),

  metrics: () => request('GET', '/api/advisor/metrics'),
  roster: (params = {}) => request('GET', `/api/advisor/students${qs(params)}`),
  studentDetail: (id) => request('GET', `/api/advisor/students/${id}`),
  addStudent: (body) => request('POST', '/api/advisor/students', body),
  unlinkStudent: (id) => request('POST', `/api/advisor/students/${id}/unlink`),
};
