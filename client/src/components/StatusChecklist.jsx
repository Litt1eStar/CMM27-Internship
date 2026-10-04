import { useState } from 'react';
import Modal from './Modal';
import ConfirmCompanyModal from './ConfirmCompanyModal';
import StatusBadge from './StatusBadge';
import { errorText, formatDateTime } from '../lib/constants';

const RANK = {
  NOT_STARTED: 0,
  RESUME_DONE: 1,
  PORTFOLIO_DONE: 1,
  APPLICATIONS_SUBMITTED: 2,
  INTERNSHIP_CONFIRMED: 3,
};

const ACTION_COPY = {
  COMPLETE_RESUME: { title: 'ยืนยันว่าทำ Resume เสร็จแล้ว?', button: 'ทำ Resume เสร็จแล้ว' },
  COMPLETE_PORTFOLIO: { title: 'ยืนยันว่าทำ Portfolio เสร็จแล้ว?', button: 'ทำ Portfolio เสร็จแล้ว' },
  SUBMIT: { title: 'ยืนยันว่ายื่นสมัครฝึกงานแล้ว?', button: 'ยื่นแล้ว' },
};

/**
 * Student self-report component.
 * Rules shown in the UI (and enforced again by the API + database):
 *   - Resume and Portfolio can be completed in any order.
 *   - "ยื่นแล้ว" unlocks only when both are complete.
 *   - "ยืนยันที่ฝึกงาน" unlocks after submitting and needs a company.
 *   - Everything is forward-only: completed steps can't be undone.
 */
export default function StatusChecklist({ progress, timeline, onAction }) {
  const [pending, setPending] = useState(null); // action awaiting confirmation
  const [pickCompany, setPickCompany] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const rank = RANK[progress.current_status];
  const docsReady = progress.is_resume_ready && progress.is_portfolio_ready;
  const at = (event) => timeline.find((e) => e.event === event)?.changed_at;

  async function run(action, companyId) {
    setBusy(true);
    setError(null);
    try {
      await onAction(action, companyId);
      setPending(null);
      setPickCompany(false);
    } catch (err) {
      setError(errorText(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold">สถานะการเตรียมตัวฝึกงาน</h2>
          <p className="text-sm text-ink-soft">อัปเดตความคืบหน้าของคุณเอง ทุกขั้นตอนบันทึกเวลาไว้ และย้อนกลับไม่ได้</p>
        </div>
        <StatusBadge status={progress.current_status} />
      </div>

      <div className="space-y-6 px-5 py-5">
        {/* Step 1: documents, any order */}
        <Step number="1" title="เตรียมเอกสาร" hint="ทำได้ตามลำดับใดก็ได้" done={docsReady}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DocItem
              label="Resume"
              done={progress.is_resume_ready}
              doneAt={at('RESUME_COMPLETED')}
              onClick={() => setPending('COMPLETE_RESUME')}
            />
            <DocItem
              label="Portfolio"
              done={progress.is_portfolio_ready}
              doneAt={at('PORTFOLIO_COMPLETED')}
              onClick={() => setPending('COMPLETE_PORTFOLIO')}
            />
          </div>
        </Step>

        {/* Step 2: submit, guarded */}
        <Step number="2" title="ยื่นสมัครฝึกงาน" done={rank >= 2} locked={!docsReady}>
          {rank >= 2 ? (
            <DoneLine text="ยื่นสมัครแล้ว" at={at('APPLICATIONS_SUBMITTED')} />
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" disabled={!docsReady} onClick={() => setPending('SUBMIT')}>
                ยื่นแล้ว
              </button>
              {!docsReady && (
                <span className="text-sm text-ink-soft">
                  🔒 ต้องทำ{' '}
                  {[!progress.is_resume_ready && 'Resume', !progress.is_portfolio_ready && 'Portfolio']
                    .filter(Boolean)
                    .join(' และ ')}{' '}
                  ให้เสร็จก่อน
                </span>
              )}
            </div>
          )}
        </Step>

        {/* Step 3: confirm with company */}
        <Step number="3" title="ยืนยันที่ฝึกงาน" done={rank >= 3} locked={rank < 2} last>
          {rank >= 3 ? (
            <div className="space-y-2">
              <DoneLine text="ยืนยันที่ฝึกงานแล้ว" at={at('INTERNSHIP_CONFIRMED')} />
              <a
                href={progress.confirmed_company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:underline"
              >
                {progress.confirmed_company_name} ↗
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary" disabled={rank < 2} onClick={() => setPickCompany(true)}>
                เลือกบริษัทและยืนยัน
              </button>
              {rank < 2 && <span className="text-sm text-ink-soft">🔒 ต้องยื่นสมัครก่อน</span>}
            </div>
          )}
        </Step>

        {error && !pending && !pickCompany && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      <Modal
        open={!!pending}
        onClose={() => !busy && setPending(null)}
        size="sm"
        title={pending && ACTION_COPY[pending].title}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setPending(null)}>
              ยกเลิก
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => run(pending).catch(() => {})}>
              {busy ? 'กำลังบันทึก…' : 'ยืนยัน'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">ระบบจะบันทึกวันและเวลาไว้ในประวัติ และจะย้อนกลับขั้นตอนนี้ไม่ได้</p>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Modal>

      <ConfirmCompanyModal
        open={pickCompany}
        onClose={() => setPickCompany(false)}
        onConfirm={(companyId) => run('CONFIRM', companyId)}
      />
    </section>
  );
}

function Step({ number, title, hint, done, locked, last, children }) {
  return (
    <div className="relative flex gap-4">
      {!last && <span className="absolute left-4 top-9 -bottom-6 w-px bg-line" />}
      <span
        className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
          done ? 'bg-emerald-600 text-white' : locked ? 'bg-gray-100 text-gray-400' : 'bg-ink text-white'
        }`}
      >
        {done ? '✓' : number}
      </span>
      <div className={`flex-1 pt-1 ${locked && !done ? 'opacity-70' : ''}`}>
        <div className="mb-3 flex items-baseline gap-2">
          <h3 className="font-semibold">{title}</h3>
          {hint && <span className="text-xs text-ink-soft">{hint}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

function DocItem({ label, done, doneAt, onClick }) {
  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-600 text-sm text-white">✓</span>
        <div>
          <div className="font-medium text-emerald-900">ทำ {label} แล้ว</div>
          {doneAt && <div className="text-xs text-emerald-800/80">{formatDateTime(doneAt)}</div>}
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 text-left transition hover:border-ink"
    >
      <span className="h-6 w-6 rounded-md border-2 border-gray-300" />
      <div>
        <div className="font-medium">ทำ {label} แล้ว</div>
        <div className="text-xs text-ink-soft">กดเมื่อทำเสร็จ</div>
      </div>
    </button>
  );
}

function DoneLine({ text, at }) {
  return (
    <p className="text-sm">
      <span className="font-medium text-emerald-700">✓ {text}</span>
      {at && <span className="ml-2 text-ink-soft">{formatDateTime(at)}</span>}
    </p>
  );
}
