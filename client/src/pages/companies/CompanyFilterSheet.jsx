import { useEffect, useState } from 'react';
import Sheet from '../../components/Sheet';
import { Chip } from '../../components/ui';
import { api } from '../../lib/api';
import { SOURCES, directoryQuery } from '../../lib/companies';

export default function CompanyFilterSheet({ filters, types, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState(null);

  // Live "แสดง N บริษัท" for the filters being chosen.
  useEffect(() => {
    let live = true;
    setCount(null);
    const t = setTimeout(async () => {
      try {
        const r = await api.companies(directoryQuery(draft));
        if (live) setCount(r.data.length);
      } catch {
        /* the button falls back to a plain label */
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [draft]);

  const toggleType = (id) =>
    setDraft((d) => ({ ...d, types: d.types.includes(id) ? d.types.filter((x) => x !== id) : [...d.types, id] }));

  return (
    <Sheet
      open
      onClose={onClose}
      label="ตัวกรอง"
      footer={
        <div className="grid grid-cols-[1fr_1.6fr] gap-[10px]">
          <button type="button" className="btn btn-secondary" onClick={() => setDraft((d) => ({ ...d, types: [], source: 'ALL' }))}>ล้าง</button>
          <button type="button" className="btn btn-primary" onClick={() => onApply(draft)}>
            {count === null ? 'แสดงผล' : `แสดง ${count} บริษัท`}
          </button>
        </div>
      }
    >
      <h2 className="title-sheet">ตัวกรอง</h2>
      <section className="mt-[18px]">
        <div className="mb-[10px] flex items-baseline justify-between">
          <h3 className="title-section">ประเภทธุรกิจ</h3>
          {draft.types.length > 0 && <span className="hint">เลือกแล้ว {draft.types.length}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <Chip key={t.id} selected={draft.types.includes(t.id)} onClick={() => toggleType(t.id)}>{t.name_th}</Chip>
          ))}
        </div>
      </section>
      <section className="mt-[18px] pb-1">
        <h3 className="title-section mb-[10px]">ที่มาของข้อมูล</h3>
        <div className="flex flex-wrap gap-2">
          {[{ value: 'ALL', label: 'ทั้งหมด' }, ...SOURCES].map((s) => (
            <Chip key={s.value} selected={draft.source === s.value} onClick={() => setDraft((d) => ({ ...d, source: s.value }))}>{s.label}</Chip>
          ))}
        </div>
      </section>
    </Sheet>
  );
}
