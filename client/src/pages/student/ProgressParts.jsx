import Sprout from '../../components/Sprout';
import { ArrowDownIcon, ChevronRightIcon, CheckIcon, InfoIcon, LeafDeco, LeafIcon, Sparkle } from '../../components/Icons';
import { Pill } from '../../components/ui';
import { formatThaiDateTime } from '../../lib/format';
import { STRIP_LABELS, docsComplete, homeHint, isConfirmed, isSubmitted, lockedSubmitHint, stageFor, statusPill, stepIndex } from '../../lib/status';
import { eventTime, historyFor } from '../../lib/timeline';

export const STICKY_BAR_HEIGHT = 100;

export const DOCS = [
  { name: 'Resume', flag: 'is_resume_ready', action: 'COMPLETE_RESUME', event: 'RESUME_COMPLETED', leaf: '#9CD2FF' },
  { name: 'Portfolio', flag: 'is_portfolio_ready', action: 'COMPLETE_PORTFOLIO', event: 'PORTFOLIO_COMPLETED', leaf: '#C9B6FF' },
];

export function HeroCard({ progress, name }) {
  const pill = statusPill(progress);
  const step = stepIndex(progress);
  return (
    <section data-anim="rise" className="card relative overflow-hidden p-5">
      <Sparkle size={16} className="absolute top-3 right-[14px]" />
      <LeafDeco size={26} className="absolute -bottom-[5px] -left-[5px]" />
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[10px]">
          <h2 className="text-2xl leading-[1.25] font-medium">{name ? `สวัสดี ${name} 👋` : 'สวัสดี 👋'}</h2>
          <Pill bg={pill.bg} fg={pill.fg}>{pill.label}</Pill>
        </div>
        <div data-anim="pop" className="flex size-[124px] flex-none items-center justify-center rounded-full bg-cream">
          <Sprout stage={stageFor(progress)} size={104} />
        </div>
      </div>
      <p className="mt-[14px] rounded-[14px] bg-cream px-[14px] py-3 text-base leading-normal text-pretty">{homeHint(progress)}</p>
      <div className="relative mt-[18px]">
        <div className="absolute top-[13px] right-[10%] left-[10%] border-t-2 border-dashed border-line" />
        <div data-anim="grow-x" data-anim-delay="300" className="absolute top-[13px] left-[10%] border-t-2 border-leaf" style={{ width: `${step * 20}%` }} />
        <ol className="relative grid grid-cols-5">
          {STRIP_LABELS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="flex flex-col items-center gap-1.5">
                <span
                  data-anim={current ? 'pulse' : undefined}
                  className="box-border flex items-center justify-center rounded-full border-2 text-xs font-bold text-forest"
                  style={{
                    width: current ? 28 : 24,
                    height: current ? 28 : 24,
                    marginTop: current ? 0 : 2,
                    background: done ? '#3DBE8B' : '#FFFFFF',
                    borderColor: done || current ? '#3DBE8B' : '#E3D6C8',
                    boxShadow: current ? '0 0 0 4px #D6F5E6' : 'none',
                  }}
                >
                  {done ? '✓' : ''}
                </span>
                <span className="text-[13px]" style={{ color: current ? '#0F3D2E' : '#8A7B76', fontWeight: current ? 600 : 400 }}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const CIRCLE = {
  active: { bg: '#FFFFFF', bd: '#3DBE8B', fg: '#0F3D2E' },
  done: { bg: '#3DBE8B', bd: '#3DBE8B', fg: '#0F3D2E' },
  locked: { bg: '#F1ECE6', bd: '#F1ECE6', fg: '#A1948D' },
};

function Step({ n, state, vine, title, extra, children }) {
  const c = CIRCLE[state];
  return (
    <div className="flex gap-3">
      <div className="flex w-8 flex-none flex-col items-center">
        <div className="box-border flex size-8 items-center justify-center rounded-full border-2 text-[15px] font-medium"
          style={{ background: c.bg, borderColor: c.bd, color: c.fg }}>
          {state === 'done' ? '✓' : n}
        </div>
        {vine && <div className="my-1.5 w-0 flex-1" style={{ borderLeft: `3px dotted ${vine}` }} />}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${n === 1 ? 'gap-[10px]' : 'gap-2'} ${vine ? 'pb-[22px]' : ''}`}>
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <div className="text-base font-semibold">{title}</div>
          {extra}
        </div>
        {children}
      </div>
    </div>
  );
}

function DoneRow({ title, time, leaf }) {
  return (
    <div className="box-border flex min-h-16 items-center gap-3 rounded-[14px] border-[1.5px] border-leaf bg-mint px-[14px] py-3">
      <div className="flex size-7 flex-none items-center justify-center rounded-[9px] bg-leaf"><CheckIcon /></div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold text-forest">{title}</div>
        <div className="text-[13px] text-mint-ink">{time}</div>
      </div>
      <LeafIcon color={leaf} />
    </div>
  );
}

function PendingDocRow({ name, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="box-border flex min-h-16 w-full items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-[#D9CBBE] bg-white px-[14px] py-3 text-left">
      <span className="box-border size-7 flex-none rounded-[9px] border-2 border-[#C9BAAE]" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">ทำ {name} แล้ว</span>
        <span className="block text-[13px] text-muted">กดเมื่อทำเสร็จ</span>
      </span>
      <ChevronRightIcon />
    </button>
  );
}

function Locked({ label, hint }) {
  return (
    <>
      <div className="btn btn-locked h-12">🔒 {label}</div>
      <div className="hint">{hint}</div>
    </>
  );
}

function UnlockedNote({ children }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[14px] border-[1.5px] border-leaf bg-white px-[14px] py-3 text-base leading-normal text-forest">
      <span data-anim="nudge" className="mt-0.5 flex-none"><ArrowDownIcon /></span>
      <div>{children}</div>
    </div>
  );
}

export function StepsCard({ progress, events, onPickDoc }) {
  const both = docsComplete(progress);
  const submitted = isSubmitted(progress);
  const confirmed = isConfirmed(progress);
  const at = (name) => formatThaiDateTime(eventTime(events, name));

  return (
    <section data-anim="rise" data-anim-delay="120" className="card p-5">
      <h2 className="title-section mb-4">สถานะการเตรียมตัวฝึกงาน</h2>

      <Step n={1} state={both ? 'done' : 'active'} vine="#9EDDC2" title="เตรียมเอกสาร"
        extra={<span className="rounded-full border border-dash bg-cream px-[10px] py-px text-[13px] text-muted">ทำได้ตามลำดับใดก็ได้</span>}>
        {DOCS.map((d) =>
          progress[d.flag]
            ? <DoneRow key={d.name} title={`ทำ ${d.name} แล้ว`} time={at(d.event)} leaf={d.leaf} />
            : <PendingDocRow key={d.name} name={d.name} onClick={() => onPickDoc(d.action)} />
        )}
      </Step>

      <Step n={2} state={submitted ? 'done' : both ? 'active' : 'locked'} vine={submitted ? '#9EDDC2' : '#E3D6C8'} title="ยื่นสมัครฝึกงาน">
        {submitted ? (
          <DoneRow title="ยื่นแล้ว" time={at('APPLICATIONS_SUBMITTED')} leaf="#FFD66B" />
        ) : both ? (
          <UnlockedNote>ปลดล็อกแล้ว! กด “ยื่นแล้ว” ด้านล่างเมื่อส่งใบสมัคร</UnlockedNote>
        ) : (
          <Locked label="ยื่นแล้ว" hint={lockedSubmitHint(progress)} />
        )}
      </Step>

      <Step n={3} state={confirmed ? 'done' : submitted ? 'active' : 'locked'} title="ยืนยันที่ฝึกงาน">
        {confirmed ? (
          <DoneRow title="ยืนยันที่ฝึกงานแล้ว" time={at('INTERNSHIP_CONFIRMED')} leaf="#86D9AE" />
        ) : submitted ? (
          <UnlockedNote>ได้ที่ฝึกงานแล้ว? กด “ยืนยันที่ฝึกงาน” ด้านล่าง</UnlockedNote>
        ) : (
          <Locked label="ยืนยันที่ฝึกงานแล้ว" hint="ต้องยื่นสมัครก่อน" />
        )}
      </Step>

      <div className="mt-[18px] flex items-center gap-2 rounded-xl bg-cream px-3 py-[10px] text-[13px] text-muted">
        <InfoIcon />
        <div>ทุกขั้นตอนบันทึกเวลาไว้ และย้อนกลับไม่ได้</div>
      </div>
    </section>
  );
}

export function HistoryCard({ events }) {
  const rows = historyFor(events);
  return (
    <section data-anim="rise" data-anim-delay="240" className="card p-5">
      <h2 className="title-section mb-4">ประวัติของฉัน</h2>
      <ol>
        {rows.map((h, i) => {
          const next = rows[i + 1];
          return (
            <li key={h.event} className="flex gap-3" style={{ opacity: h.done ? 1 : 0.55 }}>
              <div className="flex w-6 flex-none flex-col items-center">
                {h.done ? <LeafIcon color="#86D9AE" /> : <span className="m-0.5 box-border size-5 flex-none rounded-full border-2 border-dashed border-[#C9BAAE]" />}
                {next && <span className="my-1 w-0 flex-1" style={{ borderLeft: `2.5px ${next.done ? 'solid' : 'dashed'} #CFE9DC` }} />}
              </div>
              <div className="min-w-0 flex-1 pb-[18px]">
                <div className="text-base leading-6 font-semibold">{h.title}</div>
                <div className="mt-0.5 text-[13px] text-muted">{h.time ?? 'ยังไม่ถึงขั้นนี้'}</div>
                {h.note && <span className="mt-1.5 inline-flex rounded-full bg-sand px-[10px] py-0.5 text-[13px] text-muted-strong">{h.note}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** White bar pinned above the tab bar (3c). */
export function StickyActionBar({ hint, label, icon, onClick }) {
  return (
    <div className="fixed inset-x-0 z-30 mx-auto flex max-w-[430px] flex-col gap-1.5 border-t border-line-soft bg-white px-4 pt-[10px] pb-3 shadow-[var(--shadow-bar)]"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <p className="hint text-center">{hint}</p>
      <button type="button" className="btn btn-primary" onClick={onClick}>{icon}{label}</button>
    </div>
  );
}
