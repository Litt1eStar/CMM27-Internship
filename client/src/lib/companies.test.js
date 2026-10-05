import { expect, test } from 'vitest';
import { EMPTY_FILTERS, directoryQuery, displayUrl, hasAnyFilter, sheetFilterCount, toUrl } from './companies';

test('directory query drops "ALL" and empty values', () => {
  expect(directoryQuery(EMPTY_FILTERS)).toEqual({ q: undefined, mode: undefined, types: undefined, source: undefined });
  expect(directoryQuery({ q: ' pixel ', mode: 'ONSITE', types: [4, 1], source: 'SENIOR' }))
    .toEqual({ q: 'pixel', mode: 'ONSITE', types: '1,4', source: 'SENIOR' });
});

test('filter badge counts sheet filters only (design 4a shows 2)', () => {
  expect(sheetFilterCount({ ...EMPTY_FILTERS, types: [1, 4] })).toBe(2);
  expect(sheetFilterCount({ ...EMPTY_FILTERS, types: [1], source: 'SENIOR', mode: 'ONLINE' })).toBe(2);
  expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false);
  expect(hasAnyFilter({ ...EMPTY_FILTERS, mode: 'ONLINE' })).toBe(true);
});

test('website input: optional, https added when missing', () => {
  expect(toUrl('')).toBeNull();
  expect(toUrl('  ')).toBeNull();
  expect(toUrl('pixelforge.example.com')).toBe('https://pixelforge.example.com');
  expect(toUrl('http://a.example.com')).toBe('http://a.example.com');
  expect(displayUrl('https://pixelforge.example.com/')).toBe('pixelforge.example.com');
});
