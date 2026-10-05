import TabBar from './TabBar';

/** The phone-width column every screen lives in. tabs = 'student' | 'advisor' | undefined. */
export default function AppFrame({ tabs, children }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-cream pt-[env(safe-area-inset-top)]">
      <main className={`flex-1 ${tabs ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : ''}`}>{children}</main>
      {tabs && <TabBar role={tabs} />}
    </div>
  );
}
