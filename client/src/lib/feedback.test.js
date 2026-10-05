import { expect, test, vi } from 'vitest';
import { createFeedback } from './feedback';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
}
const throwing = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

test('sound is off by default and plays nothing', () => {
  const play = vi.fn();
  const fb = createFeedback({ storage: fakeStorage(), play });
  expect(fb.soundEnabled()).toBe(false);
  fb.sound('success');
  expect(play).not.toHaveBeenCalled();
});

test('turning sound on is remembered and plays', () => {
  const storage = fakeStorage();
  const play = vi.fn();
  createFeedback({ storage, play }).setSoundEnabled(true);
  const fb = createFeedback({ storage, play }); // a later visit
  expect(fb.soundEnabled()).toBe(true);
  fb.sound('tick');
  expect(play).toHaveBeenCalledWith('tick');
  fb.setSoundEnabled(false);
  expect(fb.soundEnabled()).toBe(false);
});

test('storage that throws (private mode) means sound off, without crashing', () => {
  const play = vi.fn();
  const fb = createFeedback({ storage: throwing, play });
  expect(() => fb.setSoundEnabled(true)).not.toThrow();
  expect(fb.soundEnabled()).toBe(false);
  fb.sound('success');
  expect(play).not.toHaveBeenCalled();
});

test('no storage at all means sound off', () => {
  expect(createFeedback({ storage: null }).soundEnabled()).toBe(false);
});

test('haptic vibrates with the pattern for its kind', () => {
  const vibrate = vi.fn();
  const fb = createFeedback({ storage: null, vibrate });
  fb.haptic('tick');
  fb.haptic('success');
  fb.haptic('error');
  expect(vibrate.mock.calls).toEqual([[10], [[14, 50, 22]], [[40, 60, 40]]]);
});

test('haptic does nothing without vibration support or for unknown kinds', () => {
  const vibrate = vi.fn();
  expect(() => createFeedback({ storage: null, vibrate: null }).haptic('tick')).not.toThrow();
  createFeedback({ storage: null, vibrate }).haptic('nope');
  expect(vibrate).not.toHaveBeenCalled();
});

test('a vibrate call that throws is swallowed', () => {
  const vibrate = () => { throw new Error('not allowed'); };
  expect(() => createFeedback({ storage: null, vibrate }).haptic('tick')).not.toThrow();
});
