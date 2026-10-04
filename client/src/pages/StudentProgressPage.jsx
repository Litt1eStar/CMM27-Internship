import { useCallback, useEffect, useState } from 'react';
import StatusChecklist from '../components/StatusChecklist';
import Timeline from '../components/Timeline';
import { api } from '../lib/api';
import { errorText } from '../lib/constants';

export default function StudentProgressPage() {
  const [progress, setProgress] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.myProgress(), api.myTimeline()]);
      setProgress(p.data);
      setTimeline(t.data);
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(action, companyId) {
    const res = await api.applyAction(action, companyId);
    setProgress(res.data);
    const t = await api.myTimeline();
    setTimeline(t.data);
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>;
  if (!progress) return <p className="text-ink-soft">กำลังโหลด…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <StatusChecklist progress={progress} timeline={timeline} onAction={handleAction} />
      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold">ประวัติของฉัน</h2>
        <Timeline events={timeline} />
      </section>
    </div>
  );
}
