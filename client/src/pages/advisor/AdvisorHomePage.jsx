import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Sprout from '../../components/Sprout';
import { Skeleton, SkeletonCards } from '../../components/Skeleton';
import { FilterIcon, SearchIcon } from '../../components/Icons';
import { CountUp, ErrorBanner, Fab } from '../../components/ui';
import { api } from '../../lib/api';
import { navigateWithTransition } from '../../lib/transitions';
import { errorText } from '../../lib/errors';
import { EMPTY_ROSTER, percent, rosterFilterCount, rosterQuery } from '../../lib/roster';
import { STATUS } from '../../lib/status';
import RosterFilterSheet from './RosterFilterSheet';
import StudentRow from './StudentRow';
import Toast from '../../components/Toast';
import AddStudentSheet from './AddStudentSheet';

const TILES = ['NOT_STARTED', 'RESUME_DONE', 'PORTFOLIO_DONE', 'APPLICATIONS_SUBMITTED'];

function Bar({ pct, color, fg, delay }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-white/80">
        <div data-anim="grow-x" data-anim-delay={delay} className="h-full rounded-[3px]" style={{ width: pct, background: color }} />
      </div>
      <div className="text-[13px]" style={{ color: fg }}>{pct}</div>
    </div>
  );
}

function GardenTile({ status, n, total, delay, selected, onClick }) {
  const s = STATUS[status];
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} data-anim="rise" data-anim-delay={delay}
      className="box-border flex min-h-[132px] flex-col gap-1.5 rounded-[20px] p-[14px] text-left"
      style={{ background: s.bg, boxShadow: selected ? '0 0 0 2.5px #8B7BFF' : 'none' }}>
      <div className="flex items-start justify-between">
        <div className="num-display pt-1 text-[34px] leading-none" style={{ color: s.fg }}><CountUp value={n} delay={delay} /></div>
        <div className="flex size-[50px] items-center justify-center rounded-2xl bg-white/75"><Sprout stage={s.stage} size={44} /></div>
      </div>
      <div className="mt-auto text-[13px] font-semibold" style={{ color: s.fg }}>{s.label}</div>
      <Bar pct={percent(n, total)} color={s.bar} fg={s.fg} delay={delay} />
    </button>
  );
}

function ConfirmedTile({ n, total, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} data-anim="rise" data-anim-delay="360"
      className="col-span-2 flex items-center gap-[14px] rounded-[20px] bg-mint p-[14px] text-left"
      style={{ boxShadow: selected ? '0 0 0 2.5px #8B7BFF' : 'none' }}>
      <div className="flex size-16 flex-none items-center justify-center rounded-[18px] bg-white/75"><Sprout stage="bloom" size={56} /></div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <div className="text-[13px] font-semibold text-mint-ink">ยืนยันที่ฝึกงาน</div>
          <div className="num-display text-[34px] leading-none text-mint-ink"><CountUp value={n} delay={360} /></div>
        </div>
        <Bar pct={percent(n, total)} color="#3DBE8B" fg="#146B48" delay={360} />
      </div>
    </button>
  );
}

