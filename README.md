# Ramen Empire — Idle Tycoon

Build a noodle cart into a global ramen empire.

## Requirements

- Node.js 20+
- npm 10+

## Scripts

| Command | What it does |
|---------|----------------|
| `npm install` | Install deps |
| `npm run dev` | Local dev server (Vite) |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview the production build |

## Project layout

```
src/economy/     ← pure TypeScript economy math (tested)
tests/           ← Vitest unit tests
public/          ← static game assets (script.js, styles, SW, etc.)
functions/       ← Cloud Functions code — written, but NOT deployed (needs paid Blaze plan; see functions/NOT_DEPLOYED.md)
index.html       ← entry
.github/workflows/ci.yml  ← CI: typecheck + test + build
firebase.json    ← ties firestore.rules/indexes together for `firebase deploy` (Spark-plan compatible)
firestore.rules  ← Firestore security rules — this is where anti-cheat actually runs right now
SECURITY.md      ← anti-cheat design notes, setup steps, and known limitations
```

## Economy tests

The cost curves, prestige formula, reputation multiplier, manager scaling, and number formatting live in `src/economy/` and are covered by `tests/economy.test.ts`.  
When you change balance numbers in `src/economy/config.ts`, run `npm test` so nothing silently breaks.

> **Note:** The live game still uses the CONFIG object inside `public/script.js`.  
> Keep the two in sync until the main game is migrated to import from `src/economy`.

## Deploy

### GitHub Pages (static)

```bash
npm run build
# upload contents of dist/ to gh-pages, or use the Actions workflow
```

### Firestore rules (free Spark plan — no billing upgrade needed)

Anti-cheat for the leaderboard/guilds runs entirely through `firestore.rules`
right now (rate-based validation using `request.time`, no Cloud Functions
involved). See **SECURITY.md** for how that works, plus setup steps (App
Check site key, enabling enforcement, etc.) before deploying.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

`functions/` exists in this repo but isn't deployed — see `functions/NOT_DEPLOYED.md`
for what it'd take to switch to it if you upgrade to the Blaze plan later.

## CI

Every push/PR to `main` runs typecheck, unit tests, and a production build via GitHub Actions.
`functions/` has its own `package.json` and isn't part of that CI job since it isn't deployed.
