function Svg({ size = 20, color = 'currentColor', width = 2.2, children, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round', flex: 'none', ...style }}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p) => <Svg color="#8A7B76" {...p}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5 L21 21" /></Svg>;
export const FilterIcon = (p) => <Svg color="#3B2F2F" {...p}><path d="M4 7 L20 7 M7 12 L17 12 M10 17 L14 17" /></Svg>;
export const CloseIcon = (p) => <Svg color="#3B2F2F" width={2.4} {...p}><path d="M6 6 L18 18 M18 6 L6 18" /></Svg>;
export const ChevronDownIcon = (p) => <Svg color="#8A7B76" {...p}><path d="M6 9 L12 15 L18 9" /></Svg>;
export const ChevronRightIcon = (p) => <Svg color="#C9BAAE" {...p}><path d="M9 6 L15 12 L9 18" /></Svg>;
export const BackIcon = (p) => <Svg size={24} color="#3B2F2F" width={2.4} {...p}><path d="M15 5 L8 12 L15 19" /></Svg>;
export const GlobeIcon = (p) => <Svg size={18} color="#1E7A57" width={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12 L21 12 M12 3 C15 6 15 18 12 21 M12 3 C9 6 9 18 12 21" /></Svg>;
export const EditIcon = (p) => <Svg size={16} color="#3B2F2F" {...p}><path d="M4 20 L8 20 L19 9 L15 5 L4 16 Z" /></Svg>;
export const TrashIcon = (p) => <Svg size={16} color="#B42318" {...p}><path d="M4 7 L20 7 M9 7 L9 4 L15 4 L15 7 M6 7 L7 20 L17 20 L18 7" /></Svg>;
export const SendIcon = (p) => <Svg color="#0F3D2E" {...p}><path d="M21 3 L10 14 M21 3 L14 21 L10 14 L3 10 Z" /></Svg>;
export const LogoutIcon = (p) => <Svg size={22} color="#B42318" {...p}><path d="M14 4 L18 4 C19.1 4 20 4.9 20 6 L20 18 C20 19.1 19.1 20 18 20 L14 20 M10 16 L6 12 L10 8 M6 12 L16 12" /></Svg>;
export const SoundIcon = (p) => <Svg size={22} color="#3B2F2F" {...p}><path d="M4 9 L8 9 L13 5 L13 19 L8 15 L4 15 Z M16.5 9.5 C17.8 10.8 17.8 13.2 16.5 14.5 M19 7 C21.7 9.7 21.7 14.3 19 17" /></Svg>;
export const MusicIcon = (p) => <Svg size={20} color="#6A4BEA" {...p}><path d="M9 18 L9 5 L19 3 L19 16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></Svg>;
export const MusicOffIcon = (p) => <Svg size={20} color="#8A7B76" {...p}><path d="M9 18 L9 5 L19 3 L19 16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /><path d="M3 3 L21 21" /></Svg>;
export const WarningIcon = (p) => <Svg size={18} color="#8A5A00" {...p}><path d="M12 3 L22 20 L2 20 Z M12 10 L12 14 M12 17 L12 17.01" /></Svg>;
export const InfoIcon = (p) => <Svg size={18} color="#8A7B76" width={2} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11 L12 16 M12 8 L12 8.01" /></Svg>;
export const PlusIcon = (p) => <Svg size={22} color="#D6F5E6" width={2.8} {...p}><path d="M12 5 L12 19 M5 12 L19 12" /></Svg>;
export const ArrowDownIcon = (p) => <Svg color="#3DBE8B" width={2.4} {...p}><path d="M12 4 L12 19 M6 13 L12 19 L18 13" /></Svg>;

export function CheckIcon({ size = 16, color = '#0F3D2E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"
      style={{ fill: 'none', stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M3 8.5 L6.5 12 L13 4.5" />
    </svg>
  );
}

/** Four-point sparkle used as decoration (twinkles). */
export function Sparkle({ size = 16, color = '#FFD66B', className, style }) {
  return (
    <svg data-anim="twinkle" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={className} style={style}>
      <path d="M10 1 Q10 10 19 10 Q10 10 10 19 Q10 10 1 10 Q10 10 10 1 Z" style={{ fill: color }} />
    </svg>
  );
}

/** Solid leaf used as decoration. */
export function LeafDeco({ size = 26, color = '#D6F5E6', className, style, anim }) {
  return (
    <svg data-anim={anim} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} style={style}>
      <path d="M3 21 C3 11 9 5 21 3 C19 15 13 21 3 21 Z" style={{ fill: color }} />
    </svg>
  );
}

/** Outlined leaf marking a timeline step (StudentHome.dc / 5d). */
export function LeafIcon({ color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M4 20 C4 11 10 5 20 4 C19 14 13 20 4 20 Z" fill={color} style={{ stroke: '#2F5D4B', strokeWidth: 1.6, strokeLinejoin: 'round' }} />
      <path d="M4 20 L13 11" style={{ fill: 'none', stroke: '#2F5D4B', strokeWidth: 1.6, strokeLinecap: 'round' }} />
    </svg>
  );
}

// Tab bar icons (TabBar.dc)
export const TabSproutIcon = (p) => (
  <Svg size={24} width={2} {...p}>
    <path d="M12 21 L12 12" /><path d="M12 13 C8 13 5 10 5 6 C9 6 12 9 12 13 Z" /><path d="M12 11 C12 7.5 14.5 5 18.5 5 C18.5 8.5 16 11 12 11 Z" />
  </Svg>
);
export const TabGardenIcon = (p) => (
  <Svg size={24} width={2} {...p}>
    <path d="M3 20 L21 20" /><path d="M6.5 20 L6.5 15" /><path d="M6.5 15 C4.5 15 3 13.5 3 11.5 C5 11.5 6.5 13 6.5 15 Z" />
    <path d="M17.5 20 L17.5 15" /><path d="M17.5 15 C19.5 15 21 13.5 21 11.5 C19 11.5 17.5 13 17.5 15 Z" />
    <path d="M12 20 L12 11" /><circle cx="12" cy="7.5" r="3" />
  </Svg>
);
export const TabBuildingIcon = (p) => (
  <Svg size={24} width={2} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M9 7.5 L10 7.5 M14 7.5 L15 7.5 M9 11.5 L10 11.5 M14 11.5 L15 11.5" /><path d="M10 21 L10 16.5 L14 16.5 L14 21" />
  </Svg>
);
export const TabPersonIcon = (p) => (
  <Svg size={24} width={2} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21 C4 17 7.6 14 12 14 C16.4 14 20 17 20 21" /></Svg>
);
