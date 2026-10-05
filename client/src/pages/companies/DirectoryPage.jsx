import { useCallback, useEffect, useState } from 'react';
import Sprout from '../../components/Sprout';
import { SkeletonCards } from '../../components/Skeleton';
import { FilterIcon, SearchIcon, Sparkle } from '../../components/Icons';
import { Chip, ErrorBanner, Fab } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { EMPTY_FILTERS, MODES, directoryQuery, hasAnyFilter, sheetFilterCount } from '../../lib/companies';
import { errorText } from '../../lib/errors';
import CompanyCard from './CompanyCard';
import CompanyFilterSheet from './CompanyFilterSheet';
import CompanyFormSheet from './CompanyFormSheet';
import DeleteCompanySheet from './DeleteCompanySheet';

function EmptyState({ filtered, onAdd }) {
  return (
    <div data-anim="rise" className="card relative mx-4 mt-3 flex flex-col items-center gap-[10px] overflow-hidden px-6 py-8 text-center">
      <Sparkle size={16} className="absolute top-4 right-[18px]" />
      <div className="mb-1.5 flex size-[150px] items-center justify-center rounded-full bg-cream">
        <Sprout stage="both" hold="glass" size={124} />
      </div>
      <h2 className="text-lg leading-[1.4] font-medium">{filtered ? 'ไม่พบบริษัทที่ตรงกับตัวกรอง' : 'ยังไม่มีบริษัทในทำเนียบ'}</h2>
      <p className="text-base leading-normal text-pretty text-muted">รู้จักบริษัทที่น่าสนใจ? เพิ่มให้เพื่อน ๆ ได้เลย</p>
      <button type="button" onClick={onAdd} className="btn btn-primary mt-[10px] w-auto px-7">+ เพิ่มบริษัท</button>
    </div>
  );
}

export default function DirectoryPage() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState(null);
  const [types, setTypes] = useState([]);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null); // { kind: 'filter' } | { kind: 'form', company? } | { kind: 'delete', company }

  useEffect(() => {
    api.businessTypes().then((r) => setTypes(r.data)).catch((err) => setError(errorText(err)));
  }, []);

  // Typing updates the list after a short pause.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search ? f : { ...f, q: search })), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const r = await api.companies(directoryQuery(filters));
      setCompanies(r.data);
      setError(null);
    } catch (err) {
      setError(errorText(err));
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const badge = sheetFilterCount(filters);
  const filtered = hasAnyFilter(filters);
  const clearAll = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };
  const closeAndReload = () => {
    setSheet(null);
    load();
  };

  return (
    <>
      <header className="px-4 pt-2 pb-3">
        <h1 className="title-sheet">ทำเนียบบริษัท</h1>
        <p className="mt-1 text-[13px] leading-[1.55] text-pretty text-muted">
          ข้อมูลบริษัทที่เพื่อนในรุ่นรวบรวมไว้ ทั้งจากประสบการณ์รุ่นพี่และที่ค้นหาเอง
        </p>
      </header>

      <div className="glass sticky top-0 z-20 flex flex-col gap-[10px] px-4 pt-1 pb-3">
        <div className="flex gap-2">
          <label className="box-border flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-white px-[14px] focus-within:border-2 focus-within:border-leaf focus-within:shadow-[0_0_0_4px_#D6F5E6]">
            <SearchIcon />
            <input
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
              placeholder="ค้นหาชื่อบริษัท…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={() => setSheet({ kind: 'filter' })}
            className="box-border flex h-12 flex-none items-center gap-1.5 rounded-[14px] border-[1.5px] border-line bg-white px-3 text-base font-semibold">
            <FilterIcon />
            ตัวกรอง
            {badge > 0 && (
              <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-[11px] bg-leaf text-[13px] font-bold text-forest">{badge}</span>
            )}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip className="h-11 flex-none px-4" selected={filters.mode === 'ALL'} onClick={() => setFilters((f) => ({ ...f, mode: 'ALL' }))}>
            ทั้งหมด
          </Chip>
          {MODES.map((m) => (
            <Chip key={m.value} className="h-11 flex-none px-4" selected={filters.mode === m.value}
              onClick={() => setFilters((f) => ({ ...f, mode: m.value }))}>
              <span className="size-[10px] rounded-full" style={{ background: m.dot }} />
              {m.label}
            </Chip>
          ))}
        </div>
      </div>

      {error && <div className="px-4 pb-3"><ErrorBanner>{error}</ErrorBanner></div>}

      {companies === null ? (
        !error && <div className="px-4"><SkeletonCards count={4} height={132} /></div>
      ) : companies.length === 0 ? (
        <EmptyState filtered={filtered} onAdd={() => setSheet({ kind: 'form' })} />
      ) : (
        <>
          <div className="flex items-center gap-1.5 px-4 pb-3 text-[13px] text-muted">
            <span>พบ {companies.length} บริษัท</span>
            {filtered && (
              <>
                <span>·</span>
                <button type="button" onClick={clearAll} className="font-semibold text-link underline">ล้างตัวกรองทั้งหมด</button>
              </>
            )}
          </div>
          <div className="flex flex-col gap-3 px-4 pb-[120px]">
            {companies.map((c, i) => (
              <CompanyCard
                key={c.id}
                company={c}
                delay={80 + Math.min(i, 6) * 90}
                editable={c.created_by === profile.id}
                onEdit={() => setSheet({ kind: 'form', company: c })}
                onDelete={() => setSheet({ kind: 'delete', company: c })}
              />
            ))}
          </div>
        </>
      )}

      {sheet?.kind === 'filter' && (
        <CompanyFilterSheet filters={filters} types={types} onClose={() => setSheet(null)}
          onApply={(f) => { setFilters(f); setSheet(null); }} />
      )}
      {sheet?.kind === 'form' && (
        <CompanyFormSheet key={sheet.company?.id ?? 'new'} company={sheet.company} types={types}
          onClose={() => setSheet(null)} onSaved={closeAndReload} />
      )}
      {sheet?.kind === 'delete' && (
        <DeleteCompanySheet company={sheet.company} onClose={() => setSheet(null)} onDeleted={closeAndReload} />
      )}
      <Fab label="เพิ่มบริษัท" onClick={() => setSheet({ kind: 'form' })} />
    </>
  );
}
