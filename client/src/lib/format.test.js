import { expect, test } from 'vitest';
import { AVATARS, avatarColors, formatThaiDate, formatThaiDateTime, thaiInitial } from './format';

test('Thai dates in Bangkok time with the Buddhist year', () => {
  expect(formatThaiDateTime('2026-09-12T14:30:02Z')).toBe('12 ก.ย. 2569 21:30');
  expect(formatThaiDateTime('2026-09-12T14:30:02Z', { seconds: true })).toBe('12 ก.ย. 2569 21:30:02');
  expect(formatThaiDateTime('2026-10-01T17:05:00Z')).toBe('2 ต.ค. 2569 00:05');
  expect(formatThaiDate('2026-09-01T03:00:00Z')).toBe('1 ก.ย. 2569');
  expect(formatThaiDate(null)).toBe('');
});

test('initials skip leading vowels and academic titles', () => {
  expect(thaiInitial('สมชาย ใจดี')).toBe('ส');
  expect(thaiInitial('เกศินี ดีงาม')).toBe('ก');
  expect(thaiInitial('ไพลิน')).toBe('พ');
  expect(thaiInitial('ผศ.ดร. วรรณา ศรีงาม')).toBe('ว');
  expect(thaiInitial('อรุณ')).toBe('อ');
  expect(thaiInitial('pixel Forge')).toBe('P');
  expect(thaiInitial('')).toBe('?');
});

test('avatar colours are stable and from the design palette', () => {
  expect(avatarColors('Pixel Forge Studio')).toEqual(avatarColors('Pixel Forge Studio'));
  const { bg, fg } = avatarColors('Moonbeam Media');
  expect(AVATARS).toContainEqual([bg, fg]);
});
