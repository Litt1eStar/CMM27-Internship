# Design v2, Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every screen the design v2 foundation: richer surfaces, springy buttons and sheets, page transitions, a seed loader and skeletons, and haptics with optional sound.

**Architecture:** CSS tokens and component classes in `client/src/index.css` carry the new look. The Motion library drives the sheet's spring and drag. A small `lib/transitions.js` wraps route changes in `document.startViewTransition`, and `lib/feedback.js` owns haptics, sounds and the sound setting. No server, API or database changes.

**Tech Stack:** React 18, React Router 7 (declarative `<BrowserRouter>`), Vite 8, Tailwind v4, Vitest 5, Motion 14 (`motion/react`), View Transitions API, Playwright MCP for the visual check.

**Spec:** `docs/superpowers/specs/2026-10-05-design-v2-design.md`, section 1 (Foundation). Later phases (2 Company directory, 3 Student home, 4 First impression) get their own plans after this one ships.

---

## Progress overview

| # | Task | Status |
|---|---|---|
| 1 | Add the Motion library | ⬜ |
| 2 | Generate the UI sounds | ⬜ |
| 3 | `lib/feedback.js` (haptics, sound, setting) | ⬜ |
| 4 | `lib/transitions.js` (direction logic) | ⬜ |
| 5 | New look: tokens, surfaces, press, glass, titles | ⬜ |
| 6 | Sheet: spring, drag to dismiss, animated close | ⬜ |
| 7 | Page transitions wired in | ⬜ |
| 8 | Seed loader and skeletons | ⬜ |
| 9 | Haptics and sound in toasts, errors and Profile | ⬜ |
| 10 | Mock API harness for visual checks | ⬜ |
| 11 | Docs, version 1.1.0 | ⬜ |
| 12 | Visual check (user approval) | ⬜ |
| 13 | Ship phase 1 (user confirms deploy) | ⬜ |

## Decisions made while planning (recorded in the spec in Task 11)

- **Real data exists.** The live database holds 83 imported students (1 signed in) and 1 advisor. Test
  students can't be created or cleaned up any more, so visual checks use a mocked API in the browser
  (Task 10). No phase 1 step writes to the database.
- **Sounds live in `client/src/assets/sfx/`**, not `public/`, so Vite hashes them and nginx caches them
  under `/assets/`.
- **Primary button:** a lighter-to-leaf gradient with an inner highlight and a deeper edge, keeping forest
  text. A darker forest background would drop the text contrast below 4.5:1.
- **Card edge:** a hairline warm ring instead of a top inner highlight (a white highlight on a white card is
  invisible).
- **View transitions:** React Router's `viewTransition` option only works in data mode and is deprecated;
  this app uses `<BrowserRouter>`, so `lib/transitions.js` calls `document.startViewTransition` itself.
- **Reduced motion** is read with Motion's `useReducedMotion()` in components and with CSS media queries;
  `feedback.js` doesn't need it (sound follows the toggle either way).

## File map

| File | Change |
|---|---|
| `client/package.json` | add `motion`; version 1.1.0 |
| `client/scripts/make-sfx.mjs` | new: writes the three WAV files |
| `client/src/assets/sfx/{pop,chime,rustle}.wav` | new, generated |
| `client/src/lib/feedback.js` + `.test.js` | new |
| `client/src/lib/transitions.js` + `.test.js` | new |
| `client/src/index.css` | tokens, surfaces, press, glass, titles, skeleton, loader, view transitions |
| `client/src/components/Sheet.jsx` | rewritten with Motion; exports `SheetCloseButton` |
| `client/src/components/SeedLoader.jsx` | new |
| `client/src/components/Skeleton.jsx` | new |
| `client/src/components/AppFrame.jsx`, `TabBar.jsx`, `Toast.jsx`, `ui.jsx`, `Icons.jsx` | modified |
| `client/src/App.jsx` | splash uses `SeedLoader` |
| `client/src/pages/ProfilePage.jsx` | sound toggle, shared sprout name |
| `client/src/pages/student/StudentHomePage.jsx`, `ProgressParts.jsx`, `ActionSheet.jsx` | loader, glass bar, shared sprout, close button |
| `client/src/pages/companies/DirectoryPage.jsx`, `CompanyFormSheet.jsx`, `DeleteCompanySheet.jsx` | skeleton, glass, close buttons |
| `client/src/pages/advisor/AdvisorHomePage.jsx`, `StudentRow.jsx`, `StudentDetailPage.jsx`, `AddStudentSheet.jsx` | skeletons, glass, transitions, close buttons |
| `client/e2e/mock-api.js` | new: Playwright harness, fake data only |
| `CLAUDE.md`, the spec | docs |

All commands below run from `client/` unless they say otherwise.

---

### Task 1: Add the Motion library

**Files:**
- Modify: `client/package.json`, `client/package-lock.json`

- [ ] **Step 1: Install**

Run: `npm install motion@^14`
Expected: `added 1 package` (or a few), no errors.

- [ ] **Step 2: Check audit and build**

Run: `npm audit` then `npm run build`
Expected: `found 0 vulnerabilities`; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(client): add motion for spring animations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Generate the UI sounds

**Files:**
- Create: `client/scripts/make-sfx.mjs`
- Create (generated): `client/src/assets/sfx/pop.wav`, `chime.wav`, `rustle.wav`

- [ ] **Step 1: Write the generator**

`client/scripts/make-sfx.mjs`:

```js
// Generates the three UI sounds as small mono WAV files. Run: node scripts/make-sfx.mjs
// Made from maths, so there are no licensing questions and every run gives identical files.
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const OUT = new URL('../src/assets/sfx/', import.meta.url);

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const render = (seconds, fn) => Array.from({ length: Math.round(seconds * RATE) }, (_, i) => fn(i / RATE));
// Short fade-in so the first sample doesn't click.
const attack = (t) => Math.min(1, t / 0.004);

let seed = 7;
const noise = () => {
  seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
  return seed / 0x3fffffff - 1;
};

function note(t, start, freq) {
  if (t < start) return 0;
  const u = t - start;
  return attack(u) * Math.exp(-u * 6) * (Math.sin(2 * Math.PI * freq * u) + 0.25 * Math.sin(4 * Math.PI * freq * u));
}

// pop: a quick downward pitch sweep (tick)
const pop = render(0.09, (t) => attack(t) * Math.sin(2 * Math.PI * (900 * t - 3000 * t * t)) * Math.exp(-t * 45) * 0.6);
// chime: two bright notes, C6 then G6 (success)
const chime = render(0.6, (t) => 0.32 * (note(t, 0, 1046.5) + note(t, 0.08, 1568)));
// rustle: soft filtered noise swell (a leaf growing, used from phase 3)
let low = 0;
const rustle = render(0.35, (t) => {
  low += 0.18 * (noise() - low);
  return low * Math.sin((Math.PI * t) / 0.35) ** 2 * 0.9;
});

mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries({ pop, chime, rustle })) {
  writeFileSync(new URL(`${name}.wav`, OUT), wav(samples));
}
console.log('wrote pop.wav, chime.wav, rustle.wav');
```

