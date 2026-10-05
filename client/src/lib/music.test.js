import { expect, test, vi } from 'vitest';
import { createMusic } from './music';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}
const throwing = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};
function fakePlayer() {
  return { play: vi.fn(() => Promise.resolve()), pause: vi.fn() };
}
function setup({ storage = fakeStorage(), hidden = false } = {}) {
  const player = fakePlayer();
  const makePlayer = vi.fn(() => player);
  const state = { hidden };
  const music = createMusic({ storage, makePlayer, isHidden: () => state.hidden });
  return { music, player, makePlayer, state };
}

test('music is on by default but waits for the first tap', () => {
  const { music, makePlayer } = setup();
  expect(music.enabled()).toBe(true);
  expect(makePlayer).not.toHaveBeenCalled();
});

test('the first tap starts it', () => {
  const { music, player } = setup();
  music.unlock();
  expect(player.play).toHaveBeenCalledTimes(1);
  expect(music.playing()).toBe(true);
});

test('turning it off pauses, is remembered, and a later visit stays silent', () => {
  const storage = fakeStorage();
  const first = setup({ storage });
  first.music.unlock();
  first.music.setEnabled(false);
  expect(first.player.pause).toHaveBeenCalled();
  expect(first.music.playing()).toBe(false);

  const later = setup({ storage });
  expect(later.music.enabled()).toBe(false);
  later.music.unlock();
  expect(later.makePlayer).not.toHaveBeenCalled(); // nothing downloaded while off
});

test('turning it back on plays again', () => {
  const { music, player } = setup({ storage: fakeStorage({ 'cmm.music': 'off' }) });
  music.unlock();
  music.setEnabled(true);
  expect(player.play).toHaveBeenCalledTimes(1);
});

test('blocked storage: on by default and can still be turned off for this visit', () => {
  const { music, player } = setup({ storage: throwing });
  expect(music.enabled()).toBe(true);
  music.unlock();
  expect(() => music.setEnabled(false)).not.toThrow();
  expect(music.enabled()).toBe(false);
  expect(player.pause).toHaveBeenCalled();
});

test('pauses while the app is hidden and resumes when visible', () => {
  const { music, player, state } = setup();
  music.unlock();
  state.hidden = true;
  music.sync();
  expect(player.pause).toHaveBeenCalledTimes(1);
  expect(music.playing()).toBe(false);
  state.hidden = false;
  music.sync();
  expect(player.play).toHaveBeenCalledTimes(2);
});

test('subscribers hear about changes', () => {
  const { music } = setup();
  const seen = vi.fn();
  const stop = music.subscribe(seen);
  music.unlock();
  music.setEnabled(false);
  stop();
  music.setEnabled(true);
  expect(seen).toHaveBeenCalledTimes(2);
});

test('a play() that the browser rejects does not throw', () => {
  const player = { play: vi.fn(() => Promise.reject(new Error('NotAllowedError'))), pause: vi.fn() };
  const music = createMusic({ storage: fakeStorage(), makePlayer: () => player, isHidden: () => false });
  expect(() => music.unlock()).not.toThrow();
});
