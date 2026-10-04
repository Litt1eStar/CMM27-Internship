import { useEffect, useState } from 'react';
import CompanyCard from '../components/CompanyCard';
import CompanyFilterBar from '../components/CompanyFilterBar';
import CompanyFormModal from '../components/CompanyFormModal';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorText } from '../lib/constants';

export default function CompaniesPage() {
  const { profile } = useAuth();
  const isStudent = profile.role === 'STUDENT';
  const isAdvisor = profile.role === 'ADVISOR';

  const [businessTypes, setBusinessTypes] = useState([]);
  const [filters, setFilters] = useState({ q: '', types: [], mode: 'ALL', source: 'ALL' });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit

  useEffect(() => {
    api.businessTypes().then((res) => setBusinessTypes(res.data)).catch((err) => setError(errorText(err)));
  }, []);

  // Real-time search: debounce typing, refetch whenever a filter changes.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .companies({
          q: filters.q.trim(),
          types: filters.types.join(','),
          mode: filters.mode,
          source: filters.source,
        })
        .then((res) => {
          setCompanies(res.data);
          setError(null);
        })
        .catch((err) => setError(errorText(err)))
        .finally(() => setLoading(false));
    }, filters.q ? 250 : 0);
    return () => clearTimeout(t);
  }, [filters]);

  function handleSaved(saved) {
    setCompanies((list) => {
      const exists = list.some((c) => c.id === saved.id);
      const next = exists ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setEditing(undefined);
  }

  async function handleDelete(company) {
    if (!window.confirm(`ลบ “${company.name}” ออกจากทำเนียบ?`)) return;
    try {
      await api.deleteCompany(company.id);
      setCompanies((list) => list.filter((c) => c.id !== company.id));
    } catch (err) {
      window.alert(errorText(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ทำเนียบบริษัท</h1>
          <p className="text-sm text-ink-soft">ข้อมูลบริษัทที่เพื่อนในรุ่นรวบรวมไว้ ทั้งจากประสบการณ์รุ่นพี่และที่ค้นหาเอง</p>
        </div>
        {isStudent && (
          <button type="button" className="btn-primary" onClick={() => setEditing(null)}>
            + เพิ่มบริษัท
          </button>
        )}
      </div>

      <CompanyFilterBar
        businessTypes={businessTypes}
        filters={filters}
        onChange={setFilters}
        resultCount={companies.length}
      />

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading && companies.length === 0 ? (
        <p className="py-12 text-center text-ink-soft">กำลังโหลด…</p>
      ) : companies.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="font-medium">ไม่พบบริษัทที่ตรงกับตัวกรอง</p>
          {isStudent && <p className="mt-1 text-sm text-ink-soft">รู้จักบริษัทที่น่าสนใจ? เพิ่มให้เพื่อน ๆ ได้เลย</p>}
        </div>
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {companies.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              canEdit={isAdvisor || c.created_by === profile.id}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CompanyFormModal
        open={editing !== undefined}
        company={editing}
        businessTypes={businessTypes}
        onClose={() => setEditing(undefined)}
        onSaved={handleSaved}
      />
    </div>
  );
}
