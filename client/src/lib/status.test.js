import { describe, expect, test } from 'vitest';
import { homeHint, isReady, lockedSubmitHint, stageFor, statusPill, stepIndex } from './status';

const p = (current_status, r = false, pf = false) => ({ current_status, is_resume_ready: r, is_portfolio_ready: pf });

describe('stageFor / stepIndex', () => {
  test.each([
    [p('NOT_STARTED'), 'seed', 0],
    [p('RESUME_DONE', true), 'resume', 1],
    [p('PORTFOLIO_DONE', false, true), 'portfolio', 1],
    [p('RESUME_DONE', true, true), 'both', 2],
    [p('PORTFOLIO_DONE', true, true), 'both', 2],
    [p('APPLICATIONS_SUBMITTED', true, true), 'bud', 3],
    [p('INTERNSHIP_CONFIRMED', true, true), 'bloom', 4],
  ])('%o → %s', (progress, stage, step) => {
    expect(stageFor(progress)).toBe(stage);
    expect(stepIndex(progress)).toBe(step);
  });
});

test('locked submit hint names what is missing (design 3a)', () => {
  expect(lockedSubmitHint(p('PORTFOLIO_DONE', false, true))).toBe('ต้องทำ Resume ให้เสร็จก่อน');
  expect(lockedSubmitHint(p('NOT_STARTED'))).toBe('ต้องทำ Resume และ Portfolio ให้เสร็จก่อน');
});

test('home hints use the design copy', () => {
  expect(homeHint(p('PORTFOLIO_DONE', false, true))).toBe('อีกนิดเดียว! ทำ Resume ให้เสร็จเพื่อปลดล็อกการยื่นสมัคร');
  expect(homeHint(p('RESUME_DONE', true, true))).toBe('เอกสารครบแล้ว! ยื่นสมัครแล้วกด “ยื่นแล้ว” ด้านล่างได้เลย');
});

test('status pill adds เอกสารครบ when both documents are done (design 3c)', () => {
  expect(statusPill(p('RESUME_DONE', true, true))).toEqual({ label: 'ทำ Resume แล้ว · เอกสารครบ', bg: '#DDF0FF', fg: '#1F5A8A' });
  expect(statusPill(p('PORTFOLIO_DONE', false, true)).label).toBe('ทำ Portfolio แล้ว');
});

test('ready = both documents, not yet submitted', () => {
  expect(isReady(p('RESUME_DONE', true, true))).toBe(true);
  expect(isReady(p('APPLICATIONS_SUBMITTED', true, true))).toBe(false);
  expect(isReady(p('RESUME_DONE', true))).toBe(false);
});
