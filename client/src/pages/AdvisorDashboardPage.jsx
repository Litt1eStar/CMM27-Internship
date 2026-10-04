import { useCallback, useEffect, useState } from 'react';
import Modal from '../components/Modal';
import StatusBadge, { FlagIcon } from '../components/StatusBadge';
import StudentDetailModal from '../components/StudentDetailModal';
import { api } from '../lib/api';
import { STATUS_LABEL, STATUS_ORDER, errorText } from '../lib/constants';

const BAR = {
  NOT_STARTED: 'bg-gray-400',
  RESUME_DONE: 'bg-sky-500',
  PORTFOLIO_DONE: 'bg-violet-500',
  APPLICATIONS_SUBMITTED: 'bg-amber-500',
  INTERNSHIP_CONFIRMED: 'bg-emerald-600',
};

export default function AdvisorDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: 'ALL', resume: '', portfolio: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspectId, setInspectId] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadMetrics = useCallback(() => {
    api.metrics().then((res) => setMetrics(res.data)).catch((err) => setError(errorText(err)));
  }, []);

  const loadRoster = useCallback(() => {
    setLoading(true);
    return api
      .roster({ ...filters, q: filters.q.trim() })
      .then((res) => setStudents(res.data))
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(loadMetrics, [loadMetrics]);
  useEffect(() => {
    const t = setTimeout(loadRoster, filters.q ? 250 : 0);
    return () => clearTimeout(t);
  }, [loadRoster, filters.q]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ภาพรวมนักศึกษา</h1>
          {metrics && (
            <p className="text-sm text-ink-soft">
              นักศึกษาทั้งหมด {metrics.total} คน · เข้าสู่ระบบแล้ว {metrics.linked_accounts} คน
            </p>
          )}
        </div>
        <button type="button" className="btn-secondary" onClick={() => setAdding(true)}>
          + เพิ่มนักศึกษา
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {metrics && <CohortFunnel metrics={metrics} onPick={(status) => setFilters((f) => ({ ...f, status }))} />}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center">
          <input
            type="search"
            className="input md:max-w-xs"
            placeholder="ค้นหารหัสหรือชื่อนักศึกษา…"
            value={filters.q}
            onChange={set('q')}
            aria-label="ค้นหานักศึกษา"
          />
          <select className="input md:w-48" value={filters.status} onChange={set('status')} aria-label="สถานะ">
            <option value="ALL">ทุกสถานะ</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select className="input md:w-40" value={filters.resume} onChange={set('resume')} aria-label="Resume">
            <option value="">Resume: ทั้งหมด</option>
            <option value="true">Resume: เสร็จแล้ว</option>
            <option value="false">Resume: ยังไม่เสร็จ</option>
          </select>
          <select className="input md:w-44" value={filters.portfolio} onChange={set('portfolio')} aria-label="Portfolio">
            <option value="">Portfolio: ทั้งหมด</option>
            <option value="true">Portfolio: เสร็จแล้ว</option>
            <option value="false">Portfolio: ยังไม่เสร็จ</option>
          </select>
          <span className="text-sm text-ink-soft md:ml-auto">{students.length} คน</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper text-left text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">รหัสนักศึกษา</th>
                <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3 text-center font-medium">Resume</th>
                <th className="px-4 py-3 text-center font-medium">Portfolio</th>
                <th className="px-4 py-3 font-medium">สถานะปัจจุบัน</th>
                <th className="px-4 py-3 font-medium">บริษัทที่ยืนยัน</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className={`divide-y divide-line ${loading ? 'opacity-60' : ''}`}>
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3 font-medium tabular-nums">{s.student_id}</td>
                  <td className="px-4 py-3">
                    {s.full_name || <span className="text-ink-soft">—</span>}
                    {!s.is_linked && <span className="ml-2 text-xs text-ink-soft">(ยังไม่เข้าระบบ)</span>}
                  </td>
                  <td className="px-4 py-3 text-center"><FlagIcon on={s.is_resume_ready} label="Resume" /></td>
                  <td className="px-4 py-3 text-center"><FlagIcon on={s.is_portfolio_ready} label="Portfolio" /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.current_status} /></td>
                  <td className="max-w-48 truncate px-4 py-3">
                    {s.confirmed_company_name ? (
                      <a href={s.confirmed_company_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {s.confirmed_company_name}
                      </a>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="btn-secondary px-3 py-1" onClick={() => setInspectId(s.id)}>
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-soft">ไม่พบนักศึกษา</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <StudentDetailModal
        studentId={inspectId}
        onClose={() => setInspectId(null)}
        onChanged={() => {
          loadRoster();
          loadMetrics();
        }}
      />

      <AddStudentModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={() => {
          setAdding(false);
          loadRoster();
          loadMetrics();
        }}
      />
    </div>
  );
}

/** Macro cohort funnel: count + share per status, plus "docs ready" insight. */
function CohortFunnel({ metrics, onPick }) {
  const total = metrics.total || 1;
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">สถานะของรุ่น</h2>
        <span className="text-sm text-ink-soft">กดที่สถานะเพื่อกรองตาราง</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_ORDER.map((s) => {
          const n = metrics.by_status[s] ?? 0;
          const pct = Math.round((n / total) * 100);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-xl border border-line p-4 text-left transition hover:border-ink"
            >
              <div className="text-sm text-ink-soft">{STATUS_LABEL[s]}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{n}</span>
                <span className="text-sm text-ink-soft">{pct}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${BAR[s]}`} style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-sm text-ink-soft">
        <span>ทำ Resume แล้ว (รวม) <b className="text-ink">{metrics.resume_done}</b></span>
        <span>ทำ Portfolio แล้ว (รวม) <b className="text-ink">{metrics.portfolio_done}</b></span>
        <span>เอกสารครบ แต่ยังไม่ยื่น <b className="text-ink">{metrics.ready_to_apply}</b></span>
      </div>
    </section>
  );
}

function AddStudentModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ student_id: '', full_name: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({ student_id: '', full_name: '' });
      setError(null);
    }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.addStudent({ student_id: form.student_id, full_name: form.full_name.trim() || undefined });
      onAdded();
    } catch (err) {
      setError(err.code === 'DUPLICATE' ? 'มีรหัสนักศึกษานี้ในระบบแล้ว' : errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="เพิ่มนักศึกษาในรายชื่อ"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button type="submit" form="add-student" className="btn-primary" disabled={busy || !/^[0-9]{11}$/.test(form.student_id)}>
            {busy ? 'กำลังบันทึก…' : 'เพิ่ม'}
          </button>
        </>
      }
    >
      <form id="add-student" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="as-id">รหัสนักศึกษา *</label>
          <input
            id="as-id"
            className="input tabular-nums"
            inputMode="numeric"
            maxLength={11}
            value={form.student_id}
            onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value.replace(/\D/g, '') }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="as-name">ชื่อ-นามสกุล</label>
          <input id="as-name" className="input" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
