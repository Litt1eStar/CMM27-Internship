import { NavLink } from 'react-router';
import { TabBuildingIcon, TabGardenIcon, TabPersonIcon, TabSproutIcon } from './Icons';

const TABS = {
  student: [
    { to: '/', label: 'ความคืบหน้า', Icon: TabSproutIcon, end: true },
    { to: '/companies', label: 'บริษัท', Icon: TabBuildingIcon },
    { to: '/me', label: 'ฉัน', Icon: TabPersonIcon },
  ],
  advisor: [
    { to: '/', label: 'ภาพรวม', Icon: TabGardenIcon, end: true },
    { to: '/me', label: 'ฉัน', Icon: TabPersonIcon },
  ],
};

export default function TabBar({ role }) {
  const tabs = TABS[role];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[430px] border-t border-line-soft glass-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(120,80,40,.06)]"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="flex h-16 flex-col items-center justify-center gap-[3px]">
          {({ isActive }) => (
            <>
              <span
                data-anim={isActive ? 'pop' : ''}
                className="flex h-8 w-[60px] items-center justify-center rounded-2xl"
                style={{ background: isActive ? '#3DBE8B' : 'transparent' }}
              >
                <Icon color={isActive ? '#0F3D2E' : '#8A7B76'} />
              </span>
              <span className="text-[13px] leading-4" style={{ color: isActive ? '#0F3D2E' : '#8A7B76', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
