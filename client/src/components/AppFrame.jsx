import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { routeCommitted } from '../lib/transitions';
import MusicButton from './MusicButton';
import TabBar from './TabBar';

/** The phone-width column every screen lives in. tabs = 'student' | 'advisor' | undefined. */
export default function AppFrame({ tabs, children }) {
  const location = useLocation();
  useLayoutEffect(() => {
    routeCommitted();
  }, [location.key]);

  return (
    <div className="app-surface relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col pt-[env(safe-area-inset-top)]">
      <main className={`flex-1 ${tabs ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : ''}`}>{children}</main>
      {tabs && <TabBar role={tabs} />}
      <MusicButton />
    </div>
  );
}
