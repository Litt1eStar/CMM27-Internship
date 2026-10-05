import { expect, test } from 'vitest';
import { EMPTY_ROSTER, percent, rosterFilterCount, rosterQuery } from './roster';

test('roster query drops "ALL"', () => {
  expect(rosterQuery(EMPTY_ROSTER)).toEqual({ q: undefined, status: undefined, resume: undefined, portfolio: undefined });
  expect(rosterQuery({ q: '6708', status: 'APPLICATIONS_SUBMITTED', resume: 'true', portfolio: 'false' }))
    .toEqual({ q: '6708', status: 'APPLICATIONS_SUBMITTED', resume: 'true', portfolio: 'false' });
});

test('filter count and tile percentages (design 5a: 9/42 = 21%, 13/42 = 31%, 8/42 = 19%)', () => {
  expect(rosterFilterCount({ ...EMPTY_ROSTER, status: 'RESUME_DONE', resume: 'true' })).toBe(2);
  expect(percent(9, 42)).toBe('21%');
  expect(percent(13, 42)).toBe('31%');
  expect(percent(8, 42)).toBe('19%');
  expect(percent(0, 0)).toBe('0%');
});