- [ ] **Step 2: Run it**

Run: `node scripts/make-sfx.mjs && ls -l src/assets/sfx`
Expected: `wrote pop.wav, chime.wav, rustle.wav`; sizes about 4 KB, 26 KB and 15 KB.

- [ ] **Step 3: Listen once**

Open each file in the OS player. The pop should be short and soft, the chime two bright notes, the rustle a
gentle whoosh. None should click or clip. If one sounds harsh, lower its final multiplier (0.6 / 0.32 /
0.9) and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts/make-sfx.mjs src/assets/sfx
git commit -m "feat(client): generated UI sounds (pop, chime, rustle)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `lib/feedback.js`

**Files:**
- Create: `client/src/lib/feedback.js`
- Test: `client/src/lib/feedback.test.js`

- [ ] **Step 1: Write the failing tests**

`client/src/lib/feedback.test.js`:

```js
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
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run src/lib/feedback.test.js`
Expected: FAIL, `Failed to resolve import "./feedback"`.

- [ ] **Step 3: Implement**

`client/src/lib/feedback.js`:

```js
// Haptics and sounds for key moments. Sound is off until the user turns it on (Profile),
// and the choice is a per-device convenience kept in localStorage.
import pop from '../assets/sfx/pop.wav';
import chime from '../assets/sfx/chime.wav';
import rustle from '../assets/sfx/rustle.wav';

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
  audio.volume = 0.45;
  audio.currentTime = 0;
  audio.play().catch(() => {}); // autoplay rules or no output device: stay silent
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const feedback = createFeedback({
  storage: typeof window === 'undefined' ? null : browserStorage(),
  vibrate: typeof navigator !== 'undefined' && navigator.vibrate ? (p) => navigator.vibrate(p) : null,
  play: playFile,
});
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run src/lib/feedback.test.js`
Expected: 7 passed.

- [ ] **Step 5: Run all client tests**

Run: `npm test`
Expected: all pass (25 existing + 7 new).

- [ ] **Step 6: Commit**

```bash
git add src/lib/feedback.js src/lib/feedback.test.js
git commit -m "feat(client): feedback helper for haptics and optional sound

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `lib/transitions.js`

**Files:**
- Create: `client/src/lib/transitions.js`
- Test: `client/src/lib/transitions.test.js`

- [ ] **Step 1: Write the failing tests**

`client/src/lib/transitions.test.js`:

```js
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
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/lib/transitions.test.js`
Expected: FAIL, `Failed to resolve import "./transitions"`.

- [ ] **Step 3: Implement**

`client/src/lib/transitions.js`:

```js
// Page transitions with the View Transitions API. React Router's own `viewTransition` option only
// works in data mode (and is deprecated); this app uses <BrowserRouter>, so we drive
// document.startViewTransition here. Browsers without it just navigate.
let pending = null;

const depth = (path) => path.split('/').filter(Boolean).length;

/** 'forward' | 'back': which way the page slides. `order` lists tab paths left to right. */
export function direction(from, to, order = []) {
  if (typeof to === 'number') return to < 0 ? 'back' : 'forward';
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a !== -1 && b !== -1) return b < a ? 'back' : 'forward';
  return depth(to) < depth(from) ? 'back' : 'forward';
}

