// Firebase project config for Ramen Empire, from Firebase Console →
// Project settings → "Your apps" → SDK setup and configuration.
// This is safe to expose publicly (it's not a secret key) — Firebase uses
// separate security rules to actually protect data.
const firebaseConfig = {
  apiKey: "AIzaSyCu1DcxwhqE1vdQX7Y_hfpjceAQvJcgUg8",
  authDomain: "ramen-empire.firebaseapp.com",
  projectId: "ramen-empire",
  storageBucket: "ramen-empire.firebasestorage.app",
  messagingSenderId: "125426906566",
  appId: "1:125426906566:web:40c98196190f434c14aec7",
  measurementId: "G-1CJQKQGJL1"
};

// IMPORTANT: everything below is wrapped in a try/catch on purpose.
//
// Previously this file called firebase.initializeApp()/.auth()/.firestore()
// directly at the top level with no guard. If the Firebase CDN scripts ever
// fail to load or run — ad blockers (uBlock, Brave, Firefox tracking
// protection) commonly block *firebasejs*/*analytics* domains, plus offline
// use, corporate firewalls, or a flaky network — `firebase` would be
// undefined and `firebase.initializeApp(...)` would throw immediately.
// Because this file loads before script.js, that single uncaught error
// stopped `auth` and `db` from ever being defined. script.js later calls
// `auth.onAuthStateChanged(...)` at its own top level (not inside a
// function), so on any of those pages that ALSO threw immediately —
// aborting the rest of script.js before it got a chance to wire up the
// tap button, the save button, or the autosave interval. From the
// player's point of view the whole game looked broken/frozen with no
// obvious cause.
//
// The try/catch below makes Firebase failures non-fatal: if init fails for
// any reason, we fall back to no-op stand-ins for auth/db so the rest of
// the game (tapping, saving, autosaving, local progress) keeps working in
// "offline/guest mode" — the player just won't get cloud leaderboard/guild
// features until Firebase is reachable again.
let auth, db, analytics, googleProvider;
try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  googleProvider = new firebase.auth.GoogleAuthProvider();
  db = firebase.firestore();
  try {
    analytics = firebase.analytics();
  } catch (analyticsErr) {
    // Analytics is the single most-commonly-blocked piece (ad blockers
    // target it specifically) — losing it should never take down auth/db.
    console.warn('Ramen Empire: analytics unavailable, continuing without it.', analyticsErr);
    analytics = null;
  }
} catch (err) {
  console.warn('Ramen Empire: Firebase failed to load/initialize — running in offline/guest mode. Cloud saves, leaderboards, and guilds will be unavailable until this is fixed.', err);

  const noopSnapshot = { empty: true, docs: [], exists: false, data: () => null, size: 0 };
  const chainable = {
    where: () => chainable,
    orderBy: () => chainable,
    limit: () => chainable,
    collection: () => chainable,
    doc: () => chainable,
    get: () => Promise.resolve(noopSnapshot),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    onSnapshot: () => (() => {})
  };
  auth = {
    // Reports "signed out" so callers relying on this callback (script.js)
    // don't hang waiting for a Firebase response that will never come.
    // NOTE: real Firebase always fires onAuthStateChanged asynchronously
    // (never on the same tick it's registered), and script.js's own
    // top-level code relies on that — e.g. it declares `let myFriends`
    // further down the file than where this callback runs. Calling `cb`
    // synchronously here would fire before that declaration is reached and
    // throw a "Cannot access before initialization" error. setTimeout(...,0)
    // keeps this stub faithful to Firebase's real timing.
    onAuthStateChanged: (cb) => { setTimeout(() => cb(null), 0); return () => {}; },
    signInWithPopup: () => Promise.reject(new Error('Sign-in is unavailable right now — check your connection and try again.')),
    signOut: () => Promise.resolve()
  };
  googleProvider = null;
  db = { collection: () => chainable };
  analytics = null;
}
