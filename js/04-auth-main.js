/**
 * Ramen Empire — 04 Auth Main
 * Login/profile, leaderboard, friends, guilds, gifts, audio, game loop, init.
 *
 * This file is part of the split source. Run `node build-script.js` (or npm run build:script)
 * to concatenate js/*.js back into script.js for deployment.
 */
  // ---------- login / profile ----------
  // pendingProvider tracks which button the person tapped on the provider
  // step so submitProfile() knows what to store once the name+age step is
  // submitted. It's also pre-filled when re-opening the overlay to edit an
  // existing profile from Settings.
  let pendingProvider = null;
  const authOverlay = document.getElementById('authOverlay');
  const authStepProvider = document.getElementById('authStepProvider');
  const authStepProfile = document.getElementById('authStepProfile');
  const authNameInput = document.getElementById('authNameInput');
  const authAgeInput = document.getElementById('authAgeInput');
  const authError = document.getElementById('authError');
  const authCancelBtn = document.getElementById('authCancelBtn');

  function openAuthOverlay(mode){
    authError.style.display = 'none';
    if(mode === 'edit'){
      authStepProvider.style.display = 'none';
      authStepProfile.style.display = 'block';
      authNameInput.value = state.profile.name || '';
      authAgeInput.value = state.profile.age || '';
      pendingProvider = state.profile.provider;
      authCancelBtn.style.display = 'block';
    } else {
      authStepProvider.style.display = 'block';
      authStepProfile.style.display = 'none';
      authCancelBtn.style.display = 'none';
    }
    openModal(authOverlay);
  }
  function beginLogin(provider){
    pendingProvider = provider;
    authStepProvider.style.display = 'none';
    authStepProfile.style.display = 'block';
    authCancelBtn.style.display = 'none';
    authNameInput.focus();
  }
  function beginGoogleLogin(){
    authError.style.display = 'none';
    // onAuthStateChanged is the single source of truth after the popup.
    // It switches the save, loads any cloud progress, and either starts the
    // game (returning players) or opens the name+age step exactly once.
    // Doing the form logic here raced with the auth callback and caused the
    // age prompt to reappear on every login.
    auth.signInWithPopup(googleProvider).then(() => {
      pendingProvider = 'google';
      // Overlay / startGame decisions happen inside onAuthStateChanged.
    }).catch(err => {
      console.warn('Google sign-in failed', err);
      showAuthError('Google sign-in failed. Please try again.');
    });
  }
  document.getElementById('authGoogleBtn').addEventListener('click', beginGoogleLogin);
  document.getElementById('authGuestBtn').addEventListener('click', () => beginLogin('guest'));

  function showAuthError(msg){ authError.textContent = msg; authError.style.display = 'block'; }
  function submitProfile(){
    const name = authNameInput.value.trim();
    const age = parseInt(authAgeInput.value, 10);
    if(!name){ showAuthError('Please enter a name.'); authNameInput.focus(); return; }
    if(!authAgeInput.value || isNaN(age) || age < 5 || age > 120){ showAuthError('Please enter a valid age.'); authAgeInput.focus(); return; }
    state.profile = {
      name: name.slice(0, 24),
      age,
      provider: pendingProvider || (firebaseUser ? 'google' : null) || (state.profile && state.profile.provider) || 'guest'
    };
    state.onboarded = true;
    // Persist immediately under the active account key (guest or Google uid)
    if(firebaseUser) activeAccountId = firebaseUser.uid;
    save();
    // First-time profile: push to cloud right away so other devices see it
    if(firebaseUser) scheduleCloudSave(true);
    renderProfileSettings();
    closeModal(authOverlay);
    startGame();
  }
  document.getElementById('authSubmitBtn').addEventListener('click', submitProfile);
  authAgeInput.addEventListener('keydown', e => { if(e.key === 'Enter') submitProfile(); });
  authNameInput.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); authAgeInput.focus(); } });

  authCancelBtn.addEventListener('click', () => closeModal(authOverlay));
  authOverlay.addEventListener('click', e => { if(e.target === authOverlay) authOverlay.dispatchEvent(new CustomEvent('modal-dismiss')); });
  // Escape/backdrop dismissal only applies once a profile already exists
  // (i.e. this is an edit) — during first-run onboarding there's no game
  // state yet to fall back to, so dismissal is ignored and the person must
  // pick a provider and submit a name+age to proceed.
  authOverlay.addEventListener('modal-dismiss', () => { if(state.onboarded) closeModal(authOverlay); });

  document.getElementById('editProfileBtn').addEventListener('click', () => openAuthOverlay('edit'));
  function renderProfileSettings(){
    const el = document.getElementById('profileNameDisplay');
    if(!el) return;
    const providerLabel = {google:'Google', guest:'Guest'}[state.profile.provider] || 'Guest';
    el.textContent = state.profile.name ? `${state.profile.name}, ${state.profile.age} · ${providerLabel}` : '—';
  }

  // ---- tap effects toggle ----
  const tapFxBtn = document.getElementById('tapFxBtn');
  function renderTapFxBtn(){ tapFxBtn.textContent = state.tapFxEnabled ? 'On' : 'Off'; }
  tapFxBtn.addEventListener('click', () => {
    state.tapFxEnabled = !state.tapFxEnabled;
    renderTapFxBtn();
    save();
  });
  renderTapFxBtn();

  // ---- music / SFX toggles ----
  const musicBtn = document.getElementById('musicBtn');
  function renderMusicBtn(){ musicBtn.textContent = state.musicEnabled ? 'On' : 'Off'; }
  musicBtn.addEventListener('click', () => {
    state.musicEnabled = !state.musicEnabled;
    renderMusicBtn();
    save();
    if(state.musicEnabled) startMusic(); else stopMusic();
  });
  renderMusicBtn();

  const sfxBtn = document.getElementById('sfxBtn');
  function renderSfxBtn(){ sfxBtn.textContent = state.sfxEnabled ? 'On' : 'Off'; }
  sfxBtn.addEventListener('click', () => {
    state.sfxEnabled = !state.sfxEnabled;
    renderSfxBtn();
    save();
  });
  renderSfxBtn();

  // ---- log in (upgrade a Guest profile to Google) ----
  // Reuses the same signInWithPopup + profile-step flow as first-run
  // onboarding, but pre-fills the existing name/age so it reads as an
  // upgrade rather than a fresh signup. Local progress is untouched either
  // way — this only changes state.profile.provider and starts submitting
  // scores to the leaderboard under the new Google identity going forward.
  document.getElementById('loginGoogleBtn').addEventListener('click', () => {
    if(state.profile.provider === 'google' && firebaseUser){
      alert("You're already signed in with Google.");
      return;
    }
    // Same as beginGoogleLogin: let onAuthStateChanged switch the account
    // save, load cloud progress, and decide whether the age form is needed.
    // Avoids the race that re-showed the age prompt on every login.
    auth.signInWithPopup(googleProvider).then(() => {
      pendingProvider = 'google';
    }).catch(err => {
      console.warn('Google sign-in failed', err);
      alert('Google sign-in failed. Please try again.');
    });
  });

  // ---- log out ----
  // Signs out of the Google/Firebase session only. Local progress lives in
  // localStorage regardless of auth state, so nothing about the save is
  // touched — this just stops leaderboard submissions under this identity
  // and drops the player's profile back to Guest until they sign in again.
  // Always visible (rather than hidden for non-Google profiles) and always
  // gives a visible result, so it never looks like a dead button.
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if(state.profile.provider !== 'google' || !firebaseUser){
      alert("You're playing as a guest — there's no account to log out of.");
      return;
    }
    // Save this Google account's progress under its own key (and cloud), then
    // sign out. onAuthStateChanged will switch the live game to the guest
    // save so the next person on this device does not see this account's empire.
    save();
    scheduleCloudSave(true);
    auth.signOut().then(() => {
      // switchAccount is also triggered by onAuthStateChanged(null); call
      // defensively in case the stub auth path does not fire.
      switchAccount('guest');
      renderProfileSettings();
      alert('Logged out. This account\'s progress is saved (including cloud) — guest mode will not show it.');
    }).catch(err => {
      console.warn('Sign out failed', err);
      alert('Log out failed — check your connection and try again.');
    });
  });

  // ---------- leaderboard ----------
  // Only signed-in Google players get a leaderboard entry — guests have no
  // Firebase auth session, so firebaseUser stays null for them and
  // submitScore()/renderLeaderboard() below simply skip writing for them.
  // (firebaseUser / myFriends / authInitDone are declared near the top of
  // the persistence section so cloud helpers can use them safely.)
  auth.onAuthStateChanged(user => {
    const prevId = activeAccountId;
    firebaseUser = user;
    myFriends = []; // stale for a new session/account — reloaded on next Friends tab open

    const nextId = user ? user.uid : 'guest';

    // Helper: open the profile step directly when already authenticated
    // (skip the "Continue with Google" provider screen — they already did).
    function openProfileGateForUser(u){
      pendingProvider = 'google';
      authError.style.display = 'none';
      authStepProvider.style.display = 'none';
      authStepProfile.style.display = 'block';
      authCancelBtn.style.display = 'none';
      authNameInput.value = (state.profile && state.profile.name || (u && u.displayName) || '').slice(0, 24);
      authAgeInput.value = (state.profile && state.profile.age) || '';
      openModal(authOverlay);
      // Prefer focusing the empty field
      if(!authNameInput.value) authNameInput.focus();
      else authAgeInput.focus();
    }

    if(!authInitDone){
      // First auth callback of this page load: migrate legacy shared save,
      // then load the correct account slot. Do not "switch" from a phantom
      // previous account (nothing was in memory yet).
      authInitDone = true;
      activeAccountId = nextId;
      migrateLegacySaveOnce();
      loadFromKey(currentSaveKey());
      // Pull cloud progress for returning Google users (other devices).
      const finishInit = () => {
        if(user && state.profile){
          if(hasCompleteProfile(state)){
            state.onboarded = true;
            state.profile.provider = 'google';
          }
        }
        renderProfileSettings();
        if(hasCompleteProfile(state)){
          state.onboarded = true;
          startGame();
          // Best-effort: push local to cloud so the other device has a baseline
          if(user) scheduleCloudSave(true);
        } else if(user){
          // Already signed in but this account never finished name+age
          openProfileGateForUser(user);
        } else {
          openAuthOverlay('onboard');
        }
      };
      if(user){
        maybeLoadCloudSave().then(() => finishInit());
      } else {
        finishInit();
      }
      return;
    }

    // Subsequent auth changes: real login / logout / account switch
    if(nextId === prevId) return;
    switchAccount(nextId, {
      googleProfile: user ? {
        name: (user.displayName || '').slice(0, 24),
        provider: 'google'
      } : null,
      // Carry guest progress into a brand-new Google account the first time
      // the player links one on this device.
      seedFromGuest: (prevId === 'guest' && !!user)
    });
    renderProfileSettings();
    // Only ask name/age if THIS account has never completed a profile.
    // Cloud load inside switchAccount may have already filled it.
    if(hasCompleteProfile(state)){
      state.onboarded = true;
      if(user) state.profile.provider = 'google';
      save();
      if(user) scheduleCloudSave(true);
      startGame();
      closeModal(authOverlay);
    } else if(user){
      openProfileGateForUser(user);
    } else {
      openAuthOverlay('onboard');
    }
  });

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---- weekly leaderboard period (ISO week, e.g. "2026-W31") ----
  function getWeekId(date){
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
    d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday defines the ISO week/year
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const weekNum = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  function currentWeekId(){ return getWeekId(new Date()); }
  function previousWeekId(){ const d = new Date(); d.setDate(d.getDate() - 7); return getWeekId(d); }

  // Checked frequently (see the AFFORDABILITY_REFRESH_MS interval below) but
  // only does anything the moment the ISO week actually rolls over. When it
  // does, it best-effort snapshots the week that just ended into
  // leaderboardSeasons/{weekId} so the "last week's champion" banner and
  // trophy badges have something to read — see the doc-exists check below,
  // which keeps this idempotent no matter which online client's clock fires
  // first.
  function ensureWeeklyPeriod(){
    const wid = currentWeekId();
    if(state.weekId === wid) return;
    const endedWeekId = state.weekId;
    state.weekId = wid;
    state.weeklyEarned = 0;
    if(!endedWeekId || !firebaseUser) return;
    db.collection('leaderboard').where('weekId', '==', endedWeekId)
      .orderBy('weeklyEarned', 'desc').limit(1).get().then(snap => {
        if(snap.empty) return;
        const top = snap.docs[0];
        const seasonRef = db.collection('leaderboardSeasons').doc(endedWeekId);
        seasonRef.get().then(doc => {
          if(doc.exists) return; // another client already recorded this week
          seasonRef.set({
            uid: top.id,
            name: top.data().name || 'Anonymous',
            weeklyEarned: top.data().weeklyEarned || 0
          }).catch(err => console.warn('Season snapshot failed', err));
          if(top.id === firebaseUser.uid) state.seasonWins = (state.seasonWins || 0) + 1;
        });
      }).catch(err => console.warn('Weekly champion lookup failed', err));
  }

  // ---- friends ----
  // A player's "code" is just a slice of their own uid, so it needs no extra
  // write to generate or look up — anyone can find a uid from its code via
  // the leaderboard collection (see addFriendByCode) without new security
  // rules beyond read access already required for the leaderboard itself.
  function myFriendCode(){ return firebaseUser ? firebaseUser.uid.slice(0, 6).toUpperCase() : null; }
  function loadFriends(){
    if(!firebaseUser) return Promise.resolve([]);
    return db.collection('friends').doc(firebaseUser.uid).get().then(doc => {
      myFriends = (doc.exists && doc.data().list) || [];
      return myFriends;
    }).catch(err => { console.warn('Load friends failed', err); return myFriends; });
  }
  // One-directional "follow" model: adding a friend only ever writes to your
  // own friends/{uid} doc, so no permission to write another player's data
  // is ever needed — you can see anyone whose code you have, whether or not
  // they've added you back.
  function removeFriend(uid){
    if(!firebaseUser || !uid) return Promise.reject(new Error('Not signed in'));
    return db.collection('friends').doc(firebaseUser.uid).get().then(doc => {
      const list = (doc.exists && doc.data().list) || [];
      const next = list.filter(id => id !== uid);
      return db.collection('friends').doc(firebaseUser.uid).set({ list: next }, { merge: true }).then(() => {
        myFriends = next;
        if(currentLbMode === 'friends') renderLeaderboard();
        const statusEl = document.getElementById('addFriendStatus');
        if(statusEl) statusEl.textContent = 'Friend removed.';
      });
    });
  }
  function addFriendByCode(rawCode){
    const statusEl = document.getElementById('addFriendStatus');
    if(!firebaseUser){ statusEl.textContent = 'Sign in with Google to add friends.'; return; }
    const code = (rawCode || '').trim().toUpperCase();
    if(!code) return;
    if(code === myFriendCode()){ statusEl.textContent = "That's your own code!"; return; }
    statusEl.textContent = 'Looking up player…';
    db.collection('leaderboard').where('code', '==', code).limit(1).get().then(snap => {
      if(snap.empty){ statusEl.textContent = 'No player found with that code.'; return; }
      const found = snap.docs[0];
      if(myFriends.includes(found.id)){ statusEl.textContent = 'Already on your friends list.'; return; }
      return db.collection('friends').doc(firebaseUser.uid).set({
        list: firebase.firestore.FieldValue.arrayUnion(found.id)
      }, { merge: true }).then(() => {
        myFriends.push(found.id);
        statusEl.textContent = `Added ${found.data().name || 'player'}!`;
        document.getElementById('friendCodeInput').value = '';
        if(currentLbMode === 'friends') renderLeaderboard();
      });
    }).catch(err => { console.warn('Add friend failed', err); statusEl.textContent = 'Something went wrong — try again.'; });
  }

  let lastLeaderboardSubmit = 0;
  function submitScore(){
    if(!firebaseUser) return;

    // Refuse to submit if the local save looks tampered with
    if(state.integrityFlag){
      console.warn('Ramen Empire: integrity flag set — skipping leaderboard submit');
      return;
    }

    // Client-side rate limit. Firestore rules enforce their own minimum
    // interval too (see firestore.rules) — this just avoids firing writes
    // we know would be rejected.
    const now = Date.now();
    if(now - lastLeaderboardSubmit < 30000) return;
    lastLeaderboardSubmit = now;

    // Extra client-side bounds (belt + suspenders — firestore.rules does
    // the real, elapsed-time-aware plausibility check server-side; these
    // just stop obviously-broken values from even being sent)
    const cash = Math.max(0, Math.min(totalCash() || 0, 1e18 - 1));
    const totalEarned = Math.max(0, Math.min(state.totalEarned || 0, 1e18 - 1));
    const weeklyEarned = Math.max(0, Math.min(state.weeklyEarned || 0, 1e16 - 1));
    const prestigePoints = Math.max(0, Math.min(state.prestigePoints || 0, 99999));

    // NOTE: this writes to Firestore directly — there's no Cloud Function
    // in front of it (those need the paid Blaze plan). Instead
    // firestore.rules does real server-side validation itself: it reads
    // the previous doc, compares elapsed time (via request.time, which the
    // client can't forge) against the reported ratePerSec, and rejects
    // implausible growth — not just a static "cash < some huge number"
    // bound. See firestore.rules and SECURITY.md for exactly what that
    // does and doesn't catch.
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
      ratePerSec: Math.max(0, Math.min(totalRatePerSec(), 1e12)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.warn('Leaderboard submit failed', err));

    // Guild contribution (best-effort)
    if(state.guildId){
      contributeToGuild(weeklyEarned);
    }
  }

  // ---- guilds / clans ----
  // Guild docs live at guilds/{guildId}. Members are stored as an array of
  // uids. weeklyContrib tracks shared progress toward the weekly goal; it
  // resets when weekId rolls. Same integrity caveats as the rest of the
  // client-side social layer — security rules must allow authenticated
  // create/join/contribute writes.
  const GUILD_MAX_MEMBERS = 10;
  const GUILD_WEEKLY_GOAL_BASE = 1e6; // base shared goal; scales mildly with member count at display time
  let myGuildCache = null; // last fetched guild doc data
  let lastGuildContribute = 0;

  function makeGuildCode(){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for(let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }
  function guildWeeklyGoal(memberCount){
    return GUILD_WEEKLY_GOAL_BASE * Math.max(1, memberCount || 1);
  }
  function createGuild(rawName){
    const statusEl = document.getElementById('guildStatus');
    if(!firebaseUser){ statusEl.textContent = 'Sign in with Google to create a guild.'; return; }
    if(state.guildId){ statusEl.textContent = 'Leave your current guild first.'; return; }
    const name = (rawName || '').trim().slice(0, 20);
    if(name.length < 2){ statusEl.textContent = 'Name must be at least 2 characters.'; return; }
    statusEl.textContent = 'Creating…';
    const code = makeGuildCode();
    const ref = db.collection('guilds').doc();
    const wid = currentWeekId();
    ref.set({
      name,
      code,
      ownerUid: firebaseUser.uid,
      members: [firebaseUser.uid],
      memberNames: { [firebaseUser.uid]: state.profile.name || firebaseUser.displayName || 'Anonymous' },
      weeklyContrib: 0,
      weekId: wid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      state.guildId = ref.id;
      state.guildName = name;
      myGuildCache = null;
      statusEl.textContent = `Created "${name}" — code ${code}`;
      document.getElementById('guildNameInput').value = '';
      // Initialize our per-member progress doc up front so contributeToGuild
      // never has to handle "doc doesn't exist yet" — see firestore.rules'
      // memberProgress block and SECURITY.md for why this matters.
      ref.collection('memberProgress').doc(firebaseUser.uid).set({
        weeklyEarned: 0, weekId: wid, ratePerSec: 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(err => console.warn('memberProgress init failed', err));
      save();
      submitScore();
      if(currentLbMode === 'guilds') renderLeaderboard();
    }).catch(err => {
      console.warn('Create guild failed', err);
      statusEl.textContent = 'Could not create guild — check Firestore rules.';
    });
  }
  function joinGuildByCode(rawCode){
    const statusEl = document.getElementById('guildStatus');
    if(!firebaseUser){ statusEl.textContent = 'Sign in with Google to join a guild.'; return; }
    if(state.guildId){ statusEl.textContent = 'Leave your current guild first.'; return; }
    const code = (rawCode || '').trim().toUpperCase();
    if(!code) return;
    statusEl.textContent = 'Looking up guild…';
    db.collection('guilds').where('code', '==', code).limit(1).get().then(snap => {
      if(snap.empty){ statusEl.textContent = 'No guild found with that code.'; return; }
      const doc = snap.docs[0];
      const data = doc.data();
      const members = data.members || [];
      if(members.includes(firebaseUser.uid)){ statusEl.textContent = 'Already a member.'; return; }
      if(members.length >= GUILD_MAX_MEMBERS){ statusEl.textContent = 'Guild is full (max ' + GUILD_MAX_MEMBERS + ').'; return; }
      const nameField = 'memberNames.' + firebaseUser.uid;
      return doc.ref.update({
        members: firebase.firestore.FieldValue.arrayUnion(firebaseUser.uid),
        [nameField]: state.profile.name || firebaseUser.displayName || 'Anonymous'
      }).then(() => {
        state.guildId = doc.id;
        state.guildName = data.name || 'Guild';
        myGuildCache = null;
        statusEl.textContent = `Joined "${state.guildName}"!`;
        document.getElementById('guildCodeInput').value = '';
        // Same as createGuild — make sure our memberProgress doc exists
        // before we ever try to contribute.
        doc.ref.collection('memberProgress').doc(firebaseUser.uid).set({
          weeklyEarned: 0, weekId: data.weekId || currentWeekId(), ratePerSec: 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => console.warn('memberProgress init failed', err));
        save();
        submitScore();
        if(currentLbMode === 'guilds') renderLeaderboard();
      });
    }).catch(err => {
      console.warn('Join guild failed', err);
      statusEl.textContent = 'Could not join — check Firestore rules.';
    });
  }
  function leaveGuild(){
    const statusEl = document.getElementById('guildStatus');
    if(!firebaseUser || !state.guildId) return;
    const gid = state.guildId;
    statusEl.textContent = 'Leaving…';
    const ref = db.collection('guilds').doc(gid);
    ref.get().then(doc => {
      if(!doc.exists){
        state.guildId = null; state.guildName = null; myGuildCache = null; save();
        statusEl.textContent = 'Left guild.';
        if(currentLbMode === 'guilds') renderLeaderboard();
        return;
      }
      const data = doc.data();
      const updates = {
        members: firebase.firestore.FieldValue.arrayRemove(firebaseUser.uid)
      };
      // Owner leaving: transfer ownership to next member if any
      if(data.ownerUid === firebaseUser.uid){
        const rest = (data.members || []).filter(u => u !== firebaseUser.uid);
        updates.ownerUid = rest[0] || null;
      }
      return ref.update(updates).then(() => {
        state.guildId = null;
        state.guildName = null;
        myGuildCache = null;
        save();
        submitScore();
        statusEl.textContent = 'Left guild.';
        if(currentLbMode === 'guilds') renderLeaderboard();
      });
    }).catch(err => {
      console.warn('Leave guild failed', err);
      statusEl.textContent = 'Could not leave guild.';
    });
  }
  function contributeToGuild(weeklyEarned){
    if(!firebaseUser || !state.guildId) return;
    const now = Date.now();
    // Client-side throttle — firestore.rules enforces its own minimum
    // interval too (see the memberProgress rules below), this just avoids
    // a write we know would be rejected.
    if(now - lastGuildContribute < 60000) return;
    lastGuildContribute = now;
    const wid = currentWeekId();
    const rate = Math.max(0, Math.min(totalRatePerSec(), 1e12));
    const earned = Math.max(0, Math.min(weeklyEarned || 0, 1e16 - 1));

    // No Cloud Function available on the free Spark plan, so this uses a
    // client-side Firestore transaction (still fully supported without
    // Cloud Functions/Blaze) instead of one server-validated call:
    //
    //  1. Read guilds/{id}/memberProgress/{uid} — our own last known
    //     weeklyEarned + when. This doc is single-writer (only we can
    //     write it — see firestore.rules), so the rate/growth check on it
    //     is clean and can't be confused by other members contributing at
    //     the same time.
    //  2. Compute the delta since our last recorded contribution.
    //  3. In the SAME transaction, update guilds/{id}.weeklyContrib (as an
    //     increment, or a reset if the shared week rolled over) and
    //     overwrite our memberProgress doc with the new snapshot. The
    //     transaction keeps both writes atomic, so two members hitting a
    //     week rollover at the same moment can't both "reset" and stomp
    //     on each other.
    //
    // firestore.rules bounds the memberProgress write against elapsed
    // time (can't be forged — request.time is server-set), and bounds the
    // guild's weeklyContrib change by reading that same memberProgress
    // doc via get(). See SECURITY.md for what this catches vs. a full
    // Cloud Function, if that's ever affordable later.
    const guildRef = db.collection('guilds').doc(state.guildId);
    const progressRef = guildRef.collection('memberProgress').doc(firebaseUser.uid);

    db.runTransaction(tx => {
      return Promise.all([tx.get(progressRef), tx.get(guildRef)]).then(([progSnap, guildSnap]) => {
        if(!guildSnap.exists) return;
        const prev = progSnap.exists ? progSnap.data() : null;
        const prevEarned = (prev && prev.weekId === wid) ? (prev.weeklyEarned || 0) : 0;
        const delta = Math.max(0, earned - prevEarned);

        const progressWrite = { weeklyEarned: earned, weekId: wid, ratePerSec: rate, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        if(delta < 1){
          // Nothing new, but still refresh our timestamp so the rate
          // limit window advances instead of retrying the same no-op.
          tx.set(progressRef, progressWrite, { merge: true });
          return;
        }

        const guildData = guildSnap.data();
        if(guildData.weekId !== wid){
          tx.update(guildRef, { weeklyContrib: delta, weekId: wid });
        } else {
          tx.update(guildRef, { weeklyContrib: firebase.firestore.FieldValue.increment(delta) });
        }
        tx.set(progressRef, progressWrite, { merge: true });
      });
    }).catch(err => console.warn('Guild contribute failed', err));
  }

  function loadMyGuild(){
    if(!state.guildId) return Promise.resolve(null);
    return db.collection('guilds').doc(state.guildId).get().then(doc => {
      if(!doc.exists){
        state.guildId = null; state.guildName = null; myGuildCache = null; save();
        return null;
      }
      myGuildCache = Object.assign({ __id: doc.id }, doc.data());
      // Ensure week is current for display
      if(myGuildCache.weekId !== currentWeekId()){
        myGuildCache.weeklyContrib = 0;
        myGuildCache.weekId = currentWeekId();
      }
      state.guildName = myGuildCache.name || state.guildName;
      return myGuildCache;
    }).catch(err => { console.warn('Load guild failed', err); return myGuildCache; });
  }

  // ---- gifting (GDD Part 9 — expanded types) ----
  // Gifts are written to gifts/{toUid}/inbox/{fromUid_date} so each sender
  // can only leave one gift per recipient per day (doc id enforces it).
  // Recipients claim by reading their inbox and deleting claimed docs.
  function giftAmount(){
    return Math.max(50, Math.round(Math.max(totalRatePerSec(), 1) * 25));
  }
  function resetGiftDayIfNeeded(){
    const today = todayKey();
    if(state.gifts.lastGiftDate !== today){
      state.gifts.lastGiftDate = today;
      state.gifts.giftedToday = {};
    }
  }
  function canGiftFriend(uid){
    resetGiftDayIfNeeded();
    return !state.gifts.giftedToday[uid];
  }
  function pickGiftType(){
    // Use last selected type if set, else weighted random from GIFT_TYPES
    if(state.lastGiftType && GIFT_TYPES.some(g => g.id === state.lastGiftType)){
      return GIFT_TYPES.find(g => g.id === state.lastGiftType);
    }
    const total = GIFT_TYPES.reduce((s, g) => s + g.weight, 0);
    let roll = Math.random() * total;
    for(const g of GIFT_TYPES){
      roll -= g.weight;
      if(roll <= 0) return g;
    }
    return GIFT_TYPES[0];
  }
  function sendGift(toUid, toName){
    if(!firebaseUser) return Promise.reject(new Error('Not signed in'));
    if(toUid === firebaseUser.uid) return Promise.reject(new Error('Cannot gift yourself'));
    resetGiftDayIfNeeded();
    if(state.gifts.giftedToday[toUid]) return Promise.reject(new Error('Already gifted today'));
    const gtype = pickGiftType();
    const amount = giftAmount();
    const today = todayKey();
    const giftId = firebaseUser.uid + '_' + today;
    const payload = {
      fromUid: firebaseUser.uid,
      fromName: state.profile.name || firebaseUser.displayName || 'Anonymous',
      giftType: gtype.id,
      amount: gtype.id === 'cash' ? amount : 0,
      boost: gtype.id === 'boost' ? 0.08 : (gtype.id === 'cash' ? 0.05 : 0),
      tokens: gtype.id === 'tokens' ? 5 : 0,
      diamonds: gtype.id === 'gems' ? 1 : 0,
      ingredients: gtype.id === 'ingredients' ? 3 : 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      dateKey: today
    };
    return db.collection('gifts').doc(toUid).collection('inbox').doc(giftId).set(payload).then(() => {
      state.gifts.giftedToday[toUid] = true;
      state.giftsSent = (state.giftsSent || 0) + 1;
      state.friendshipPoints = (state.friendshipPoints || 0) + (CONFIG.FRIENDSHIP_PER_GIFT || 5);
      save();
      if(typeof checkAchievements === 'function') checkAchievements();
      return { amount, toName, giftType: gtype };
    });
  }
  function claimPendingGifts(){
    if(!firebaseUser) return Promise.resolve([]);
    return db.collection('gifts').doc(firebaseUser.uid).collection('inbox').get().then(snap => {
      if(snap.empty) return [];
      const claimed = [];
      const batch = db.batch();
      snap.forEach(doc => {
        const data = doc.data();
        if(state.gifts.pendingClaimed[doc.id]) return;
        if(data.amount){
          addCountryCash(state.activeCountry, data.amount || 0);
          addEarned(data.amount || 0);
        }
        if(data.boost) applyGiftBoost(data.boost);
        if(data.tokens && typeof earnEventTokens === 'function') earnEventTokens(data.tokens);
        if(data.diamonds) earnDiamonds(data.diamonds);
        if(data.ingredients && typeof addIngredient === 'function'){
          const pool = ['noodles','broth','egg','nori','spice','mushroom'];
          for(let i = 0; i < data.ingredients; i++) addIngredient(pool[Math.floor(Math.random()*pool.length)], 1);
        }
        state.gifts.pendingClaimed[doc.id] = true;
        state.giftsReceived = (state.giftsReceived || 0) + 1;
        claimed.push(data);
        batch.delete(doc.ref);
      });
      if(claimed.length){
        save();
        renderStats();
        return batch.commit().then(() => claimed).catch(() => claimed);
      }
      return claimed;
    }).catch(err => { console.warn('Claim gifts failed', err); return []; });
  }
  let giftBoostEndsAt = 0;
  let giftBoostAmount = 0;
  function applyGiftBoost(boost){
    giftBoostAmount = Math.max(giftBoostAmount, boost || 0.05);
    giftBoostEndsAt = Date.now() + 10 * 60 * 1000;
  }
  function giftBoostMultiplier(){
    if(Date.now() >= giftBoostEndsAt) return 1;
    return 1 + giftBoostAmount;
  }

  // ---- restaurant visits (GDD Part 9) ----
  function canVisitFriend(uid){
    if(!state.visitLog) state.visitLog = {};
    const last = state.visitLog[uid] || 0;
    return Date.now() - last >= (CONFIG.VISIT_COOLDOWN_MS || 3600000);
  }
  function visitFriendRestaurant(uid, name, friendData){
    if(!firebaseUser) return { ok:false, msg:'Sign in to visit friends.' };
    if(!canVisitFriend(uid)) return { ok:false, msg:'Already visited recently. Try again later.' };
    state.visitLog[uid] = Date.now();
    state.visitsMade = (state.visitsMade || 0) + 1;
    state.friendshipPoints = (state.friendshipPoints || 0) + (CONFIG.FRIENDSHIP_PER_VISIT || 2);

    // Leave a tip (costs visitor a little, pure social — no transfer, local flavor)
    const tip = Math.max(1, Math.round(Math.max(totalRatePerSec(), 1) * (CONFIG.VISIT_TIP_SECONDS || 15)));
    // Inspiration: chance for research points from inspecting layout
    let inspired = false;
    if(Math.random() < (CONFIG.VISIT_INSPIRATION_CHANCE || 0.25)){
      state.researchPoints = (state.researchPoints || 0) + 1;
      inspired = true;
    }
    // Like bonus — small satisfaction/fame bump
    if(typeof adjustFame === 'function') adjustFame(1);
    if(typeof adjustSatisfaction === 'function') adjustSatisfaction(1);

    // Compare progress summary
    const theirCash = friendData && friendData.totalEarned ? friendData.totalEarned : 0;
    const myCash = state.totalEarned || 0;
    let compare = 'You\'re neck and neck!';
    if(myCash > theirCash * 1.2) compare = 'Your empire is ahead!';
    else if(theirCash > myCash * 1.2) compare = 'They\'re pulling ahead — time to grind!';

    save();
    if(typeof checkAchievements === 'function') checkAchievements();
    renderStats();
    return {
      ok: true,
      msg: `Visited ${name || 'friend'}! Left a tip worth ${typeof fmt === 'function' ? fmt(tip) : tip}. ${inspired ? '💡 Inspiration: +1 Research! ' : ''}${compare}`,
      tip, inspired, compare
    };
  }

  function lbSplitIntoChunks(arr, size){
    const out = [];
    for(let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function renderChampionBanner(){
    const banner = document.getElementById('lbChampionBanner');
    db.collection('leaderboardSeasons').doc(previousWeekId()).get().then(doc => {
      if(!doc.exists){ banner.style.display = 'none'; return; }
      banner.style.display = 'block';
      banner.textContent = `🏆 Last week's champion: ${escapeHtml(doc.data().name || 'Anonymous')}`;
    }).catch(() => { banner.style.display = 'none'; });
  }

  let currentLbMode = 'global'; // 'global' | 'weekly' | 'friends' | 'guilds'
  function renderLbRows(rows, cashField, opts){
    opts = opts || {};
    const statusEl = document.getElementById('leaderboardStatus');
    const listEl = document.getElementById('leaderboardList');
    statusEl.style.display = 'none';
    if(!rows.length){
      const emptyMsg = currentLbMode === 'friends'
        ? 'Add a friend\u2019s code above to see them here.'
        : currentLbMode === 'guilds'
          ? 'Create or join a guild above to compete.'
          : 'No scores yet — be the first!';
      listEl.innerHTML = `<div class="settings-item"><span>${emptyMsg}</span></div>`;
      return;
    }
    listEl.innerHTML = rows.map((d, i) => {
      const isMe = firebaseUser && d.__id === firebaseUser.uid;
      const wins = d.seasonWins || 0;
      const trophy = wins ? ` <span class="lb-trophy" title="${wins} weekly win(s)">🏆${wins > 1 ? '×' + wins : ''}</span>` : '';
      let giftBtn = '';
      let visitBtn = '';
      if(opts.showGift && firebaseUser && d.__id !== firebaseUser.uid){
        const can = canGiftFriend(d.__id);
        giftBtn = `<button class="gift-btn" data-action="gift" data-uid="${d.__id}" data-name="${escapeHtml(d.name || 'player')}" ${can ? '' : 'disabled'} title="${can ? 'Send a daily gift' : 'Already gifted today'}">🎁</button>`;
        const canV = canVisitFriend(d.__id);
        visitBtn = `<button class="gift-btn" data-action="visit" data-uid="${d.__id}" data-name="${escapeHtml(d.name || 'player')}" ${canV ? '' : 'disabled'} title="${canV ? 'Visit restaurant' : 'Visited recently'}">🚪</button>`;
        visitBtn += `<button class="gift-btn" data-action="unfriend" data-uid="${d.__id}" title="Remove friend">✕</button>`;
      }
      const gTag = d.guildName ? ` <span class="lb-guild-tag">${escapeHtml(d.guildName)}</span>` : '';
      return `<div class="lb-row${isMe ? ' me' : ''}" data-uid="${d.__id||''}"><span class="lb-rank">#${i + 1}</span><span class="lb-name">${escapeHtml(d.name || 'Anonymous')}${trophy}${gTag}</span>${visitBtn}${giftBtn}<span class="lb-cash">¥${fmt(d[cashField] || 0)}</span></div>`;
    }).join('');
  }

  function renderGuildPanel(){
    const box = document.getElementById('lbGuildBox');
    if(!box) return;
    box.style.display = currentLbMode === 'guilds' ? 'flex' : 'none';
    if(currentLbMode !== 'guilds') return;
    const statusEl = document.getElementById('guildStatus');
    if(!firebaseUser){
      box.querySelector('.guild-joined') && (box.querySelector('.guild-joined').style.display = 'none');
      box.querySelector('.guild-create') && (box.querySelector('.guild-create').style.display = 'none');
      statusEl.textContent = 'Sign in with Google to use guilds.';
      return;
    }
    loadMyGuild().then(g => {
      const joined = box.querySelector('.guild-joined');
      const create = box.querySelector('.guild-create');
      if(g){
        joined.style.display = 'block';
        create.style.display = 'none';
        const members = g.members || [];
        const goal = guildWeeklyGoal(members.length);
        const contrib = g.weeklyContrib || 0;
        const pct = Math.min(100, Math.round((contrib / goal) * 100));
        document.getElementById('myGuildName').textContent = g.name || 'Guild';
        document.getElementById('myGuildCode').textContent = g.code || '—';
        document.getElementById('myGuildMembers').textContent = members.length + ' / ' + GUILD_MAX_MEMBERS;
        document.getElementById('guildGoalFill').style.width = pct + '%';
        document.getElementById('guildGoalText').textContent = fmt(contrib) + ' / ' + fmt(goal) + ' this week';
        // Guild project (GDD Part 9)
        const projEl = document.getElementById('guildProjectInfo');
        if(projEl){
          const proj = GUILD_PROJECTS[(g.weekId || '').length % GUILD_PROJECTS.length] || GUILD_PROJECTS[0];
          const pGoal = CONFIG.GUILD_PROJECT_GOAL || 5e7;
          const pPct = Math.min(100, Math.round((contrib / pGoal) * 100));
          projEl.innerHTML = `<div style="margin-top:10px; font-size:12px;"><strong>${proj.icon} Project: ${proj.name}</strong><div style="opacity:0.75; margin-top:2px;">${proj.desc}</div>
            <div class="chal-progress" style="margin-top:6px;"><div class="chal-progress-fill" style="width:${pPct}%"></div></div>
            <div style="font-size:11px; opacity:0.7; margin-top:3px;">${fmt(contrib)} / ${fmt(pGoal)} · finish for bonus tokens</div></div>`;
        }
        statusEl.textContent = '';
      } else {
        joined.style.display = 'none';
        create.style.display = 'block';
        statusEl.textContent = '';
      }
    });
  }

  function renderLeaderboard(){
    const statusEl = document.getElementById('leaderboardStatus');
    const listEl = document.getElementById('leaderboardList');
    const friendsBox = document.getElementById('lbFriendsBox');
    friendsBox.style.display = currentLbMode === 'friends' ? 'flex' : 'none';
    if(currentLbMode === 'friends'){
      document.getElementById('myFriendCode').textContent = myFriendCode() || 'Sign in to get a code';
      const fp = document.getElementById('friendshipDisplay');
      if(fp) fp.textContent = Math.floor(state.friendshipPoints || 0);
      const gs = document.getElementById('giftsSentDisplay');
      if(gs) gs.textContent = state.giftsSent || 0;
      const vs = document.getElementById('visitsDisplay');
      if(vs) vs.textContent = state.visitsMade || 0;
      const gts = document.getElementById('giftTypeSelect');
      if(gts){
        gts.value = state.lastGiftType || 'cash';
        gts.onchange = () => { state.lastGiftType = gts.value; save(); };
      }
      const fdb = document.getElementById('friendshipDailyBtn');
      if(fdb){
        const claimed = state.friendshipDailyClaimed === (typeof todayKey === 'function' ? todayKey() : '');
        fdb.disabled = claimed || (state.friendshipPoints||0) < 10;
        fdb.onclick = () => { claimFriendshipDaily(); renderLeaderboard(); };
      }
      const feed = document.getElementById('socialFeedBox');
      if(feed){
        feed.innerHTML = (state.socialFeed||[]).slice(0,8).map(x => `<div>• ${x.msg}</div>`).join('') || '<div style="opacity:0.5;">Social feed empty</div>';
      }
    }
    renderGuildPanel();
    renderChampionBanner();
    statusEl.style.display = 'flex';
    statusEl.querySelector('span').textContent = 'Loading leaderboard…';
    listEl.innerHTML = '';

    // Claim any pending gifts when opening Rank tab
    if(firebaseUser){
      claimPendingGifts().then(claimed => {
        if(claimed && claimed.length){
          const total = claimed.reduce((s, g) => s + (g.amount || 0), 0);
          const status = document.getElementById('addFriendStatus');
          if(status && currentLbMode === 'friends'){
            status.textContent = `Received ${claimed.length} gift(s) totaling ${fmt(total)}!`;
          }
        }
      });
    }

    if(currentLbMode === 'global'){
      db.collection('leaderboard').orderBy('totalEarned', 'desc').limit(50).get().then(snap => {
        renderLbRows(snap.docs.map(doc => Object.assign({ __id: doc.id }, doc.data())), 'totalEarned');
      }).catch(err => {
        console.warn('Leaderboard load failed', err);
        statusEl.querySelector('span').textContent = 'Could not load leaderboard.';
      });
    } else if(currentLbMode === 'weekly'){
      db.collection('leaderboard').where('weekId', '==', currentWeekId())
        .orderBy('weeklyEarned', 'desc').limit(50).get().then(snap => {
          renderLbRows(snap.docs.map(doc => Object.assign({ __id: doc.id }, doc.data())), 'weeklyEarned');
        }).catch(err => {
          console.warn('Weekly leaderboard load failed', err);
          statusEl.querySelector('span').textContent = 'Could not load weekly leaderboard.';
        });
    } else if(currentLbMode === 'friends'){
      loadFriends().then(friendUids => {
        const ids = firebaseUser ? Array.from(new Set([firebaseUser.uid, ...friendUids])) : friendUids;
        if(!ids.length){ renderLbRows([], 'totalEarned', { showGift: true }); return; }
        Promise.all(lbSplitIntoChunks(ids, 10).map(group =>
          db.collection('leaderboard').where(firebase.firestore.FieldPath.documentId(), 'in', group).get()
        )).then(snaps => {
          const docs = [];
          snaps.forEach(snap => snap.forEach(doc => docs.push(Object.assign({ __id: doc.id }, doc.data()))));
          docs.sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0));
          renderLbRows(docs, 'totalEarned', { showGift: true });
        }).catch(err => {
          console.warn('Friends leaderboard load failed', err);
          statusEl.querySelector('span').textContent = 'Could not load friends leaderboard.';
        });
      });
    } else { // guilds — top guilds by weekly contribution + your guild roster
      loadMyGuild().then(myG => {
        db.collection('guilds').orderBy('weeklyContrib', 'desc').limit(30).get().then(snap => {
          statusEl.style.display = 'none';
          let html = '';
          if(myG){
            const members = myG.members || [];
            const goal = guildWeeklyGoal(members.length);
            const contrib = myG.weeklyContrib || 0;
            const pct = Math.min(100, Math.round((contrib / goal) * 100));
            html += `<div class="guild-goal-card">
              <div class="guild-goal-title">🏯 ${escapeHtml(myG.name || 'Your Guild')} — weekly goal</div>
              <div class="chal-progress"><div class="chal-progress-fill" style="width:${pct}%"></div></div>
              <div class="ach-reward" style="margin-top:6px;">${fmt(contrib)} / ${fmt(goal)} · ${members.length} members</div>
            </div>`;
            // Member roster from leaderboard docs
            if(members.length){
              Promise.all(lbSplitIntoChunks(members, 10).map(group =>
                db.collection('leaderboard').where(firebase.firestore.FieldPath.documentId(), 'in', group).get()
              )).then(snaps => {
                const docs = [];
                snaps.forEach(s => s.forEach(doc => docs.push(Object.assign({ __id: doc.id }, doc.data()))));
                docs.sort((a, b) => (b.weeklyEarned || 0) - (a.weeklyEarned || 0));
                html += `<div class="chal-section-label">Your roster (this week)</div>`;
                html += docs.map((d, i) => {
                  const isMe = firebaseUser && d.__id === firebaseUser.uid;
                  return `<div class="lb-row${isMe?' me':''}"><span class="lb-rank">#${i+1}</span><span class="lb-name">${escapeHtml(d.name||'Anonymous')}</span><span class="lb-cash">¥${fmt(d.weeklyEarned||0)}</span></div>`;
                }).join('');
                html += `<div class="chal-section-label" style="margin-top:12px;">Top guilds</div>`;
                html += renderGuildRowsHtml(snap);
                listEl.innerHTML = html;
              }).catch(() => {
                html += renderGuildRowsHtml(snap);
                listEl.innerHTML = html;
              });
              return;
            }
          }
          html += `<div class="chal-section-label">Top guilds</div>`;
          html += renderGuildRowsHtml(snap);
          listEl.innerHTML = html || `<div class="settings-item"><span>No guilds yet — create one!</span></div>`;
        }).catch(err => {
          console.warn('Guild leaderboard failed', err);
          statusEl.querySelector('span').textContent = 'Could not load guilds (index or rules may be needed).';
        });
      });
    }
  }
  function renderGuildRowsHtml(snap){
    if(!snap || snap.empty) return `<div class="settings-item"><span>No guilds yet — create one!</span></div>`;
    return snap.docs.map((doc, i) => {
      const d = doc.data();
      const isMine = state.guildId === doc.id;
      const members = (d.members || []).length;
      return `<div class="lb-row${isMine?' me':''}"><span class="lb-rank">#${i+1}</span><span class="lb-name">${escapeHtml(d.name||'Guild')} <span class="lb-guild-tag">${members}p</span></span><span class="lb-cash">¥${fmt(d.weeklyContrib||0)}</span></div>`;
    }).join('');
  }

  document.querySelectorAll('.lb-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLbMode = btn.dataset.mode;
      document.querySelectorAll('.lb-filter-btn').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      renderLeaderboard();
    });
  });
  document.getElementById('addFriendBtn').addEventListener('click', () => {
    addFriendByCode(document.getElementById('friendCodeInput').value);
  });
  document.getElementById('friendCodeInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') addFriendByCode(e.target.value);
  });
  // Guild UI buttons (delegated from panel that may be toggled)
  document.getElementById('leaderboardPanel').addEventListener('click', e => {
    const createBtn = e.target.closest('#createGuildBtn');
    if(createBtn){
      createGuild(document.getElementById('guildNameInput').value);
      return;
    }
    const joinBtn = e.target.closest('#joinGuildBtn');
    if(joinBtn){
      joinGuildByCode(document.getElementById('guildCodeInput').value);
      return;
    }
    const leaveBtn = e.target.closest('#leaveGuildBtn');
    if(leaveBtn){
      if(confirm('Leave your guild?')) leaveGuild();
      return;
    }
    const giftBtn = e.target.closest('[data-action="gift"]');
    if(giftBtn){
      const uid = giftBtn.dataset.uid;
      const name = giftBtn.dataset.name || 'friend';
      giftBtn.disabled = true;
      sendGift(uid, name).then(res => {
        const status = document.getElementById('addFriendStatus');
        const gt = res.giftType ? res.giftType.icon + ' ' + res.giftType.name : fmt(res.amount);
        if(status) status.textContent = `Sent ${gt} to ${name}! +${CONFIG.FRIENDSHIP_PER_GIFT||5} friendship`;
        giftBtn.title = 'Already gifted today';
      }).catch(err => {
        giftBtn.disabled = false;
        const status = document.getElementById('addFriendStatus');
        if(status) status.textContent = err.message || 'Gift failed.';
      });
      return;
    }
    const visitBtn = e.target.closest('[data-action="visit"]');
    if(visitBtn){
      const uid = visitBtn.dataset.uid;
      const name = visitBtn.dataset.name || 'friend';
      const result = visitFriendRestaurant(uid, name, null);
      const status = document.getElementById('addFriendStatus');
      if(status) status.textContent = result.msg;
      if(result.ok){
        visitBtn.disabled = true;
        visitBtn.title = 'Visited recently';
      }
      return;
    }
    const unfriendBtn = e.target.closest('[data-action="unfriend"]');
    if(unfriendBtn){
      const uid = unfriendBtn.dataset.uid;
      if(confirm('Remove this friend?')) removeFriend(uid).catch(err => {
        const status = document.getElementById('addFriendStatus');
        if(status) status.textContent = err.message || 'Could not remove.';
      });
      return;
    }
  });
  document.getElementById('guildNameInput') && document.getElementById('guildNameInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') createGuild(e.target.value);
  });
  document.getElementById('guildCodeInput') && document.getElementById('guildCodeInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') joinGuildByCode(e.target.value);
  });

  // ---------- tap to earn ----------
  // ---------- sound system (SFX + procedural background music) ----------
  // Everything below is synthesized with the Web Audio API rather than
  // shipping .mp3/.ogg assets — this keeps the service worker's cache list
  // at zero audio bytes, sidesteps any music-licensing question entirely,
  // and means sound "just works" the instant the game loads instead of
  // waiting on a fetch. One shared AudioContext + two gain buses (sfxBus for
  // one-shot stings, musicBus for the background loop) so both toggles in
  // Settings and any future volume sliders control everything uniformly.
  let audioCtx = null, sfxBus = null, musicBus = null;
  function getAudioCtx(){
    if(audioCtx) return audioCtx;
    try{
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = audioCtx.createGain();
      sfxBus.gain.value = 0.55;
      sfxBus.connect(audioCtx.destination);
      musicBus = audioCtx.createGain();
      musicBus.gain.value = 0.16;
      musicBus.connect(audioCtx.destination);
    }catch(e){ /* Web Audio unavailable/blocked — game still fully playable silently */ }
    return audioCtx;
  }
  // Most mobile/desktop browsers start any new AudioContext 'suspended'
  // until a real user gesture happens; this is called from the first
  // pointerdown/keydown the page sees (wired near the bottom of this file).
  function unlockAudio(){
    const ctx = getAudioCtx();
    if(ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    if(state.musicEnabled) startMusic();
  }
  // Generic short tone, used to build every one-shot SFX below so each one
  // is a couple lines instead of a full oscillator/gain setup each time.
  function playTone(freq, opts){
    if(!state.sfxEnabled) return;
    const ctx = getAudioCtx();
    if(!ctx || !sfxBus) return;
    const {type = 'sine', duration = 0.12, gain = 0.2, delay = 0, sweepTo = null} = opts || {};
    try{
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if(sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(g).connect(sfxBus);
      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    }catch(e){ /* ignore */ }
  }
  // ---- individual SFX ----
  function playClickSfx(){ playTone(520, {type:'square', duration:0.045, gain:0.08}); }
  function playTabSfx(){ playTone(380, {type:'sine', duration:0.05, gain:0.06}); }
  function playBuySfx(){
    playTone(660, {type:'triangle', duration:0.09, gain:0.16});
    playTone(880, {type:'triangle', duration:0.12, gain:0.13, delay:0.05});
  }
  function playErrorSfx(){ playTone(180, {type:'sawtooth', duration:0.16, gain:0.13, sweepTo:100}); }
  function playPrestigeSfx(){
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, {type:'triangle', duration:0.4, gain:0.15, delay:i*0.08}));
  }
  function playOrderMissSfx(){ playTone(210, {type:'square', duration:0.18, gain:0.11, sweepTo:130}); }

  // ---------- background music: a short looping chord progression with a
  // gentle plucked arpeggio on top, scheduled one beat at a time. Not a
  // sample-accurate lookahead scheduler — a plain setInterval is plenty
  // steady for a chill idle-game loop and far simpler to maintain. ----------
  const MUSIC_STYLES = {
    traditional: { bpm: 88, chords: [[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66]] },
    lofi:        { bpm: 72, chords: [[220,261.63,329.63],[196,246.94,293.66],[174.61,220,261.63],[146.83,196,246.94]] },
    jazz:        { bpm: 96, chords: [[233.08,293.66,349.23],[196,246.94,311.13],[174.61,220,277.18],[155.56,196,246.94]] },
    pop:         { bpm: 110, chords: [[261.63,329.63,392],[196,246.94,293.66],[220,261.63,329.63],[174.61,220,261.63]] },
    festival:    { bpm: 120, chords: [[293.66,369.99,440],[261.63,329.63,392],[220,277.18,329.63],[196,246.94,293.66]] },
    piano:       { bpm: 64, chords: [[261.63,329.63,392],[246.94,311.13,369.99],[220,277.18,329.63],[196,246.94,293.66]] },
  };
  let musicTimer = null;
  let musicStep = 0;
  function scheduleMusicStep(){
    if(!state.musicEnabled){ stopMusic(); return; }
    const ctx = getAudioCtx();
    if(!ctx || !musicBus) return;
    const style = MUSIC_STYLES[state.musicTheme] || MUSIC_STYLES.traditional;
    const chord = style.chords[Math.floor(musicStep / 4) % style.chords.length];
    const beat = musicStep % 4;
    const t0 = ctx.currentTime + 0.02;
    const beatSec = 60 / style.bpm;
    if(beat === 0){
      // Soft pad, one octave down, held across the whole chord's 4 beats
      chord.forEach(freq => {
        try{
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq / 2;
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(0.5, t0 + 0.6);
          g.gain.linearRampToValueAtTime(0, t0 + beatSec * 4 - 0.15);
          osc.connect(g).connect(musicBus);
          osc.start(t0);
          osc.stop(t0 + beatSec * 4);
        }catch(e){ /* ignore */ }
      });
    }
    // Plucked arpeggio note on every beat
    try{
      const note = chord[beat % chord.length];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note * 2;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.35, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + beatSec * 0.9);
      osc.connect(g).connect(musicBus);
      osc.start(t0);
      osc.stop(t0 + beatSec);
    }catch(e){ /* ignore */ }
    musicStep++;
  }
  function startMusic(){
    if(musicTimer || !state.musicEnabled) return;
    const ctx = getAudioCtx();
    if(!ctx) return;
    if(ctx.state === 'suspended'){ ctx.resume().catch(() => {}); }
    scheduleMusicStep();
    musicTimer = setInterval(scheduleMusicStep, (60 / MUSIC_BPM) * 1000);
  }
  function stopMusic(){
    if(musicTimer){ clearInterval(musicTimer); musicTimer = null; }
  }
  // Unlock + start music on the very first user gesture anywhere on the
  // page (autoplay policies block audio until then); only needs to fire once.
  ['pointerdown', 'keydown'].forEach(evt => document.addEventListener(evt, unlockAudio, {once:true, passive:true}));
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) stopMusic();
    else if(state.musicEnabled) startMusic();
  });
  // Generic click sound for any plain button press that doesn't already
  // fire a more specific sting (buy, error, prestige, tap-pop, chime, tab
  // switch, etc). .nav-btn is excluded since activatePanel() already plays
  // its own tab-switch sound for those.
  document.addEventListener('click', e => {
    const el = e.target.closest('button');
    if(!el || el.classList.contains('nav-btn')) return;
    playClickSfx();
  }, true);

  // ---- tap "juice": screen shake, particle burst, pop sound, haptic ----
  // All gated on state.tapFxEnabled (toggle lives in Settings) so anyone who
  // finds it distracting — or is tapping fast enough that constant vibration
  // gets annoying — can turn the whole bundle off in one switch.
  function shakeTapZone(){
    tapZone.classList.remove('tap-shake');
    void tapZone.offsetWidth; // force reflow so the animation restarts on rapid consecutive taps
    tapZone.classList.add('tap-shake');
  }
  function spawnTapParticles(){
    const count = CONFIG.TAP_PARTICLE_COUNT;
    for(let i = 0; i < count; i++){
      const p = document.createElement('div');
      p.className = 'tap-particle';
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.6 - 0.3);
      const dist = CONFIG.TAP_PARTICLE_MIN_DIST + Math.random() * CONFIG.TAP_PARTICLE_DIST_RANGE;
      p.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
      p.textContent = ['✨', '💫', '⭐'][Math.floor(Math.random() * 3)];
      tapZone.appendChild(p);
      setTimeout(() => p.remove(), CONFIG.TAP_PARTICLE_LIFETIME_MS);
    }
  }
  // Synthesizes a short decaying noise "pop" rather than shipping an audio
  // asset — same reasoning as playMilestoneChime() below. The buffer is built
  // once (on the shared audioCtx) and reused; only a cheap BufferSource is
  // created per tap.
  let tapNoiseBuffer = null;
  function ensureTapAudio(){
    const ctx = getAudioCtx();
    if(!ctx || tapNoiseBuffer) return;
    try{
      const rate = ctx.sampleRate;
      const duration = 0.05;
      tapNoiseBuffer = ctx.createBuffer(1, Math.floor(rate * duration), rate);
      const data = tapNoiseBuffer.getChannelData(0);
      for(let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }catch(e){ /* Web Audio unavailable/blocked — shake/particles/haptic still fire */ }
  }
  function playTapPop(){
    if(!state.sfxEnabled) return;
    ensureTapAudio();
    const ctx = getAudioCtx();
    if(!ctx || !tapNoiseBuffer || !sfxBus) return;
    try{
      const src = ctx.createBufferSource();
      src.buffer = tapNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900 + Math.random() * 300; // slight variation so rapid taps don't sound identical
      const gain = ctx.createGain();
      gain.gain.value = 0.22;
      src.connect(filter).connect(gain).connect(sfxBus);
      src.start();
    }catch(e){ /* ignore */ }
  }
  function tapHaptic(ms){
    if('vibrate' in navigator){
      try{ navigator.vibrate(ms); }catch(e){ /* some browsers throw if called outside a user gesture */ }
    }
  }
  function fireTapFeedback(isInspector){
    if(!state.tapFxEnabled) return;
    if(isInspector){
      tapHaptic(CONFIG.TAP_HAPTIC_INSPECTOR_MS);
      return; // no shake/particles/sound for inspector taps — nothing's actually being earned
    }
    shakeTapZone();
    spawnTapParticles();
    playTapPop();
    tapHaptic(CONFIG.TAP_HAPTIC_MS);
  }

  const bowlWrap = document.getElementById('bowlWrap');
  const tapZone = document.getElementById('tapZone');
  function handleTap(){
    state.totalTaps++;
    addChallengeProgress('taps', 1);
    if(activeEvent.type === 'inspector'){
      activeEvent.tapsDone++;
      spawnFloatingGain(0, 'insp');
      fireTapFeedback(true);
      if(activeEvent.tapsDone >= activeEvent.tapsNeeded){
        clearEvent(true);
        checkAchievements();
      }
    } else if(activeOrder){
      // Fulfilling a customer order takes priority over a normal cash tap
      fulfillOrder();
    } else {
      const gain = nextTapGain();
      addCountryCash(state.activeCountry, gain);
      addEarned(gain);
      addChallengeProgress('earn', gain);
      adjustReputation(CONFIG.REP_TAP_GAIN);
      spawnFloatingGain(gain);
      fireTapFeedback(false);
    }
    renderStats();
    checkAchievements();
    checkMilestones();
  }
  bowlWrap.addEventListener('click', handleTap);
  bowlWrap.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
      e.preventDefault(); // stop the page from scrolling on Space
      handleTap();
    }
  });
  function spawnFloatingGain(gain, mode){
    const el = document.createElement('div');
    el.className = 'float-gain';
    if(mode === 'insp'){
      el.textContent = '✓';
      el.classList.remove('bad');
    } else {
      el.textContent = '+' + fmt(gain);
    }
    el.style.left = (CONFIG.FLOAT_GAIN_SPREAD_MIN_PCT + Math.random()*CONFIG.FLOAT_GAIN_SPREAD_RANGE_PCT) + '%';
    tapZone.appendChild(el);
    setTimeout(() => el.remove(), CONFIG.FLOAT_GAIN_LIFETIME_MS);
  }

  // ---------- nav ----------
  function activatePanel(panelId){
    if(!panelId) return; // e.g. the "More" nav button, which opens a sheet instead of a panel
    playTabSfx();
    document.querySelectorAll('.nav-btn').forEach(b => {
      const on = b.dataset.panel === panelId;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.panel-view').forEach(p => p.classList.toggle('active', p.id === panelId));
    if(panelId === 'achPanel') renderAchievements();
    if(panelId === 'worldPanel') renderWorld();
    if(panelId === 'leaderboardPanel') renderLeaderboard();
    if(panelId === 'prestigePanel') renderPrestige();
    if(panelId === 'collectionPanel') renderCollection();
    if(panelId === 'kitchenOverviewPanel') renderKitchenOverview();
    if(panelId === 'kitchenIngredientsPanel') renderKitchenIngredients();
    if(panelId === 'kitchenRecipesPanel') renderKitchenRecipes();
    if(panelId === 'kitchenStationsPanel') renderKitchenStations();
    if(panelId === 'kitchenStaffPanel') renderKitchenStaff();
    if(panelId === 'kitchenFacilityPanel') renderKitchenFacility();
    if(panelId === 'economyPanel') renderEconomy();
    if(panelId === 'eventsPanel') renderEvents();
  }
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => activatePanel(btn.dataset.panel));
  });
  document.getElementById('countrySwitchBtn').addEventListener('click', () => activatePanel('worldPanel'));

  // ---- "More" sheet: Kitchen, Goals, Skins, Rank, and Settings used to
  // crowd the bottom bar as eight buttons; they now live in this overlay,
  // opened from a single "More" button, reusing the same modal open/close/
  // focus-trap plumbing as the other overlays in the game.
  const moreSheetOverlay = document.getElementById('moreSheetOverlay');
  document.getElementById('navMoreBtn').addEventListener('click', () => openModal(moreSheetOverlay));
  document.getElementById('moreSheetCloseBtn').addEventListener('click', () => closeModal(moreSheetOverlay));
  moreSheetOverlay.addEventListener('click', e => { if(e.target === moreSheetOverlay) closeModal(moreSheetOverlay); });
  moreSheetOverlay.addEventListener('modal-dismiss', () => closeModal(moreSheetOverlay));
  // Picking a section inside the sheet already switches panels via the
  // generic .nav-btn listener above (attached to every .nav-btn, wherever
  // it lives); this just also closes the sheet once that's done.
  moreSheetOverlay.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => closeModal(moreSheetOverlay));
  });
  // Badge on the "More" button itself so a new achievement/skin notification
  // is still visible even though Goals/Skins are now tucked away in the sheet.
  function syncMoreDot(){
    const achOn = document.getElementById('achDot').classList.contains('show');
    const collOn = document.getElementById('collectionDot').classList.contains('show');
    const dot = document.getElementById('moreDot');
    if(dot) dot.classList.toggle('show', achOn || collOn);
  }
  // Kitchen actions — content now spans 6 separate panels (Overview /
  // Ingredients / Recipes / Stations / Staff / Facility), each rebuilt
  // from scratch whenever it's opened, so delegate on each individually.
  function handleKitchenAction(e){
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === 'craft') craftRecipe(btn.dataset.id);
    else if(action === 'station') upgradeStation(btn.dataset.id);
    else if(action === 'research') buyResearch(btn.dataset.id);
    else if(action === 'equip-chef') equipChef(btn.dataset.id);
    else if(action === 'chef-skill') activateChefSkill();
    else if(action === 'michelin-start') startMichelinChallenge();
    else if(action === 'claim-sponsor') claimSponsorship(btn.dataset.id);
    else if(action === 'claim-loyalty-ev') claimLoyaltyEvent(btn.dataset.id);
    else if(action === 'layout') upgradeLayout(btn.dataset.id);
    else if(action === 'queue') upgradeQueue(btn.dataset.id);
    else if(action === 'delivery') upgradeDelivery(btn.dataset.id);
    else if(action === 'upgrade-cleaning') upgradeCleaning();
    else if(action === 'polish-clean') polishCleanliness();
    else if(action === 'unlock-takeaway') unlockTakeaway();
    else if(action === 'unlock-drivethru') unlockDriveThrough();
    else if(action === 'upgrade-storage') upgradeStorage();
    else if(action === 'supplier') orderFromSupplier(btn.dataset.id);
    else if(action === 'recipe-upgrade') upgradeRecipeStat(btn.dataset.id, btn.dataset.stat);
    else if(action === 'hire-staff') hireStaff(btn.dataset.id);
    else if(action === 'train-staff') trainStaffRole(btn.dataset.id);
    else if(action === 'academy') trainAcademySkill(btn.dataset.id);
    else if(action === 'staff-equip') upgradeStaffEquip(btn.dataset.id);
    else if(action === 'automation') upgradeAutomation();
    else if(action === 'break-room') upgradeBreakRoom();
    else if(action === 'reward-staff') rewardStaff();
  }
  ['kitchenOverviewPanel','kitchenIngredientsPanel','kitchenRecipesPanel','kitchenStationsPanel','kitchenStaffPanel','kitchenFacilityPanel'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', handleKitchenAction);
  });
  // Order card fulfill button
  const fulfillBtn = document.getElementById('orderFulfillBtn');
  if(fulfillBtn) fulfillBtn.addEventListener('click', fulfillOrder);

  document.getElementById('prestigeBtn').addEventListener('click', doPrestige);
  document.getElementById('saveBtn').addEventListener('click', () => { save(); alert('Saved!'); });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if(confirm('Reset ALL progress for this account? This cannot be undone.')){
      try{ localStorage.removeItem(currentSaveKey()); }catch(e){}
      // Also clear legacy key if present so it cannot resurrect old data
      try{ localStorage.removeItem(SAVE_KEY_LEGACY); }catch(e){}
      location.reload();
    }
  });

  // ---------- offline earnings ----------
  let pendingOfflineGain = 0;
  function checkOfflineEarnings(){
    const now = Date.now();
    const elapsedSec = Math.min((now - state.lastSeen) / 1000, CONFIG.OFFLINE_MAX_HOURS * 3600);
    if(elapsedSec < CONFIG.OFFLINE_MIN_SEC) return false;
    const rate = totalRatePerSec();
    if(rate <= 0) return false;
    // Manager-type offline boosts (delivery/waiter) + research delivery branch
    let typeOffline = 0;
    allBusinessStates(state).forEach(b => {
      if(!b.manager) return;
      const t = MANAGER_TYPES.find(x => x.id === b.managerType);
      if(t && t.offlineBoost) typeOffline += t.offlineBoost;
    });
    pendingOfflineGain = rate * elapsedSec * CONFIG.OFFLINE_EARN_MULT
      * (1 + metaBonus('offline') + totalManagerOfflineBoost() + typeOffline)
      * powerupMult('offline')
      * researchOfflineBonus()
      * (typeof staffOfflineBonus === 'function' ? staffOfflineBonus() : 1);
    if(pendingOfflineGain < CONFIG.OFFLINE_MIN_GAIN) return false;
    document.getElementById('offlineText').textContent =
      `While you were away for ${Math.round(elapsedSec/60)} min, your shops earned ${fmt(pendingOfflineGain)}.`;
    openModal(document.getElementById('offlineModal'));
    return true;
  }
  function collectOffline(multiplier){
    const amount = pendingOfflineGain * multiplier;
    // Split offline earnings across unlocked countries by their share of income
    let totalR = 0;
    const shares = {};
    COUNTRIES.forEach(c => {
      if(!isUnlocked(c.id)) return;
      const r = countryRatePerSec(c);
      shares[c.id] = r;
      totalR += r;
    });
    if(totalR <= 0){
      addCountryCash(state.activeCountry, amount);
    } else {
      COUNTRIES.forEach(c => {
        if(shares[c.id]) addCountryCash(c.id, amount * (shares[c.id] / totalR));
      });
    }
    addEarned(amount);
    closeModal(document.getElementById('offlineModal'));
    renderStats(); checkAchievements();
    maybeShowDailyStreak();
  }
  document.getElementById('collectOfflineBtn').addEventListener('click', () => collectOffline(1));
  document.getElementById('offlineModal').addEventListener('modal-dismiss', () => collectOffline(1));
  const doubleOfflineBtn = document.getElementById('doubleOfflineBtn');
  doubleOfflineBtn.style.display = FEATURES.adsEnabled ? '' : 'none';
  if(!FEATURES.adsEnabled){
    console.warn('Ramen Empire: FEATURES.adsEnabled is false — "Watch Ad to Double" is hidden because no ad SDK is wired in yet.');
  }
  doubleOfflineBtn.addEventListener('click', () => {
    if(!FEATURES.adsEnabled){
      console.warn('Ramen Empire: doubleOfflineBtn clicked while adsEnabled is false — this should be unreachable since the button is hidden.');
      return;
    }
    // TODO: replace this stub with a real rewarded-ad SDK call. Only credit
    // the doubled reward inside the ad's successful-view callback, not here.
    collectOffline(CONFIG.OFFLINE_AD_MULT);
  });

  // ---------- game loop ----------
  let lastTick = Date.now();
  let lastStatsRender = 0;
  function tick(){
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    // Businesses keep producing passively even during a health inspector event;
    // eventMultiplier() already applies the CONFIG.INSPECTOR_INCOME_MULT penalty inside totalRatePerSec().
    let totalGain = 0;
    COUNTRIES.forEach(country => {
      if(!isUnlocked(country.id)) return;
      const g = countryRatePerSec(country) * globalMultiplier() * eventMultiplier() * dt;
      if(g > 0){
        addCountryCash(country.id, g);
        totalGain += g;
      }
    });
    if(totalGain > 0){
      addEarned(totalGain);
      addChallengeProgress('earn', totalGain);
    }
    tickReputation(dt);
    maybeTriggerEvent();
    tickEvent();
    maybeTriggerOrder();
    tickOrder();
    tickRecipe();
    if(typeof tickChampionship === 'function') tickChampionship(dt);
    if(now - lastStatsRender >= CONFIG.STATS_RENDER_INTERVAL_MS){
      renderStats();
      lastStatsRender = now;
    }
    requestAnimationFrame(tick);
  }

  setInterval(() => {
    refreshBusinessAffordability();
    checkAchievements();
    checkMilestones();
    checkCollectionNotif();
    ensureChallenges();
    ensureWeeklyPeriod();
    // Cleanliness slowly decays while the game is open (GDD cleaning system)
    if(typeof tickCleanliness === 'function') tickCleanliness(CONFIG.AFFORDABILITY_REFRESH_MS / 1000);
    // Staff XP, happiness decay, cleaner passive
    if(typeof tickStaff === 'function') tickStaff(CONFIG.AFFORDABILITY_REFRESH_MS / 1000);
  }, CONFIG.AFFORDABILITY_REFRESH_MS);
  setInterval(save, CONFIG.AUTOSAVE_INTERVAL_MS);

  // ---------- init ----------
  // startGame() is idempotent so it can be called both from here (returning,
  // already-onboarded players) and from submitProfile() (first-run players,
  // right after they finish the login+profile flow) without double-starting
  // the render loop.
  let gameStarted = false;
  function startGame(){
    if(gameStarted) return;
    gameStarted = true;
    ensureChallenges();
    ensureWeeklyPeriod();
    ensureSeasonalState();
    const offlineModalShown = checkOfflineEarnings();
    if(!offlineModalShown) maybeShowDailyStreak();
    renderBusinesses();
    renderAchievements();
    renderWorld();
    renderStats();
    renderSeasonalBanner();
    applyCosmeticTheme();
    if(typeof applyRestaurantTheme === 'function') applyRestaurantTheme();
    checkCollectionNotif();
    requestAnimationFrame(tick);
  }

  // Auth drives the first load via onAuthStateChanged (see above).
  // Firebase always fires that callback (async). If the stub/offline auth
  // path is active it fires on the next tick with user=null → guest load.
  // Fallback: if somehow auth never fires within 2s, load guest and start.
  migrateLegacySaveOnce();
  setTimeout(() => {
    if(authInitDone) return;
    authInitDone = true;
    activeAccountId = 'guest';
    loadFromKey(currentSaveKey());
    renderProfileSettings();
    if(hasCompleteProfile(state)){ state.onboarded = true; startGame(); }
    else openAuthOverlay('onboard');
  }, 2000);

  window.addEventListener('beforeunload', () => { save(); scheduleCloudSave(true); });
  window.addEventListener('pagehide', () => { save(); scheduleCloudSave(true); });
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ save(); scheduleCloudSave(true); }
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
    });
  }