/** navigate(to) inside a view transition. `to` is a path or a history step like -1. */
export function navigateWithTransition(navigate, to, { from = window.location.pathname, order } = {}) {
  if (!document.startViewTransition) {
    navigate(to);
    return;
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.dataset.nav = reduce ? 'fade' : direction(from, to, order);
  const transition = document.startViewTransition(
    () =>
      new Promise((resolve) => {
        pending?.();
        pending = resolve;
        navigate(to);
        setTimeout(resolve, 500); // never leave the page frozen if the route doesn't commit
      })
  );
  transition.finished.finally(() => {
    delete root.dataset.nav;
  });
}

/** AppFrame calls this after a route renders, so the browser captures the new page. */
export function routeCommitted() {
  pending?.();
  pending = null;
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run src/lib/transitions.test.js`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transitions.js src/lib/transitions.test.js
git commit -m "feat(client): view-transition navigation helper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: New look (tokens, surfaces, press, glass, titles)

**Files:**
- Modify: `client/src/index.css`
- Modify: `client/src/components/AppFrame.jsx`, `client/src/components/TabBar.jsx`,
  `client/src/pages/student/ProgressParts.jsx`, `client/src/pages/companies/DirectoryPage.jsx`,
  `client/src/pages/advisor/AdvisorHomePage.jsx`

- [ ] **Step 1: Replace the three shadow tokens in `@theme`**

Replace:

```css
  --shadow-card: 0 1px 2px rgba(120, 80, 40, 0.06), 0 8px 24px rgba(120, 80, 40, 0.07);
  --shadow-sheet: 0 -10px 30px rgba(59, 47, 47, 0.12);
  --shadow-bar: 0 -6px 20px rgba(120, 80, 40, 0.08);
```

with:

```css
  --shadow-card: 0 0 0 1px rgba(120, 80, 40, 0.05), 0 1px 2px rgba(120, 80, 40, 0.06),
    0 6px 16px rgba(120, 80, 40, 0.06), 0 18px 36px -14px rgba(120, 80, 40, 0.16);
  --shadow-sheet: 0 -1px 0 rgba(255, 255, 255, 0.8), 0 -12px 40px rgba(59, 47, 47, 0.16);
  --shadow-bar: 0 -1px 0 rgba(120, 80, 40, 0.06), 0 -10px 30px rgba(120, 80, 40, 0.08);
```

- [ ] **Step 2: Add the spring easing and grain to `@layer base`**

At the top of `@layer base { … }`, before `html,`, add:

```css
  :root {
    /* A spring with a small overshoot, for CSS transitions (Motion handles JS springs). */
    --ease-spring: linear(0, 0.25 6%, 0.7 14%, 1.04 24%, 1.1 31%, 1.06 40%, 0.99 52%, 0.985 62%, 1 78%, 1);
    --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .42 0 0 0 0 .28 0 0 0 0 .16 0 0 0 .06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
```

- [ ] **Step 3: Replace the primary button rules**

Replace:

```css
  .btn-primary {
    background: var(--color-leaf);
    color: var(--color-forest);
    box-shadow: 0 3px 0 var(--color-leaf-deep);
    transition: transform 0.12s, box-shadow 0.12s;
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--color-leaf-deep);
  }
```

with:

```css
  .btn,
  .chip,
  .press {
    transition: transform 0.5s var(--ease-spring), box-shadow 0.2s ease-out, background-color 0.2s;
  }
  .btn:active:not(:disabled),
  .chip:active,
  .press:active {
    transform: scale(0.96);
    transition-duration: 0.1s;
    transition-timing-function: ease-out;
  }
  /* Forest text on #52CC9B is 6.1:1 and on the leaf end 4.9:1. */
  .btn-primary {
    background: linear-gradient(180deg, #52cc9b 0%, var(--color-leaf) 100%);
    color: var(--color-forest);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 3px 0 var(--color-leaf-deep),
      0 10px 20px -8px rgba(46, 158, 114, 0.6);
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(3px) scale(0.98);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 var(--color-leaf-deep),
      0 4px 10px -6px rgba(46, 158, 114, 0.5);
  }
```

- [ ] **Step 4: Replace the card rule**

Replace:

```css
  .card {
    background: #fff;
    border-radius: 20px;
    box-shadow: var(--shadow-card);
  }
```

with:

```css
  .card {
    background: linear-gradient(180deg, #ffffff 0%, #fffcf8 100%);
    border-radius: 22px;
    box-shadow: var(--shadow-card);
  }
  .app-surface {
    background-color: var(--color-cream);
    background-image: var(--grain), linear-gradient(180deg, #fff8f0 0%, #fff4e8 60%, #ffeedd 100%);
  }
  .glass {
    background: rgba(255, 248, 240, 0.72);
    -webkit-backdrop-filter: blur(18px) saturate(1.6);
    backdrop-filter: blur(18px) saturate(1.6);
  }
  .glass-white {
    background: rgba(255, 255, 255, 0.76);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
    backdrop-filter: blur(20px) saturate(1.8);
  }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass {
      background: var(--color-cream);
    }
    .glass-white {
      background: #fff;
    }
  }
```

- [ ] **Step 5: Replace the three title rules**

Replace:

```css
  .title-page {
    font: 500 24px/1.2 var(--font-sans);
  }
  .title-sheet {
    font: 500 24px/1.3 var(--font-sans);
  }
  .title-section {
    font: 500 18px/1.3 var(--font-sans);
  }
```

with:

```css
  .title-page {
    font: 600 26px/1.2 var(--font-sans);
    letter-spacing: -0.01em;
  }
  .title-sheet {
    font: 600 24px/1.3 var(--font-sans);
    letter-spacing: -0.01em;
  }
  .title-section {
    font: 600 18px/1.3 var(--font-sans);
  }
  .num-display {
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
```

- [ ] **Step 6: Add reduced-motion rules at the end of the file**

```css
@media (prefers-reduced-motion: reduce) {
  .btn,
  .chip,
  .press {
    transition: none;
  }
}
```

- [ ] **Step 7: Use the new classes**

`client/src/components/AppFrame.jsx`: in the outer div's className replace `bg-cream` with `app-surface`.

`client/src/components/TabBar.jsx`: in the `<nav>` className replace `bg-white` with `glass-white`.

`client/src/pages/student/ProgressParts.jsx` (`StickyActionBar`): replace `border-t border-line-soft bg-white` with
`border-t border-line-soft glass-white`.

`client/src/pages/companies/DirectoryPage.jsx`: replace
`className="sticky top-0 z-20 flex flex-col gap-[10px] bg-cream px-4 pt-1 pb-3"` with
`className="glass sticky top-0 z-20 flex flex-col gap-[10px] px-4 pt-1 pb-3"`.

`client/src/pages/advisor/AdvisorHomePage.jsx`:
- replace `className="sticky top-0 z-20 flex gap-2 bg-cream px-4 pt-4 pb-3"` with
  `className="glass sticky top-0 z-20 flex gap-2 px-4 pt-4 pb-3"`;
- replace `className="pt-1 text-[34px] leading-none font-medium"` with `className="num-display pt-1 text-[34px] leading-none"`;
- replace `className="text-[34px] leading-none font-medium text-mint-ink"` with `className="num-display text-[34px] leading-none text-mint-ink"`.

- [ ] **Step 8: Build and test**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 9: Quick look**

Run `npx vite --port 5180 --strictPort` in the background, open `http://localhost:5180/` with Playwright at
390×844 and screenshot the login page to `.playwright-mcp/p1-look-login.png`. The background should show
the soft gradient, and the Google button the new gradient. Stop the server (only the one on 5180; the
user's own server on 5173 must keep running).

- [ ] **Step 10: Commit**

```bash
git add src/index.css src/components/AppFrame.jsx src/components/TabBar.jsx src/pages/student/ProgressParts.jsx src/pages/companies/DirectoryPage.jsx src/pages/advisor/AdvisorHomePage.jsx
git commit -m "feat(client): v2 surfaces, springy press, glass bars and heavier titles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Sheet with spring, drag to dismiss and animated close

**Files:**
- Modify: `client/src/components/Sheet.jsx` (full rewrite)
- Modify: `client/src/pages/student/ActionSheet.jsx`, `client/src/pages/companies/CompanyFormSheet.jsx`,
  `client/src/pages/companies/DeleteCompanySheet.jsx`, `client/src/pages/advisor/AddStudentSheet.jsx`,
  `client/src/pages/advisor/StudentDetailPage.jsx`

- [ ] **Step 1: Rewrite `Sheet.jsx`**

```jsx
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useDragControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

const SPRING = { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 };
const DISMISS_DISTANCE = 120; // px dragged down
const DISMISS_VELOCITY = 600; // px/s flick

const CloseContext = createContext(null);

/** A button inside a Sheet that closes it with the slide-down animation. */
export function SheetCloseButton({ onClick, children, ...props }) {
  const close = useContext(CloseContext);
  return (
    <button type="button" {...props} onClick={(e) => { onClick?.(e); close?.(); }}>
      {children}
    </button>
  );
}

/**
 * Bottom sheet (3d, 3e, 4b, 4d, 5c, 5e): dimmed backdrop, white panel with 28px top corners and a
 * grabber. Springs in, can be dragged down from the grabber to dismiss, and slides out on close.
 * `full` = full-height (4d). `footer` renders in a bordered strip pinned to the bottom.
 * onClose undefined (e.g. while saving) means the sheet can't be closed.
 */
export default function Sheet({ open, onClose, label, full = false, grabberGap = 18, footer, children }) {
  const reduce = useReducedMotion();
  const panel = useRef(null);
  const closing = useRef(false);
  const y = useMotionValue(0);
  const backdrop = useTransform(y, [0, 480], [1, 0]);
  const drag = useDragControls();

  const close = useCallback(() => {
    if (!onClose || closing.current) return;
    if (reduce) {
      onClose();
      return;
    }
    closing.current = true;
    animate(y, panel.current?.offsetHeight ?? 800, SPRING).then(onClose);
  }, [onClose, reduce, y]);

  // Spring in from below, before the first paint.
  useLayoutEffect(() => {
    if (!open || reduce) return undefined;
    y.set(panel.current?.offsetHeight ?? 800);
    const a = animate(y, 0, SPRING);
    return () => a.stop();
  }, [open, reduce, y]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    const previous = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  function onDragEnd(_event, info) {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) close();
  }

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <motion.div className="absolute inset-0 bg-[rgba(59,47,47,.45)]" style={{ opacity: backdrop }} onClick={close} />
      <motion.div
        ref={panel}
        style={{ y }}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.06, bottom: 1 }}
        onDragEnd={onDragEnd}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[430px] flex-col rounded-t-[28px] bg-white shadow-[var(--shadow-sheet)] ${
          full ? 'top-[calc(env(safe-area-inset-top)+7px)]' : 'max-h-[92dvh]'
        }`}
      >
        <CloseContext.Provider value={close}>
          <div className={`min-h-0 flex-1 overflow-y-auto px-4 pt-[10px] ${footer ? 'pb-1' : 'pb-[calc(env(safe-area-inset-bottom)+8px)]'}`}>
            {/* Drag handle: a taller strip than the grabber so it's easy to catch. */}
            <div onPointerDown={(e) => drag.start(e)} className="-mx-4 -mt-[10px] cursor-grab touch-none px-4 pt-[10px]"
              style={{ paddingBottom: grabberGap }}>
              <div className="grabber" />
            </div>
            {children}
          </div>
          {footer && (
            <div className="border-t border-line-soft px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">{footer}</div>
          )}
        </CloseContext.Provider>
      </motion.div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Use `SheetCloseButton` for cancel buttons**

In each file below, change the `Sheet` import to `import Sheet, { SheetCloseButton } from '<same path>';`
and replace the cancel button.

`client/src/pages/student/ActionSheet.jsx`, `client/src/pages/advisor/AddStudentSheet.jsx`,
`client/src/pages/companies/DeleteCompanySheet.jsx`: replace

```jsx
<button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ยกเลิก</button>
```

with

```jsx
<SheetCloseButton className="btn btn-secondary" disabled={busy}>ยกเลิก</SheetCloseButton>
```

`client/src/pages/advisor/StudentDetailPage.jsx` (unlink sheet): replace

```jsx
<button type="button" className="btn btn-secondary" disabled={busy} onClick={onClose}>ปิด</button>
```

with

```jsx
<SheetCloseButton className="btn btn-secondary" disabled={busy}>ปิด</SheetCloseButton>
```

`client/src/pages/companies/CompanyFormSheet.jsx`: replace the ✕ button

```jsx
        <button type="button" aria-label="ปิด" onClick={onClose} className="flex size-11 items-center justify-center rounded-[14px] bg-cream">
          <CloseIcon />
        </button>
```

with

```jsx
        <SheetCloseButton aria-label="ปิด" className="flex size-11 items-center justify-center rounded-[14px] bg-cream">
          <CloseIcon />
        </SheetCloseButton>
```

Check nothing else still passes `onClick={onClose}` to a cancel button:
Run: `grep -rn "onClick={onClose}" src/pages`
Expected: only `src/pages/student/Celebration.jsx` (not a sheet).

- [ ] **Step 3: Build and test**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sheet.jsx src/pages
git commit -m "feat(client): sheets spring in, drag down to dismiss and slide out on close

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Page transitions

**Files:**
- Modify: `client/src/index.css`, `client/src/components/AppFrame.jsx`, `client/src/components/TabBar.jsx`,
  `client/src/pages/advisor/AdvisorHomePage.jsx`, `client/src/pages/advisor/StudentRow.jsx`,
  `client/src/pages/advisor/StudentDetailPage.jsx`, `client/src/pages/student/ProgressParts.jsx`,
  `client/src/pages/ProfilePage.jsx`

- [ ] **Step 1: View-transition CSS**

Append to `client/src/index.css` (outside any `@layer`, before the reduced-motion block):

```css
/* Page transitions (lib/transitions.js sets data-nav on <html> for the duration). */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.32s;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
  animation-fill-mode: both;
}
::view-transition-group(*) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}
:root[data-nav='forward']::view-transition-old(root) {
  animation-name: vt-out-left;
}
:root[data-nav='forward']::view-transition-new(root) {
  animation-name: vt-in-right;
}
:root[data-nav='back']::view-transition-old(root) {
  animation-name: vt-out-right;
}
:root[data-nav='back']::view-transition-new(root) {
  animation-name: vt-in-left;
}
:root[data-nav='fade']::view-transition-old(root) {
  animation: vt-fade-out 0.15s ease-out both;
}
:root[data-nav='fade']::view-transition-new(root) {
  animation: vt-fade-in 0.15s ease-out both;
}
:root[data-nav='fade']::view-transition-group(*) {
  animation-duration: 0s;
}
/* The tab bar stays put while the page moves. */
::view-transition-group(tabbar),
::view-transition-old(tabbar),
::view-transition-new(tabbar) {
  animation: none;
}
@keyframes vt-out-left {
  to { opacity: 0; transform: translateX(-28px); }
}
@keyframes vt-in-right {
  from { opacity: 0; transform: translateX(28px); }
}
@keyframes vt-out-right {
  to { opacity: 0; transform: translateX(28px); }
}
@keyframes vt-in-left {
  from { opacity: 0; transform: translateX(-28px); }
}
@keyframes vt-fade-out {
  to { opacity: 0; }
}
@keyframes vt-fade-in {
  from { opacity: 0; }
}
```

- [ ] **Step 2: AppFrame tells the transition when the route has rendered**

`client/src/components/AppFrame.jsx`:

```jsx
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { routeCommitted } from '../lib/transitions';
import TabBar from './TabBar';

/** The phone-width column every screen lives in. tabs = 'student' | 'advisor' | undefined. */
export default function AppFrame({ tabs, children }) {
  const location = useLocation();
  useLayoutEffect(() => {
    routeCommitted();
  }, [location.key]);

  return (
    <div className="app-surface mx-auto flex min-h-dvh w-full max-w-[430px] flex-col pt-[env(safe-area-inset-top)]">
      <main className={`flex-1 ${tabs ? 'pb-[calc(64px+env(safe-area-inset-bottom))]' : ''}`}>{children}</main>
      {tabs && <TabBar role={tabs} />}
    </div>
  );
}
```

- [ ] **Step 3: Tab bar navigates with a transition**

`client/src/components/TabBar.jsx`: change the import line to

```jsx
import { NavLink, useLocation, useNavigate } from 'react-router';
import { navigateWithTransition } from '../lib/transitions';
```

and replace the component with:

```jsx
export default function TabBar({ role }) {
  const tabs = TABS[role];
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const order = tabs.map((t) => t.to);

  // Plain left clicks only; let modified clicks (new tab etc.) behave normally.
  const go = (to) => (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (to !== pathname) navigateWithTransition(navigate, to, { from: pathname, order });
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[430px] border-t border-line-soft glass-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(120,80,40,.06)]"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, viewTransitionName: 'tabbar' }}
    >
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={go(to)} className="flex h-16 flex-col items-center justify-center gap-[3px]">
          {({ isActive }) => (
            <>
              <span
                data-anim={isActive ? 'pop' : ''}
                className="flex h-8 w-[60px] items-center justify-center rounded-2xl"
                style={{ background: isActive ? '#3DBE8B' : 'transparent' }}
              >
                <Icon color={isActive ? '#0F3D2E' : '#8A7B76'} />
              </span>
              <span className="text-[13px] leading-4" style={{ color: isActive ? '#0F3D2E' : '#8A7B76', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Advisor roster row expands into the detail page**

`client/src/pages/advisor/AdvisorHomePage.jsx`: add the import
`import { navigateWithTransition } from '../../lib/transitions';` and replace

```jsx
onClick={() => navigate(`/students/${row.id}`)}
```

with

```jsx
onClick={() => navigateWithTransition(navigate, `/students/${row.id}`)}
```

`client/src/pages/advisor/StudentRow.jsx`: on the root `<button>` add
`style={{ viewTransitionName: `student-${row.id}` }}`.

`client/src/pages/advisor/StudentDetailPage.jsx`: add the import
`import { navigateWithTransition } from '../../lib/transitions';`, replace

```jsx
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
```

with

```jsx
  const back = () => navigateWithTransition(navigate, window.history.state?.idx > 0 ? -1 : '/');
```

and on the header block `<div className="flex items-center gap-3 px-1">` (the one holding the name and the
large sprout) add `style={{ viewTransitionName: `student-${id}` }}`.

- [ ] **Step 5: The student's sprout is one shared element**

`client/src/pages/student/ProgressParts.jsx` (`HeroCard`): on
`<div data-anim="pop" className="flex size-[124px] flex-none items-center justify-center rounded-full bg-cream">`
add `style={{ viewTransitionName: 'my-sprout' }}`.

`client/src/pages/ProfilePage.jsx`: on
`<div className="absolute -right-1.5 -bottom-1 flex size-[46px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(120,80,40,.15)]">`
add `style={{ viewTransitionName: 'my-sprout' }}`.

- [ ] **Step 6: Build and test**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/components src/pages
git commit -m "feat(client): page transitions with a shared sprout and expanding roster rows

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Seed loader and skeletons

**Files:**
- Create: `client/src/components/SeedLoader.jsx`, `client/src/components/Skeleton.jsx`
- Modify: `client/src/index.css`, `client/src/App.jsx`, `client/src/pages/student/StudentHomePage.jsx`,
  `client/src/pages/companies/DirectoryPage.jsx`, `client/src/pages/advisor/AdvisorHomePage.jsx`,
  `client/src/pages/advisor/StudentDetailPage.jsx`

- [ ] **Step 1: CSS for shimmer and the loader bar**

Add inside `@layer components` (after `.no-scrollbar::-webkit-scrollbar`):

```css
  .skeleton {
    border-radius: 8px;
    background: linear-gradient(90deg, var(--color-sand) 0%, #faf5ef 50%, var(--color-sand) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }
  .loader-bar {
    animation: loader-slide 1.1s ease-in-out infinite;
  }
```

Add at the top level (next to the view-transition keyframes):

```css
@keyframes shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}
@keyframes loader-slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(200%); }
}
```

and inside the existing `@media (prefers-reduced-motion: reduce)` block add:

```css
  .skeleton,
  .loader-bar {
    animation: none;
  }
```

- [ ] **Step 2: `SeedLoader.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Sprout from './Sprout';

const STAGES = ['seed', 'resume', 'both', 'bud'];

/** Loading state: the sprout grows through its stages on a loop. */
export default function SeedLoader({ size = 96 }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % STAGES.length), 650);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <div role="status" aria-label="กำลังโหลด…" className="flex flex-col items-center gap-3">
      <div style={{ width: size, height: size }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={STAGES[i]}
            initial={{ scale: 0.7, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.08, opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            <Sprout stage={STAGES[i]} size={size} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-line-soft">
        <div className="loader-bar h-full w-1/2 rounded-full bg-leaf" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `Skeleton.jsx`**

```jsx
/** Shimmering placeholder block. */
export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** A column of card-shaped placeholders while a list loads. */
export function SkeletonCards({ count = 3, height = 120 }) {
  return (
    <div role="status" aria-label="กำลังโหลด…" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card flex gap-3 p-4" style={{ height }}>
          <Skeleton className="size-12 flex-none rounded-[14px]" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Splash uses the loader**

`client/src/App.jsx`: replace the `Sprout` import with `import SeedLoader from './components/SeedLoader';`
and replace the `Splash` function with:

```jsx
// Boot screen: the growing-seed loader on the app background.
function Splash() {
  return (
    <div className="app-surface mx-auto flex min-h-dvh max-w-[430px] items-center justify-center">
      <SeedLoader />
    </div>
  );
}
```

- [ ] **Step 5: Student home loading state**

`client/src/pages/student/StudentHomePage.jsx`: add `import SeedLoader from '../../components/SeedLoader';`
and replace the `if (!progress) { … }` block with:

```jsx
  if (!progress) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-24">
        {error ? (
          <>
            <Sprout stage="seed" mood="worried" size={72} />
            <ErrorBanner>{error}</ErrorBanner>
            <button type="button" className="btn btn-secondary" onClick={load}>ลองใหม่</button>
          </>
        ) : (
          <SeedLoader size={72} />
        )}
      </div>
    );
  }
```

- [ ] **Step 6: Directory skeleton**

`client/src/pages/companies/DirectoryPage.jsx`: add `import { SkeletonCards } from '../../components/Skeleton';`
and replace

```jsx
        <div className="flex justify-center py-16"><Sprout stage="seed" size={64} /></div>
```

with

```jsx
        !error && <div className="px-4"><SkeletonCards count={4} height={132} /></div>
```

- [ ] **Step 7: Advisor home skeletons**

`client/src/pages/advisor/AdvisorHomePage.jsx`: add
`import { Skeleton, SkeletonCards } from '../../components/Skeleton';`. Directly after the closing
`)}` of the `{metrics && ( … )}` block, add:

```jsx
      {!metrics && !error && (
        <div role="status" aria-label="กำลังโหลด…" className="grid grid-cols-2 gap-[10px] px-4 pt-[18px]">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px] rounded-[20px]" />)}
          <Skeleton className="col-span-2 h-[92px] rounded-[20px]" />
        </div>
      )}
```

and inside `<div className="flex flex-col gap-[10px] px-4 pb-[120px]">`, before `{rows?.map(`, add:

```jsx
        {rows === null && !error && <SkeletonCards count={4} height={108} />}
```

- [ ] **Step 8: Student detail skeleton**

`client/src/pages/advisor/StudentDetailPage.jsx`: add
`import { Skeleton, SkeletonCards } from '../../components/Skeleton';` and directly before `{s && (` add:

```jsx
      {!s && !error && (
        <div className="flex flex-col gap-4 px-4 pt-1">
          <div className="flex items-center gap-3 px-1">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="size-32 rounded-full" />
          </div>
          <SkeletonCards count={2} height={160} />
        </div>
      )}
```

- [ ] **Step 9: Build and test**

Run: `npm run build && npm test`
Expected: build succeeds (no unused-import errors; `Sprout` is still used by `EmptyState` in
`DirectoryPage.jsx` and by the error state in `StudentHomePage.jsx`); all tests pass.

- [ ] **Step 10: Commit**

```bash
git add src
git commit -m "feat(client): seed loader and shimmer skeletons for loading states

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Haptics and sound in toasts, errors and Profile

**Files:**
- Modify: `client/src/components/Toast.jsx`, `client/src/components/ui.jsx`, `client/src/components/Icons.jsx`,
  `client/src/pages/ProfilePage.jsx`

- [ ] **Step 1: Toasts buzz and chime**

`client/src/components/Toast.jsx`: add `import { feedback } from '../lib/feedback';` and replace the effect with:

```jsx
  useEffect(() => {
    if (!toast) return undefined;
    feedback.haptic('success');
    feedback.sound('success');
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [toast, onDone]);
```

- [ ] **Step 2: Errors buzz**

`client/src/components/ui.jsx`: add `import { feedback } from '../lib/feedback';` and at the start of
`ErrorBanner`'s body add:

```jsx
  useEffect(() => {
    feedback.haptic('error');
  }, []);
```

(`useEffect` is already imported in this file.)

- [ ] **Step 3: Sound icon**

`client/src/components/Icons.jsx`: after `LogoutIcon` add:

```jsx
export const SoundIcon = (p) => <Svg size={22} color="#3B2F2F" {...p}><path d="M4 9 L8 9 L13 5 L13 19 L8 15 L4 15 Z M16.5 9.5 C17.8 10.8 17.8 13.2 16.5 14.5 M19 7 C21.7 9.7 21.7 14.3 19 17" /></Svg>;
```

- [ ] **Step 4: Profile sound toggle**

`client/src/pages/ProfilePage.jsx`: change the icons import to
`import { LogoutIcon, SoundIcon } from '../components/Icons';`, add
`import { feedback } from '../lib/feedback';`, and add this component above `export default`:

```jsx
/** "เสียงเอฟเฟกต์" switch. Off by default; remembered on this device. */
function SoundToggle() {
  const [on, setOn] = useState(() => feedback.soundEnabled());
  const toggle = () => {
    const next = !on;
    feedback.setSoundEnabled(next);
    setOn(next);
    feedback.haptic('tick');
    if (next) feedback.sound('tick');
  };
  return (
    <button type="button" role="switch" aria-checked={on} onClick={toggle}
      className="card press flex h-14 items-center gap-3 px-4 text-left text-base font-semibold">
      <SoundIcon />
      <span className="flex-1">เสียงเอฟเฟกต์</span>
      <span className={`relative h-7 w-12 flex-none rounded-full transition-colors ${on ? 'bg-leaf' : 'bg-line'}`}>
        <span className="absolute top-0.5 size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(59,47,47,.25)] transition-[left] duration-500 [transition-timing-function:var(--ease-spring)]"
          style={{ left: on ? 22 : 2 }} />
      </span>
    </button>
  );
}
```

Then in the page, directly before the `ออกจากระบบ` button, add `<SoundToggle />`.

- [ ] **Step 5: Build and test**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components src/pages/ProfilePage.jsx
git commit -m "feat(client): haptics on toasts and errors, sound toggle on Profile

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Mock API harness for visual checks

The live database holds real students, so visual checks never sign in for real. This harness fakes a
signed-in session and answers every `/api` call in the browser, with obviously fake data.

**Files:**
- Create: `client/e2e/mock-api.js`

- [ ] **Step 1: Write the harness**

`client/e2e/mock-api.js`:

```js
// Visual-check harness for Playwright MCP (browser_run_code_unsafe). Fakes a signed-in session and
// answers /api in the browser, so no request reaches Supabase or the real database.
// Set SCENARIO / DELAY_MS, then pass the whole file as the code. Needs the Vite dev server on :5180
// (dev mode exposes window.__supabase, used to find the session storage key).
async (page) => {
  const SCENARIO = 'student-seed'; // student-seed | student-both | student-submitted | advisor | offline
  const DELAY_MS = 0; // delay every /api answer, to see loaders and skeletons
  const BASE = 'http://localhost:5180';

  const now = Date.now();
  const iso = (daysAgo) => new Date(now - daysAgo * 864e5).toISOString();
  const advisor = SCENARIO === 'advisor';

  const me = advisor
    ? { id: 'adv-1', role: 'ADVISOR', student_id: null, full_name: 'อาจารย์ ทดสอบ', email: 'advisor.test@kmutt.ac.th', created_at: iso(60), updated_at: iso(1) }
    : { id: 'stu-1', role: 'STUDENT', student_id: '99999999901', full_name: 'สมชาย ทดสอบ', email: 'somchai.test@mail.kmutt.ac.th', created_at: iso(20), updated_at: iso(1) };

  const flags = {
    'student-seed': [false, false, 'NOT_STARTED'],
    'student-both': [true, true, 'PORTFOLIO_DONE'],
    'student-submitted': [true, true, 'APPLICATIONS_SUBMITTED'],
  }[SCENARIO] ?? [false, false, 'NOT_STARTED'];
  let progress = { ...me, is_resume_ready: flags[0], is_portfolio_ready: flags[1], current_status: flags[2], is_linked: true };

  const ev = (id, event, prev, next, daysAgo) => ({ id, user_id: me.id, event, previous_status: prev, new_status: next, changed_at: iso(daysAgo), note: null });
  let timeline = [ev(1, 'INITIALIZED', null, 'NOT_STARTED', 20)];
  if (flags[0]) timeline.push(ev(2, 'RESUME_COMPLETED', 'NOT_STARTED', 'RESUME_DONE', 9));
  if (flags[1]) timeline.push(ev(3, 'PORTFOLIO_COMPLETED', 'RESUME_DONE', 'PORTFOLIO_DONE', 5));
  if (flags[2] === 'APPLICATIONS_SUBMITTED') timeline.push(ev(4, 'APPLICATIONS_SUBMITTED', 'PORTFOLIO_DONE', 'APPLICATIONS_SUBMITTED', 2));

  const types = [
    { id: 1, name_th: 'ซอฟต์แวร์และไอที' },
    { id: 2, name_th: 'สื่อและโฆษณา' },
    { id: 3, name_th: 'เกมและแอนิเมชัน' },
  ];
  const company = (id, name, typeId, mode, source, url, daysAgo, mine) => ({
    id, name, url, work_mode: mode, source_type: source, note: null, business_type_id: typeId,
    business_type: types.find((t) => t.id === typeId).name_th, created_by: mine ? me.id : 'someone-else',
    created_by_name: null, created_at: iso(daysAgo), updated_at: iso(daysAgo),
  });
  let companies = [
    company('c1', 'บริษัท ตัวอย่าง ดิจิทัล จำกัด', 1, 'HYBRID', 'SENIOR', 'https://example.com', 30, false),
    company('c2', 'Pixel Test Studio', 3, 'ONSITE', 'CLASSMATE', null, 3, true),
    company('c3', 'Mock Media Co.', 2, 'ONLINE', 'SENIOR', 'https://example.org', 12, false),
    company('c4', 'บริษัท ทดลอง ครีเอทีฟ', 2, 'ONSITE', 'CLASSMATE', 'https://example.net', 40, false),
  ];

  const statuses = ['NOT_STARTED', 'RESUME_DONE', 'PORTFOLIO_DONE', 'APPLICATIONS_SUBMITTED', 'INTERNSHIP_CONFIRMED'];
  const roster = Array.from({ length: 8 }, (_, i) => {
    const status = statuses[i % 5];
    const step = statuses.indexOf(status);
    return {
      id: `r${i}`, student_id: `999999999${String(10 + i)}`, full_name: i === 3 ? null : `นักศึกษา ทดสอบ ${i + 1}`,
      email: i === 3 ? null : `test${i}@mail.kmutt.ac.th`, is_resume_ready: step >= 1 || i === 7, is_portfolio_ready: step >= 2,
      current_status: status, is_linked: i !== 3, created_at: iso(30), updated_at: iso(i),
    };
  });
  const metrics = {
    total: roster.length, linked_accounts: roster.filter((r) => r.is_linked).length,
    by_status: Object.fromEntries(statuses.map((s) => [s, roster.filter((r) => r.current_status === s).length])),
    resume_done: roster.filter((r) => r.is_resume_ready).length,
    portfolio_done: roster.filter((r) => r.is_portfolio_ready).length,
    ready_to_apply: roster.filter((r) => r.is_resume_ready && r.is_portfolio_ready && ['RESUME_DONE', 'PORTFOLIO_DONE'].includes(r.current_status)).length,
  };

  // Same outcomes as progressAfter() in src/lib/status.js.
  const NEXT = {
    COMPLETE_RESUME: ['RESUME_COMPLETED', (p) => ({ ...p, is_resume_ready: true, current_status: 'RESUME_DONE' })],
    COMPLETE_PORTFOLIO: ['PORTFOLIO_COMPLETED', (p) => ({ ...p, is_portfolio_ready: true, current_status: 'PORTFOLIO_DONE' })],
    SUBMIT: ['APPLICATIONS_SUBMITTED', (p) => ({ ...p, current_status: 'APPLICATIONS_SUBMITTED' })],
    CONFIRM: ['INTERNSHIP_CONFIRMED', (p) => ({ ...p, current_status: 'INTERNSHIP_CONFIRMED' })],
  };

  await page.unrouteAll({ behavior: 'ignoreErrors' }); // forget the previous scenario
  await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/**', async (route) => {
    if (SCENARIO === 'offline') return route.abort('internetdisconnected');
    if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/api/auth/me') return json({ email: me.email, googleName: me.full_name, needsLink: false, profile: progress });
    if (path === '/api/business-types') return json({ data: types });
    if (path === '/api/companies' && method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return json({ data: companies.filter((c) => c.name.toLowerCase().includes(q)) });
    }
    if (path === '/api/companies' && method === 'POST') {
      const body = req.postDataJSON();
      const row = company(`c${companies.length + 1}`, body.name, body.business_type_id, body.work_mode, body.source_type, body.url, 0, true);
      companies = [...companies, row];
      return json({ data: row }, 201);
    }
    if (path.startsWith('/api/companies/') && method === 'DELETE') {
      companies = companies.filter((c) => c.id !== path.split('/').pop());
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/me/progress') return json({ data: progress });
    if (path === '/api/me/timeline') return json({ data: timeline });
    if (path === '/api/me/actions' && method === 'POST') {
      const { action } = req.postDataJSON();
      const [event, apply] = NEXT[action];
      const prev = progress.current_status;
      progress = { ...apply(progress), updated_at: new Date().toISOString() };
      timeline = [...timeline, { ...ev(timeline.length + 1, event, prev, progress.current_status, 0), changed_at: new Date().toISOString() }];
      return json({ data: progress });
    }
    if (path === '/api/advisor/metrics') return json({ data: metrics });
    if (path === '/api/advisor/students' && method === 'GET') return json({ data: roster });
    if (path.startsWith('/api/advisor/students/')) {
      const student = roster.find((r) => r.id === path.split('/').pop());
      return json({ data: { student, timeline: [{ id: 1, user_id: student.id, event: 'INITIALIZED', previous_status: null, new_status: 'NOT_STARTED', changed_at: iso(30), note: null }] } });
    }
    return json({ error: { code: 'NOT_MOCKED', message: `${method} ${path}` } }, 500);
  });

  // Fake session: far-future expiry so supabase-js never tries to refresh it.
  const session = {
    access_token: 'mock-access-token', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(now / 1000) + 365 * 24 * 3600, refresh_token: 'mock-refresh-token',
    user: { id: 'mock-auth-user', aud: 'authenticated', role: 'authenticated', email: me.email,
      app_metadata: { provider: 'google' }, user_metadata: { full_name: me.full_name }, created_at: iso(20) },
  };
  await page.goto(BASE);
  const key = await page.evaluate(() => window.__supabase.auth.storageKey);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, JSON.stringify(session)]);
  await page.reload();
  return `scenario ${SCENARIO} ready (session key ${key})`;
}
```

- [ ] **Step 2: Check the API paths match the client**

Run: `grep -n "request('" src/lib/api.js`
Expected: every GET path the pages call (`/api/auth/me`, `/api/business-types`, `/api/companies`,
`/api/me/progress`, `/api/me/timeline`, `/api/advisor/metrics`, `/api/advisor/students`,
`/api/advisor/students/:id`) and the POSTs used in Task 12 (`/api/me/actions`) appear in the harness.
Anything else answers 500 `NOT_MOCKED`, which shows up in the console.

- [ ] **Step 3: Smoke-run it**

Start `npx vite --port 5180 --strictPort` in the background. With Playwright MCP: resize to 390×844, run the
harness with `SCENARIO = 'student-seed'`, take a snapshot.
Expected: the student home ("ความคืบหน้าของฉัน") with "สวัสดี สมชาย 👋"; browser console has no
`NOT_MOCKED` errors. Repeat with `'advisor'`: the advisor home "ภาพรวมนักศึกษา" with 8 students.

Also confirm nothing reached a real server: run `browser_network_requests`. Every `/api/...` and
`*.supabase.co/auth/v1/...` request should be answered by the harness (Playwright marks them as fulfilled
by a route). Any other request to `*.supabase.co` means the harness missed something: stop and fix it.

- [ ] **Step 4: Commit**

```bash
git add e2e/mock-api.js
git commit -m "test(client): mocked-API harness for visual checks without database writes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Docs and version 1.1.0

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-05-design-v2-design.md`, `client/package.json`,
  `client/package-lock.json`, this plan

- [ ] **Step 1: Version**

Run: `npm version 1.1.0 --no-git-tag-version`
Expected: `v1.1.0`. The Profile footer will show "เวอร์ชัน 1.1.0".

- [ ] **Step 2: CLAUDE.md**

Replace the paragraph

```
Client UI follows the Claude Design bundle in `docs/design/cmm-internship-tracker-mobile/`. The decisions
where the design and the system differed, and every extrapolated state, are recorded in
`docs/superpowers/plans/2026-10-05-client-design-migration.md`. Match the design; ask before changing it.
```

with

```
Client UI follows the design v2 spec, `docs/superpowers/specs/2026-10-05-design-v2-design.md`, built in
phases (`docs/superpowers/plans/2026-10-05-design-v2-phase*.md`). The Claude Design bundle in
`docs/design/cmm-internship-tracker-mobile/` and `docs/superpowers/plans/2026-10-05-client-design-migration.md`
are the record of v1. Ask before changing a decision in the spec.

Visual checks use the mocked API in `client/e2e/mock-api.js` (Playwright MCP, dev server on port 5180).
The live database has real students, so never create test students for screenshots.
```

In the Commands block, after `cd client && npm test           # Vitest logic tests` add:

```
cd client && node scripts/make-sfx.mjs   # regenerate the UI sounds in src/assets/sfx
```

- [ ] **Step 3: Record the planning decisions in the spec**

Append to `docs/superpowers/specs/2026-10-05-design-v2-design.md`:

```markdown

## Changes made while planning phase 1 (2026-10-05)

- The live database already holds real imported students, so all visual checks use the mocked API
  (`client/e2e/mock-api.js`); no test students are created. This replaces the test-account approach in
  section 7.
- Sounds live in `client/src/assets/sfx/` (hashed and cached by nginx), not `public/sfx/`.
- Primary buttons use a lighter-to-leaf gradient with an inner highlight and deeper edge instead of a
  darker forest background, to keep forest text at 4.5:1 or better.
- Cards get a hairline warm ring instead of a top inner highlight.
- `lib/transitions.js` calls `document.startViewTransition` directly, because React Router's
  `viewTransition` option needs data mode and is deprecated.
- Reduced motion is read with Motion's `useReducedMotion()` and CSS media queries, not in `feedback.js`.
- New microcopy: "กำลังโหลด…" (screen-reader label for loaders and skeletons).
```

- [ ] **Step 4: Update this plan's progress table**, ticking tasks 1–11 ✅.

- [ ] **Step 5: Commit**

```bash
git add ../CLAUDE.md ../docs/superpowers package.json package-lock.json
git commit -m "docs: design v2 is the UI source of truth; phase 1 decisions; v1.1.0

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Visual check (needs the user's approval)

No database access in this task: everything runs against the mocked API.

- [ ] **Step 1: Start the dev server**

Run (background): `npx vite --port 5180 --strictPort`. Port 5173 belongs to the user's other project; leave it alone.

- [ ] **Step 2: Walk the screens at 390×844**

For each row, run the harness with the given settings, do the action, and save a screenshot to
`.playwright-mcp/` with the given name.

| Screenshot | Harness | Action | Check |
|---|---|---|---|
| `p1-splash.png` | student-seed, DELAY_MS 2500 | screenshot within 1 s of reload | seed loader cycling stages, loader bar |
| `p1-home.png` | student-seed | wait for load | gradient background with grain, ringed cards, heavier title, glass tab bar |
| `p1-directory-skeleton.png` | student-seed, DELAY_MS 2500 | tap บริษัท tab, screenshot at once | shimmer cards, glass search bar |
| `p1-directory.png` | student-seed | tap บริษัท tab, wait | 4 companies; page slid in from the right |
| `p1-profile-off.png` | student-seed | tap ฉัน tab | sound switch off; version 1.1.0 |
| `p1-profile-on.png` | student-seed | tap the switch | switch on; `localStorage['cmm.sound'] === 'on'` (check with `browser_evaluate`) |
| `p1-sheet.png` | student-both | tap ยื่นแล้ว in the bottom bar | sheet springs up; backdrop dimmed |
| `p1-sheet-drag.png` | student-both | with `browser_run_code_unsafe`: mouse down on the grabber, move down 150 px, screenshot, then release | sheet follows the finger, backdrop lighter; after release the sheet is gone |
| `p1-sheet-snapback.png` | student-both | open again, drag down 60 px and release | sheet springs back open |
| `p1-toast.png` | student-both | open the sheet, confirm | toast appears; home shows ยื่นแล้ว state |
| `p1-error.png` | offline | reload | worried seed, error banner, ลองใหม่ |
| `p1-advisor-skeleton.png` | advisor, DELAY_MS 2500 | screenshot at once | tile and row skeletons |
| `p1-advisor.png` | advisor | wait | bolder numbers, glass search bar |
| `p1-advisor-detail.png` | advisor | tap the first student row | detail page; the row grew into the header |
| `p1-cancel-close.png` | advisor | open เพิ่มนักศึกษา, tap ยกเลิก | sheet slides down instead of vanishing |

- [ ] **Step 3: Reduced motion**

Run `browser_emulate_media` with `reducedMotion: 'reduce'`, then repeat `p1-sheet.png` and a tab change.
Save `p1-reduced-sheet.png`. Check: the sheet appears without sliding, the tab change is a short fade, and
skeletons don't shimmer.

- [ ] **Step 4: Desktop**

Resize to 1280×900, harness student-both, open the sheet. Save `p1-desktop.png`. Check: page, tab bar,
sheet and toast stay inside the 430px column.

- [ ] **Step 5: Console**

Run `browser_console_messages`. Expected: no errors except the intended network failures in the offline
scenario.

- [ ] **Step 6: Stop the dev server** (the one on 5180 only) and close the browser.

- [ ] **Step 7: Show the screenshots to the user** and fix anything they flag. Mark this task ✅ only after
they approve.

---

### Task 13: Ship phase 1 (ask the user first)

Pushing to `main` runs the deploy workflow, which updates the live site on the shared droplet. **Ask the
user before Step 2.**

- [ ] **Step 1: Final checks**

Run: `npm test && npm run build && npm audit`
Expected: all tests pass; build succeeds; `found 0 vulnerabilities`.

- [ ] **Step 2: Merge and push (after the user says yes)**

```bash
git switch main
git merge --ff-only design-v2
git push origin main
git switch design-v2
```

- [ ] **Step 3: Watch the deploy**

Run: `gh run watch` (pick the run for the pushed commit)
Expected: all jobs green.

- [ ] **Step 4: Check the live site**

Open `https://cmm27.cmm.works` in Playwright at 390×844 without signing in. Expected: the login page with
the new background and button. Ask the user to sign in on their phone and confirm the Profile footer
shows "เวอร์ชัน 1.1.0" and that sheets, tab changes and the sound switch work.

Rollback if needed: re-run the previous successful deploy workflow run (`gh run rerun <id>`), which
redeploys the previous image.

- [ ] **Step 5: Mark this plan's tasks 12–13 ✅ and commit on `design-v2`**

```bash
git add ../docs/superpowers/plans/2026-10-05-design-v2-phase1-foundation.md
git commit -m "docs: phase 1 shipped

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
