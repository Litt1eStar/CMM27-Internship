import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const isAdvisor = profile.role === 'ADVISOR';

  const link = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-gray-100 hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="mr-4 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-xs font-bold text-white">CMM</div>
          <span className="hidden font-semibold sm:inline">Internship Tracker</span>
        </div>

        <nav className="flex flex-1 items-center gap-1">
          <NavLink to="/" end className={link}>
            {isAdvisor ? 'ภาพรวมนักศึกษา' : 'ความคืบหน้าของฉัน'}
          </NavLink>
          <NavLink to="/companies" className={link}>
            ทำเนียบบริษัท
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{profile.full_name || profile.email}</div>
            <div className="text-xs text-ink-soft">
              {isAdvisor ? 'อาจารย์ที่ปรึกษา' : profile.student_id}
            </div>
          </div>
          <button type="button" onClick={signOut} className="btn-secondary px-3 py-1.5">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
