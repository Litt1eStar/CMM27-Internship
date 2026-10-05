import { useEffect, useState } from 'react';
import Sheet from '../../components/Sheet';
import { Chip } from '../../components/ui';
import { api } from '../../lib/api';
import { DOC_FILTERS, rosterQuery } from '../../lib/roster';
import { STATUS, STATUS_ORDER } from '../../lib/status';

const STATUS_CHIPS = [{ value: 'ALL', label: 'ทั้งหมด' }, ...STATUS_ORDER.map((k) => ({ value: k, label: STATUS[k].label }))];

function Group({ title, options, value, onChange }) {
  return (
    <section>
      <h3 className="title-section mb-[10px]">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} selected={value === o.value} onClick={() => onChange(o.value)}>{o.label}</Chip>
        ))}
      </div>
    </section>
  );
}

export default function RosterFilterSheet({ filters, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState(null);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    let live = true;
    setCount(null);
    const t = setTimeout(async () => {
      try {
        const r = await api.roster(rosterQuery(draft));
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

  return (
    <Sheet
      open
      onClose={onClose}
      label="ตัวกรอง"
      footer={
        <div className="grid grid-cols-[1fr_1.6fr] gap-[10px]">
          <button type="button" className="btn btn-secondary"
            onClick={() => setDraft((d) => ({ ...d, status: 'ALL', resume: 'ALL', portfolio: 'ALL' }))}>ล้าง</button>
          <button type="button" className="btn btn-primary" onClick={() => onApply(draft)}>
            {count === null ? 'แสดงผล' : `แสดง ${count} คน`}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-[18px] pb-3">
        <h2 className="title-sheet">ตัวกรอง</h2>
        <Group title="สถานะ" options={STATUS_CHIPS} value={draft.status} onChange={set('status')} />
        <Group title="Resume" options={DOC_FILTERS} value={draft.resume} onChange={set('resume')} />
        <Group title="Portfolio" options={DOC_FILTERS} value={draft.portfolio} onChange={set('portfolio')} />
      </div>
    </Sheet>
  );
}
