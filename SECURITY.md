# Security & anti-cheat — what's here, what it does, and what it doesn't

This documents the leaderboard/guild security work in `firestore.rules` and
the App Check wiring in `public/firebase-config.js`.

**No Cloud Functions are deployed.** They require Firebase's paid Blaze plan.
Everything here runs on the free Spark plan instead — see `functions/NOT_DEPLOYED.md`
for the Cloud Function code that exists but isn't wired in, and what upgrading
to it later would add.

## The problem this solves

Ramen Empire's economy simulation (cash, business levels, prestige) runs
entirely client-side — the save is just localStorage. A player can always
edit their own local save with devtools. **That's not what this fixes**, and
can't be, short of re-simulating the whole game server-side.

What *is* fixed: that edited save previously could be submitted straight to
Firestore's `leaderboard`/`guilds` collections — a **shared, competitive**
surface every player sees — with only loose static bounds checked (e.g.
"cash must be under 10^18"). That's enough to stop someone pasting
`Number.MAX_SAFE_INTEGER` into devtools, not enough to stop "set cash to 50
million two minutes into a new save."

## How it works without a server

Firestore security rules can do more than static bounds checks. Two things
make real validation possible with rules alone:

- **`request.time`** is a timestamp the *server* sets when it receives the
  write — the client cannot forge or backdate it.
- **`resource.data`** is the *previous* version of the document being
  written, readable from inside the rule for an `update`.

Put together: every leaderboard write stores `updatedAt: request.time`, and
the next write's rule computes `elapsedSec = request.time - previousUpdatedAt`
directly in the rules language, then bounds how much `totalEarned`/
`weeklyEarned` were allowed to grow in that real amount of time, using the
player's own reported `ratePerSec` as the ceiling (with generous slack). This
is the same rate-based idea a Cloud Function would use — it's just
implemented in rules instead of server code.

Guild contributions work the same way, via a `guilds/{id}/memberProgress/{uid}`
subcollection that only that member can write — so the rate/growth check on
it can't be confused by other members contributing at the same moment. The
shared `guilds/{id}.weeklyContrib` field can then only change through a
branch of the rules that cross-checks against that member's own
`memberProgress` doc (via `get()`) before allowing the change.

## What changed

1. **`firestore.rules`**:
   - `leaderboard/{uid}`: `create` is capped at a flat, generous "early game"
     ceiling (500,000) since there's no previous doc to compute elapsed time
     against. `update` requires real elapsed time (server-set) times the
     player's own reported income rate (with slack) to cover the claimed
     growth — and correctly handles prestige resets (`totalEarned` dropping
     to ~0 is expected when `prestigeCount` increased).
   - `guilds/{id}`: membership (create/join/leave) still happens directly
     from the client with shape checks. `weeklyContrib`/`weekId` — the
     actual competitive numbers — can now ONLY change through the
     contribution branch, which is bounded via each member's own
     `memberProgress` subdocument.
   - `guilds/{id}/memberProgress/{uid}`: single-writer, rate-limited,
     monotonic (can't decrease within the same week).

2. **`public/script.js`** — `submitScore()` and `contributeToGuild()` write
   to Firestore directly (no Cloud Function to call), but now send the
   extra fields the rules need (`ratePerSec`, `updatedAt` as a server
   timestamp) and `contributeToGuild()` uses a client-side Firestore
   *transaction* (still fully supported without Cloud Functions) to read-
   then-write the guild doc and its own `memberProgress` doc atomically —
   this avoids a race condition where two members hitting a weekly rollover
   at the same instant could both try to "reset" `weeklyContrib`.

3. **App Check** (`public/firebase-config.js` + `index.html`) — wired up
   with reCAPTCHA v3. This part works identically with or without Blaze —
   App Check enforcement on Cloud Firestore is a Firestore-level setting,
   not a Cloud Functions one. Needs a real site key before it does anything
   — see setup steps below.

## Setup steps (can't be done from code — need the Firebase Console)

1. **Get an App Check site key**: Firebase Console → Build → App Check →
   register the web app → choose "reCAPTCHA v3" → copy the site key into
   `APP_CHECK_SITE_KEY` in `public/firebase-config.js` (currently a
   placeholder — the app runs fine without it, App Check just won't do
   anything until this is set).
2. **Start App Check in monitor mode**, not enforced — App Check → APIs →
   Cloud Firestore → leave "Unenforced" for a day or two, watch the metrics
   for real players getting flagged, *then* switch to "Enforced". Flipping
   straight to enforced risks locking out legitimate players if something's
   misconfigured.
3. **Deploy**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   No Blaze upgrade needed for this — Firestore rules are part of the free
   Spark plan.

## Honest limitations

- **This checks plausibility, not correctness**, same caveat a Cloud
  Function would have — `ratePerSec` is client-reported. A determined
  attacker who fabricates a fully self-consistent fake state (including a
  fake rate) that ramps up gradually could still get through.
- **The first-ever leaderboard submission is capped at a flat number
  (500,000)**, not an account-age-aware bound. A Cloud Function could call
  `getAuth().getUser(uid)` to check real account creation time; rules can't
  reach the Auth Admin API, so this is a blunter (but still far better than
  nothing) substitute. If 500,000 turns out too tight or too loose once you
  see real play patterns, it's the easiest knob to tune — search for it in
  `firestore.rules`.
- **No true atomic rate-limiting across rapid-fire writes.** The elapsed-
  time check only compares against whatever the *previous accepted write*
  recorded — a client that fires many rejected write attempts in a burst
  doesn't get "locked out," it just keeps getting denied (rules don't have
  their own request-counting quota mechanism the way a Cloud Function with
  its own state could). In practice this doesn't matter much: rejected
  writes never touch the document, so there's nothing to exploit from
  spamming attempts, just wasted Firestore reads/writes quota on the
  attacker's own account.
- **The local save checksum is still not real anti-cheat.** It stops
  accidental corruption and casual tampering, but the salt ships in
  plaintext inside `public/script.js` — anyone can read it and recompute a
  valid checksum for a fabricated save. Fixing that for real would need the
  checksum secret to never reach the client, i.e. a server-side signing
  step — which needs a server (Cloud Function), which is exactly what this
  setup doesn't have right now.
- **No automated tests for `firestore.rules`.** Testing rules properly
  needs the Firebase Emulator Suite (`@firebase/rules-unit-testing` +
  the Firestore emulator) — not set up here, and not part of the CI
  workflow yet. Given how much logic now lives in the rules themselves
  (elapsed-time math, cross-document `get()` checks), this is the single
  highest-value thing to add next if you want more confidence before
  relying on this in production.
- **Guild creation/join/leave still aren't rate-limited or spam-hardened**,
  only `weeklyContrib` is. Lower priority than score integrity, but a real
  gap if guild membership itself becomes a ranked/scored thing later.
