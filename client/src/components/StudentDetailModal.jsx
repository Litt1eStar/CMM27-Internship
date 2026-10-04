import { useEffect, useState } from 'react';
import Modal from './Modal';
import Timeline from './Timeline';
import StatusBadge, { FlagIcon } from './StatusBadge';
import { api } from '../lib/api';
import { errorText } from '../lib/constants';

/** Advisor view of one student: summary + vertical audit timeline. */
export default function StudentDetailModal({ studentId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setData(null);
    setError(null);
    api
      .studentDetail(studentId)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorText(err)));
  }, [studentId]);

  async function unlink() {
    if (!window.confirm('ยกเลิกการผูกบัญชี Google ของนักศึกษาคนนี้? ความคืบหน้าและประวัติจะยังอยู่ครบ')) return;
    setUnlinking(true);
    try {
      await api.unlinkStudent(studentId);
      const res = await api.studentDetail(studentId);
      setData(res.data);
      onChanged?.();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUnlinking(false);
    }
  }

  const s = data?.student;

  return (
    <Modal open={!!studentId} onClose={onClose} size="lg" title={s ? s.full_name || s.student_id : 'รายละเอียดนักศึกษา'}>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="py-8 text-center text-ink-soft">กำลังโหลด…</p>}

      {s && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-paper p-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-ink-soft">รหัสนักศึกษา</dt>
              <dd className="font-medium tabular-nums">{s.student_id}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">สถานะปัจจุบัน</dt>
              <dd className="mt-0.5"><StatusBadge status={s.current_status} /></dd>
            </div>
            <div>
              <dt className="text-ink-soft">เอกสาร</dt>
              <dd className="mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1"><FlagIcon on={s.is_resume_ready} label="Resume" /> Resume</span>
                <span className="flex items-center gap-1"><FlagIcon on={s.is_portfolio_ready} label="Portfolio" /> Portfolio</span>
              </dd>
            </div>
            <div>
              <dt className="text-ink-soft">บัญชี</dt>
              <dd className="font-medium">
                {s.is_linked ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate" title={s.email}>{s.email}</span>
                    <button type="button" onClick={unlink} disabled={unlinking} className="text-xs text-red-600 hover:underline">
                      ยกเลิกการผูก
                    </button>
                  </span>
                ) : (
                  <span className="text-ink-soft">ยังไม่เข้าสู่ระบบ</span>
                )}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-4 font-semibold">ไทม์ไลน์สถานะ</h3>
            <Timeline events={data.timeline} />
          </div>
        </div>
      )}
    </Modal>
  );
}
