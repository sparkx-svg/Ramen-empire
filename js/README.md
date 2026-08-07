# Split source (`js/`)

The game used to live in one large `script.js` (~3900 lines).  
Source is now split for easier editing:

| File | What it contains |
|------|------------------|
| `01-data.js` | Countries, CONFIG, recipes, cosmetics, achievements, story, etc. |
| `02-state-persistence.js` | Game state, localStorage + **cloud saves**, account switch, profile |
| `03-economy-ui.js` | Income math, events, challenges, all rendering & buy/actions |
| `04-auth-main.js` | Google/guest login, leaderboard, friends, guilds, gifts, audio, tick loop, init |

## How to edit

1. Edit the file(s) under `js/`.
2. Rebuild the single deployable file:

```bash
npm run build:script
# or: node build-script.js
```

That concatenates the four parts back into `script.js` (wrapped in the original IIFE).  
`index.html` still loads only `script.js` — no change needed for GitHub Pages / static hosting.

## Deploy

Same as before: use the generated `script.js` (and deploy `firestore.rules` if you haven’t yet).
