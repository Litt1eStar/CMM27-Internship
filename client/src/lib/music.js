// Cozy background music. On by default, but browsers only allow sound after the first tap, so it
// starts then. Pauses while the app is hidden. The on/off choice is a per-device convenience in
// localStorage, with an in-memory fallback so it can still be turned off where storage is blocked.
import track from '../assets/bgm/chillrightsmusic-cat-bag-382798.mp3';
import { safeLocalStorage } from './storage';

const KEY = 'cmm.music';
const VOLUME = 0.35;

/** Testable core: storage, makePlayer and isHidden are injected. */
export function createMusic({ storage, makePlayer, isHidden }) {
  let memory = true;
  let unlocked = false;
  let player = null;
  let playing = false;
  const listeners = new Set();

  const enabled = () => {
    try {
      const v = storage?.getItem(KEY);
      if (v === 'on') return true;
      if (v === 'off') return false;
    } catch {
      /* blocked storage: use this visit's choice */
    }
    return memory;
  };

  function sync() {
    const shouldPlay = unlocked && enabled() && !isHidden();
    if (shouldPlay && !playing) {
      player ??= makePlayer(); // created only when music is actually wanted, so nothing downloads while off
      playing = true;
      Promise.resolve(player.play()).catch(() => {
        playing = false; // the browser refused (e.g. no gesture yet): try again on the next sync
        listeners.forEach((fn) => fn());
      });
    } else if (!shouldPlay && playing) {
      player.pause();
      playing = false;
    }
  }

  const notify = () => listeners.forEach((fn) => fn());

  return {
    enabled,
    playing: () => playing,
    setEnabled(on) {
      memory = on;
      try {
        storage?.setItem(KEY, on ? 'on' : 'off');
      } catch {
        /* remembered for this visit only */
      }
      sync();
      notify();
    },
    unlock() {
      unlocked = true;
      sync();
      notify();
    },
    sync() {
      sync();
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/**
 * Plays through a Web Audio gain node: iPhone Safari ignores HTMLMediaElement.volume, so this is
 * the only way to keep the music quiet there. Fades in and out instead of cutting.
 */
function makePlayer() {
  const el = new Audio(track);
  el.loop = true;
  el.preload = 'none'; // streamed while it plays rather than downloaded up front
  let ctx = null;
  let gain = null;
  let stopTimer = null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
  } catch {
    el.volume = VOLUME;
  }
  const ramp = (to, seconds) => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(to, t + seconds);
  };
  return {
    play() {
      clearTimeout(stopTimer);
      ctx?.resume();
      const started = el.play();
      if (gain) ramp(VOLUME, 1.5);
      return started;
    },
    pause() {
      if (!gain) {
        el.pause();
        return;
      }
      ramp(0, 0.4);
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => el.pause(), 450);
    },
  };
}

export const music = createMusic({
  storage: safeLocalStorage(),
  makePlayer,
  isHidden: () => typeof document !== 'undefined' && document.hidden,
});

/** Called once from main.jsx: start on the first tap or key press, pause while hidden. */
export function startMusic() {
  if (typeof document === 'undefined') return;
  const events = ['pointerdown', 'keydown'];
  const unlock = () => {
    music.unlock();
    events.forEach((t) => document.removeEventListener(t, unlock, true));
  };
  events.forEach((t) => document.addEventListener(t, unlock, true));
  document.addEventListener('visibilitychange', () => music.sync());
}
