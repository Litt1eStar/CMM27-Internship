import { expect, test } from 'vitest';
import { direction } from './transitions';

const TABS = ['/', '/companies', '/me'];

test('tabs slide by their order in the tab bar', () => {
  expect(direction('/', '/me', TABS)).toBe('forward');
  expect(direction('/me', '/companies', TABS)).toBe('back');
  expect(direction('/companies', '/me', TABS)).toBe('forward');
});

test('deeper pages slide forward, shallower pages back', () => {
  expect(direction('/', '/students/abc')).toBe('forward');
  expect(direction('/students/abc', '/')).toBe('back');
});

test('history steps use their sign', () => {
  expect(direction('/students/abc', -1)).toBe('back');
  expect(direction('/', 1)).toBe('forward');
});

test('same depth outside the tab order slides forward', () => {
  expect(direction('/a', '/b')).toBe('forward');
});
