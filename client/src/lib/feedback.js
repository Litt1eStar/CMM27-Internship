// Haptics and sounds for key moments. Sound is off until the user turns it on (Profile),
// and the choice is a per-device convenience kept in localStorage.
import pop from '../assets/sfx/pop.wav';
import chime from '../assets/sfx/chime.wav';
import rustle from '../assets/sfx/rustle.wav';
import { safeLocalStorage } from './storage';

const KEY = 'cmm.sound';
const PATTERNS = { tick: 10, success: [14, 50, 22], error: [40, 60, 40] };

/** Testable core: storage, vibrate and play are injected. */
export function createFeedback({ storage, vibrate = null, play = null }) {
  const soundEnabled = () => {
    try {
      return storage?.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  };
  return {
    soundEnabled,
    setSoundEnabled(on) {
      try {
        storage?.setItem(KEY, on ? 'on' : 'off');
      } catch {
        /* blocked storage: the setting just isn't remembered */
      }
    },
    haptic(kind) {
      const pattern = PATTERNS[kind];
      if (pattern === undefined || !vibrate) return;
      try {
        vibrate(pattern);
      } catch {
        /* some browsers refuse vibration without a user gesture */
      }
    },
    sound(kind) {
      if (soundEnabled()) play?.(kind);
    },
  };
}

const FILES = { tick: pop, success: chime, grow: rustle };
const cache = {};

function playFile(kind) {
  const src = FILES[kind];
  if (!src || typeof Audio === 'undefined') return;
  const audio = (cache[kind] ??= new Audio(src));
  audio.volume = 0.75;
  audio.currentTime = 0;
  audio.play().catch(() => {}); // autoplay rules or no output device: stay silent
}

export const feedback = createFeedback({
  storage: safeLocalStorage(),
  vibrate: typeof navigator !== 'undefined' && navigator.vibrate ? (p) => navigator.vibrate(p) : null,
  play: playFile,
});
