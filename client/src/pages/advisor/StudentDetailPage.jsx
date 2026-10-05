import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Sheet, { SheetCloseButton } from '../../components/Sheet';
import { Skeleton, SkeletonCards } from '../../components/Skeleton';
import Sprout from '../../components/Sprout';
import { BackIcon, LeafIcon } from '../../components/Icons';
import { ErrorBanner, Pill } from '../../components/ui';
import { api } from '../../lib/api';
import { navigateWithTransition } from '../../lib/transitions';
import { errorText } from '../../lib/errors';
import { formatThaiDateTime } from '../../lib/format';
import { STATUS, stageFor } from '../../lib/status';
import { eventView } from '../../lib/timeline';

function InfoRow({ label, children }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-dashed border-dash">
      <div className="hint">{label}</div>
      {children}
    </div>
  );
}

function DocBadge({ name, done }) {
  return (
    <Pill small bg={done ? '#D6F5E6' : '#F6F1EB'} fg={done ? '#146B48' : '#8A7B76'}>
      {done ? '✓' : '–'} {name}
    </Pill>
  );
}

const StatusChip = ({ s }) => (
  <span className="flex h-6 items-center rounded-full px-2 font-semibold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
);

function UnlinkSheet({ studentId, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function unlink() {
    setBusy(true);
    try {
      await api.unlinkStudent(studentId);
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }
  return (
    <Sheet open onClose={busy ? undefined : onClose} label="ยกเลิกการผูกบัญชี">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-[108px] items-center justify-center rounded-full bg-cream"><Sprout stage="both" mood="worried" size={92} /></div>
        <h2 className="title-sheet mt-[14px]">ยกเลิกการผูกบัญชี?</h2>
        <p className="mt-2 text-base leading-[1.55] text-pretty text-muted">
          นักศึกษาจะต้องกรอกรหัสนักศึกษาใหม่เมื่อเข้าสู่ระบบครั้งถัดไป ความคืบหน้าและประวัติยังอยู่ครบ
        </p>
        {error && <div className="mt-3 self-stretch text-left"><ErrorBanner>{error}</ErrorBanner></div>}
        <div className="mt-[22px] flex flex-col gap-[10px] self-stretch">
          <button type="button" className="btn btn-danger" disabled={busy} onClick={unlink}>ยกเลิกการผูก</button>
          <SheetCloseButton className="btn btn-secondary" disabled={busy}>ปิด</SheetCloseButton>
        </div>
      </div>
    </Sheet>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [unlinking, setUnlinking] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await api.studentDetail(id)).data);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const back = () => navigateWithTransition(navigate, window.history.state?.idx > 0 ? -1 : '/');
  const s = data?.student;
  const events = data?.timeline.map(eventView) ?? [];

  return (
    <>
      <div className="flex h-14 items-center gap-1.5 px-2">
        <button type="button" aria-label="กลับ" onClick={back} className="flex size-12 items-center justify-center rounded-[14px]"><BackIcon /></button>
        <h1 className="title-section">ข้อมูลนักศึกษา</h1>
      </div>

      {error && <div className="px-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {!s && !error && (
        <div className="flex flex-col gap-4 px-4 pt-1">
          <div className="flex items-center gap-3 px-1">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="size-32 rounded-full" />
          </div>
          <SkeletonCards count={2} height={160} />
        </div>
      )}

      {s && (
        <div className="flex flex-col gap-4 px-4 pt-1 pb-12">
          <div className="flex items-center gap-3 px-1" style={{ viewTransitionName: `student-${id}` }}>
            <div className="min-w-0 flex-1">
              <h2 className="title-sheet">{s.full_name || '(ยังไม่เข้าระบบ)'}</h2>
              <p className="hint mt-1">อัปเดตล่าสุด {formatThaiDateTime(s.updated_at)}</p>
            </div>
            <div className="flex size-32 flex-none items-center justify-center rounded-full" style={{ background: STATUS[s.current_status].bg }}>
              <Sprout stage={stageFor(s)} size={108} />
            </div>
          </div>

          <div className="card px-4 py-1">
            <InfoRow label="รหัสนักศึกษา"><span className="text-base font-semibold tabular-nums">{s.student_id}</span></InfoRow>
            <InfoRow label="สถานะ"><Pill bg={STATUS[s.current_status].bg} fg={STATUS[s.current_status].fg}>{STATUS[s.current_status].label}</Pill></InfoRow>
            <InfoRow label="เอกสาร">
              <div className="flex gap-1.5">
                <DocBadge name="Resume" done={s.is_resume_ready} />
                <DocBadge name="Portfolio" done={s.is_portfolio_ready} />
              </div>
            </InfoRow>
            <div className="flex flex-col gap-2 py-3">
              <div className="hint">อีเมล</div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate text-base">{s.email || '—'}</div>
                {s.is_linked && (
                  <button type="button" onClick={() => setUnlinking(true)}
                    className="box-border flex h-8 flex-none items-center rounded-full border-[1.5px] border-danger-line px-[10px] text-[13px] font-semibold text-danger">
                    ยกเลิกการผูก
                  </button>
                )}
              </div>
            </div>
          </div>

          <section className="card p-5">
            <h2 className="title-section mb-4">ไทม์ไลน์สถานะ</h2>
            <ol>
              {events.map((e, i) => (
                <li key={e.id} className="flex gap-3">
                  <div className="flex w-[26px] flex-none flex-col items-center">
                    <LeafIcon color={e.leaf} size={26} />
                    {i < events.length - 1 && <span className="my-1 w-0 flex-1 border-l-[3px] border-dotted border-vine" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pb-5">
                    <div className="text-base leading-[26px] font-semibold">{e.title}</div>
                    <div className="text-[13px] text-muted tabular-nums">{e.time}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                      สถานะ:{e.from ? <StatusChip s={e.from} /> : <span className="px-2 font-semibold">—</span>}→<StatusChip s={e.to} />
                    </div>
                    {e.note && <span className="mt-0.5 self-start rounded-full bg-sand px-[10px] py-0.5 text-[13px] text-muted-strong">{e.note}</span>}
                    {e.isConfirm && <div className="mt-1"><Sprout stage="bloom" size={44} /></div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      {unlinking && <UnlinkSheet studentId={id} onClose={() => setUnlinking(false)} onDone={() => { setUnlinking(false); load(); }} />}
    </>
  );
}