function CountRow({ label, value, dashed }) {
  return (
    <div className={`flex h-11 items-center justify-between ${dashed ? 'border-b border-dashed border-dash' : ''}`}>
      <div className="text-base">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

export default function AdvisorHomePage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useState(EMPTY_ROSTER);
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState(null); // 'filter' | 'add'
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const clearToast = useCallback(() => setToast(null), []);

  const loadMetrics = useCallback(async () => {
    try {
      setMetrics((await api.metrics()).data);
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  const loadRoster = useCallback(async () => {
    try {
      setRows((await api.roster(rosterQuery(filters))).data);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [filters]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);
  useEffect(() => {
    loadRoster();
  }, [loadRoster]);
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search ? f : { ...f, q: search })), 250);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = (k) => setFilters((f) => ({ ...f, status: f.status === k ? 'ALL' : k }));
  const badge = rosterFilterCount(filters);

  return (
    <>
      <h1 className="title-page flex h-14 items-center px-4">ภาพรวมนักศึกษา</h1>
      {error && <div className="px-4 pb-2"><ErrorBanner>{error}</ErrorBanner></div>}

      {metrics && (
        <>
          <p className="px-4 text-[13px] text-muted">
            นักศึกษาทั้งหมด {metrics.total} คน · เข้าสู่ระบบแล้ว {metrics.linked_accounts} คน
          </p>
          <section className="px-4 pt-[18px]">
            <div className="mb-[10px] flex items-baseline justify-between">
              <h2 className="title-section">สวนของรุ่น</h2>
              <span className="hint">แตะเพื่อกรอง</span>
            </div>
            <div className="grid grid-cols-2 gap-[10px]">
              {TILES.map((k, i) => (
                <GardenTile key={k} status={k} n={metrics.by_status[k]} total={metrics.total} delay={i * 90}
                  selected={filters.status === k} onClick={() => toggleStatus(k)} />
              ))}
              <ConfirmedTile n={metrics.by_status.INTERNSHIP_CONFIRMED} total={metrics.total}
                selected={filters.status === 'INTERNSHIP_CONFIRMED'} onClick={() => toggleStatus('INTERNSHIP_CONFIRMED')} />
            </div>
          </section>
          <div className="px-4 pt-3">
            <div className="card px-4 py-2">
              <CountRow label="ทำ Resume แล้ว (รวม)" value={metrics.resume_done} dashed />
              <CountRow label="ทำ Portfolio แล้ว (รวม)" value={metrics.portfolio_done} />
              <div className="-mx-2 mb-1 flex h-12 items-center justify-between rounded-xl bg-warn-soft px-2 text-warn-ink">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <span className="size-2 rounded-full bg-[#F2C24B]" />เอกสารครบ แต่ยังไม่ยื่น
                </div>
                <div className="text-lg font-medium">{metrics.ready_to_apply}</div>
              </div>
            </div>
          </div>
        </>
      )}
      {!metrics && !error && (
        <div role="status" aria-label="กำลังโหลด…" className="grid grid-cols-2 gap-[10px] px-4 pt-[18px]">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px] rounded-[20px]" />)}
          <Skeleton className="col-span-2 h-[92px] rounded-[20px]" />
        </div>
      )}

      <div className="glass sticky top-0 z-20 flex gap-2 px-4 pt-4 pb-3">
        <label className="box-border flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-white px-[14px] focus-within:border-2 focus-within:border-leaf focus-within:shadow-[0_0_0_4px_#D6F5E6]">
          <SearchIcon />
          <input className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
            placeholder="ค้นหารหัสหรือชื่อนักศึกษา…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <button type="button" onClick={() => setSheet('filter')}
          className="box-border flex h-12 flex-none items-center gap-1.5 rounded-[14px] border-[1.5px] border-line bg-white px-3 text-base font-semibold">
          <FilterIcon />
          ตัวกรอง
          {badge > 0 && <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] bg-bloom text-[13px] font-bold text-white">{badge}</span>}
        </button>
      </div>

      <div className="flex items-baseline justify-between px-4 pb-[10px]">
        <h2 className="title-section">รายชื่อนักศึกษา</h2>
        {rows && <span className="hint">{rows.length} คน</span>}
      </div>
      <div className="flex flex-col gap-[10px] px-4 pb-[120px]">
        {rows === null && !error && <SkeletonCards count={4} height={108} />}
        {rows?.map((row, i) => (
          <StudentRow key={row.id} row={row} delay={200 + Math.min(i, 6) * 80} onClick={() => navigateWithTransition(navigate, `/students/${row.id}`)} />
        ))}
      </div>

      <Fab label="เพิ่มนักศึกษา" onClick={() => setSheet('add')} />
      {sheet === 'filter' && (
        <RosterFilterSheet filters={filters} onClose={() => setSheet(null)} onApply={(f) => { setFilters(f); setSheet(null); }} />
      )}
      {sheet === 'add' && (
        <AddStudentSheet
          onClose={() => setSheet(null)}
          onAdded={(sid) => {
            setSheet(null);
            loadMetrics();
            loadRoster();
            setToast({ id: Date.now(), title: `เพิ่ม ${sid} ในรายชื่อแล้ว`, stage: 'seed' });
          }}
        />
      )}
      <Toast toast={toast} onDone={clearToast} bottom="calc(64px + env(safe-area-inset-bottom) + 88px)" />
    </>
  );
}
