import { useSyncExternalStore } from 'react';
import { MusicIcon, MusicOffIcon } from './Icons';
import { music } from '../lib/music';

const snapshot = () => (music.enabled() ? (music.playing() ? 'playing' : 'on') : 'off');

/**
 * Small round mute button at the top-right of the page. It scrolls away with the header, so it never
 * covers the sticky search bars; the Profile switch is always there too.
 */
export default function MusicButton() {
  const state = useSyncExternalStore(music.subscribe, snapshot);
  const on = state !== 'off';
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-end px-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}>
      <button type="button" aria-pressed={on} aria-label={on ? 'ปิดเพลงพื้นหลัง' : 'เปิดเพลงพื้นหลัง'}
        onClick={() => music.setEnabled(!on)}
        className={`press glass-white pointer-events-auto flex size-10 items-center justify-center rounded-full shadow-[0_0_0_1.5px_rgba(190,170,255,.35),0_8px_18px_-8px_rgba(106,75,234,.45)] ${on ? '' : 'opacity-80'}`}>
        <span data-anim={state === 'playing' ? 'bob' : undefined} className="flex">
          {on ? <MusicIcon /> : <MusicOffIcon />}
        </span>
      </button>
    </div>
  );
}
