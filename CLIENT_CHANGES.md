# Free-tier client changes (no Blaze / no Cloud Functions)

Make these two small edits. They work 100% on the free Spark plan.

---

## 1. Harden `submitScore()` in script.js

Find the existing `submitScore` function and replace its whole body with this:

```js
  function submitScore(){
    if(!firebaseUser) return;

    // Refuse to submit if the local save looks tampered with
    if(state.integrityFlag){
      console.warn('Ramen Empire: integrity flag set — skipping leaderboard submit');
      return;
    }

    // Client-side rate limit (already existed, kept here)
    const now = Date.now();
    if(now - lastLeaderboardSubmit < 30000) return;
    lastLeaderboardSubmit = now;

    // Extra client-side bounds (belt + suspenders with the rules)
    const cash = Math.max(0, Math.min(state.cash || 0, 1e18 - 1));
    const totalEarned = Math.max(0, Math.min(state.totalEarned || 0, 1e18 - 1));
    const weeklyEarned = Math.max(0, Math.min(state.weeklyEarned || 0, 1e16 - 1));
    const prestigePoints = Math.max(0, Math.min(state.prestigePoints || 0, 99999));

    db.collection('leaderboard').doc(firebaseUser.uid).set({
      name: (state.profile.name || firebaseUser.displayName || 'Anonymous').slice(0, 32),
      code: myFriendCode(),
      cash,
      totalEarned,
      weeklyEarned,
      weekId: state.weekId || null,
      prestigePoints,
      prestigeCount: state.prestigeCount || 0,
      guildId: state.guildId || null,
      guildName: state.guildName || null,
      seasonWins: state.seasonWins || 0,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.warn('Leaderboard submit failed', err));

    // Guild contribution (best-effort)
    if(state.guildId){
      contributeToGuild(weeklyEarned);
    }
  }
```

---

## 2. Slightly stronger local checksum (optional but free)

In the same file, replace `computeChecksum` with:

```js
  function computeChecksum(s){
    const { __checksum, ...rest } = s;
    let payload = SAVE_SALT + JSON.stringify(rest);
    let h = hashString(payload);
    // three rounds + include prestigeCount so a pure cash edit is more likely to fail
    for(let i = 0; i < 3; i++) h = hashString(h + SAVE_SALT + (s.prestigeCount || 0));
    return h;
  }
```

---

That’s all the code changes. No new script tags, no Functions SDK, nothing that costs money.
