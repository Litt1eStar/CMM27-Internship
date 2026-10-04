import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import LinkStudentPage from './pages/LinkStudentPage';
import StudentProgressPage from './pages/StudentProgressPage';
import CompaniesPage from './pages/CompaniesPage';
import AdvisorDashboardPage from './pages/AdvisorDashboardPage';

export default function App() {
  const { state, profile } = useAuth();

  if (state === 'loading') {
    return <div className="grid min-h-screen place-items-center text-ink-soft">กำลังโหลด…</div>;
  }
  if (state === 'signedOut') return <LoginPage />;
  if (state === 'needsLink') return <LinkStudentPage />;

  const isAdvisor = profile.role === 'ADVISOR';

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          {isAdvisor ? (
            <Route path="/" element={<AdvisorDashboardPage />} />
          ) : (
            <Route path="/" element={<StudentProgressPage />} />
          )}
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
