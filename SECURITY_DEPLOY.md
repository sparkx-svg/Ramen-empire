# Ramen Empire — Free-tier Security (Spark plan)

No Blaze plan required. No Cloud Functions. No paid features.

## What this actually protects

| Threat | Protected? |
|--------|------------|
| Anyone overwriting someone else’s leaderboard entry | Yes (rules) |
| Writing obviously impossible cash / prestige numbers | Yes (rules + client bounds) |
| Casual localStorage edit of cash | Mostly (checksum + integrityFlag blocks submit) |
| Determined cheater who reverse-engineers the checksum | No (impossible without a server) |
| Bot / scripted mass submissions | Partially (client rate-limit + rules) |

## Files to use

- `firestore.rules` ← deploy this
- `CLIENT_CHANGES.md` ← the two tiny edits to `script.js`

## Manual steps (only 4)

1. **Deploy the security rules**  
   ```bash
   firebase deploy --only firestore:rules
   ```
   (Works on the free Spark plan.)

2. **Edit `script.js`**  
   Apply the two changes shown in `CLIENT_CHANGES.md`.

3. **Bump the service-worker version**  
   In `sw.js` change:
   ```js
   const APP_VERSION = '1.8.0';
   ```
   to
   ```js
   const APP_VERSION = '1.8.1';
   ```
   so existing players get the updated client.

4. **Commit & push to GitHub**  
   Push the updated `script.js`, `sw.js`, and the new `firestore.rules`.

That’s it. After step 1 the database itself rejects the worst abuse. After steps 2–3 the client also refuses to submit flagged saves.
