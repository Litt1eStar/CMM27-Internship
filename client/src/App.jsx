import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './lib/auth';
import AppFrame from './components/AppFrame';
import SeedLoader from './components/SeedLoader';
import LoginPage from './pages/LoginPage';
import LinkStudentPage from './pages/LinkStudentPage';
import ProfilePage from './pages/ProfilePage';
import StudentHomePage from './pages/student/StudentHomePage';
import DirectoryPage from './pages/companies/DirectoryPage';
import AdvisorHomePage from './pages/advisor/AdvisorHomePage';
import StudentDetailPage from './pages/advisor/StudentDetailPage';

// Boot screen: the growing-seed loader on the app background.
function Splash() {
  return (
    <div className="app-surface mx-auto flex min-h-dvh max-w-[430px] items-center justify-center">
      <SeedLoader />
    </div>
  );
}

export default function App() {
  const { state, profile } = useAuth();

  if (state === 'loading') return <Splash />;
  if (state === 'signedOut') return <LoginPage />;
  if (state === 'needsLink') return <LinkStudentPage />;

  if (profile.role === 'ADVISOR') {
    return (
      <Routes>
        <Route path="/" element={<AppFrame tabs="advisor"><AdvisorHomePage /></AppFrame>} />
        <Route path="/students/:id" element={<AppFrame><StudentDetailPage /></AppFrame>} />
        <Route path="/me" element={<AppFrame tabs="advisor"><ProfilePage /></AppFrame>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppFrame tabs="student"><StudentHomePage /></AppFrame>} />
      <Route path="/companies" element={<AppFrame tabs="student"><DirectoryPage /></AppFrame>} />
      <Route path="/me" element={<AppFrame tabs="student"><ProfilePage /></AppFrame>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
