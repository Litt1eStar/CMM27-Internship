import { SOURCES, WORK_MODES } from '../lib/constants';

/**
 * filters = { q, types: number[], mode: 'ALL'|..., source: 'ALL'|... }
 */
export default function CompanyFilterBar({ businessTypes, filters, onChange, resultCount }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  const toggleType = (id) =>
    set({
      types: filters.types.includes(id) ? filters.types.filter((t) => t !== id) : [...filters.types, id],
    });

  const hasFilters = filters.q || filters.types.length || filters.mode !== 'ALL' || filters.source !== 'ALL';

  return (
    <section className="card space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-ink-soft">⌕</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="ค้นหาชื่อบริษัท…"
            className="input pl-8"
            aria-label="ค้นหาชื่อบริษัท"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-soft">รูปแบบการฝึกงาน</span>
          <div role="radiogroup" aria-label="รูปแบบการฝึกงาน" className="inline-flex rounded-lg border border-line bg-paper p-0.5">
            {[{ value: 'ALL', label: 'ทั้งหมด' }, ...WORK_MODES].map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={filters.mode === m.value}
                onClick={() => set({ mode: m.value })}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  filters.mode === m.value ? 'bg-ink text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">ประเภทธุรกิจ</span>
          {filters.types.length > 0 && (
            <button type="button" onClick={() => set({ types: [] })} className="text-xs text-ink-soft hover:underline">
              ล้างประเภท ({filters.types.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {businessTypes.map((t) => {
            const active = filters.types.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleType(t.id)}
                className={`chip ${active ? 'chip-active' : ''}`}
              >
                {t.name_th}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">แหล่งข้อมูล</span>
          {[{ value: 'ALL', label: 'ทั้งหมด' }, ...SOURCES].map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={filters.source === s.value}
              onClick={() => set({ source: s.value })}
              className={`chip ${filters.source === s.value ? 'chip-active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-soft">
          <span>พบ {resultCount} บริษัท</span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => onChange({ q: '', types: [], mode: 'ALL', source: 'ALL' })}
              className="font-medium text-ink hover:underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
