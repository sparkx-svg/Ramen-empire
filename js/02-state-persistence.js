/**
 * Ramen Empire — 02 State Persistence
 * Game state, localStorage + cloud save, account switching, profile.
 *
 * This file is part of the split source. Run `node build-script.js` (or npm run build:script)
 * to concatenate js/*.js back into script.js for deployment.
 */
  let state = {
    cash: 0, // legacy field — migrated into countryCash on load; kept for leaderboard sum
    countryCash: {}, // per-country cash pools (japan/italy/mexico/india)
    diamonds: 0,     // global premium currency for powerups (never reset by prestige)
    activePowerups: {}, // powerupId -> endsAt timestamp (ms)
    totalEarned: 0,
    prestigePoints: 0,
    prestigeCount: 0,
    shards: 0,           // Umami Shards — second prestige currency, never reset
    metaUpgrades: {},    // meta-upgrade id -> level, never reset by Prestige
    equippedSkin: 'classic',
    countries: {}, // countryId -> { businessId -> {level, manager, speed, capacity, quality} }
    unlockedCountries: ['japan'],
    activeCountry: 'japan',
    lastSeen: Date.now(),
    totalTaps: 0,
    criticEventsSeen: 0,
    inspectorsPassed: 0,
    luckyEventsSeen: 0,
    milestoneIdx: -1, // index into MILESTONES of the highest one already shown
    achievementsClaimed: {},
    achievementBonus: 0,
    integrityFlag: false,
    profile: { name: '', age: null, provider: null }, // set once onboarding completes
    onboarded: false,
    daily: { streak: 0, lastClaimDate: null },
    challenges: { daily: null, weekly: null },
    weeklyEarned: 0,   // earnings so far in the current leaderboard week (see weekId)
    weekId: null,      // ISO week id ('2026-W31') this weeklyEarned total belongs to
    seasonWins: 0,      // number of past weeks this player finished #1 on the Weekly board
    tapFxEnabled: true, // screen shake + particle burst + pop sound + haptic on tap
    musicEnabled: true, // procedural background music loop
    sfxEnabled: true,   // UI clicks, purchase/error/prestige/order stings, tap pop, chimes
    // Depth systems (v1.6)
    reputation: 70,           // 0–100; multiplies passive income, decays over time
    ingredients: {},          // ingredientId -> count
    activeRecipe: null,       // {id, endsAt} while a signature ramen boost is active
    ordersFulfilled: 0,
    recipesCrafted: 0,
    // Story / seasonal / staff (v1.7)
    storyClaimed: {},     // questId -> true once reward claimed
    seasonal: { eventId: null, progress: 0, claimed: false, skinUnlocked: {} },
    // seasonal.skinUnlocked[skinId] = true after completing that event's challenge
    // Social (v1.8)
    guildId: null,        // Firestore guild doc id, if joined
    guildName: null,
    gifts: { lastGiftDate: null, giftedToday: {}, pendingClaimed: {} }
  };

  // Every source of cash gain (tap, tick, offline, milestone, challenge/daily
  // reward) should route through here instead of touching totalEarned
  // directly, so the Weekly leaderboard counter always stays in sync with
  // lifetime earnings without duplicating this line at every call site.
  function addEarned(amount){
    state.totalEarned += amount;
    state.weeklyEarned = (state.weeklyEarned || 0) + amount;
  }

  function freshBusiness(){ return {level:0, manager:false, managerLevel:0, speed:0, capacity:0, quality:0}; }
  function initCountryState(country){
    const obj = {};
    country.businesses.forEach(b => obj[b.id] = freshBusiness());
    return obj;
  }
  COUNTRIES.forEach(c => {
    state.countries[c.id] = initCountryState(c);
    state.countryCash[c.id] = 0;
  });

  // ---------- per-country cash + diamonds helpers ----------
  function getCountryCash(id){
    id = id || state.activeCountry;
    if(!state.countryCash) state.countryCash = {};
    if(state.countryCash[id] === undefined) state.countryCash[id] = 0;
    return state.countryCash[id];
  }
  function setCountryCash(id, amount){
    if(!state.countryCash) state.countryCash = {};
    state.countryCash[id] = Math.max(0, amount);
  }
  function addCountryCash(id, amount){
    if(amount <= 0) return;
    setCountryCash(id, getCountryCash(id) + amount);
  }
  function spendCountryCash(id, amount){
    if(getCountryCash(id) < amount) return false;
    setCountryCash(id, getCountryCash(id) - amount);
    return true;
  }
  function totalCash(){
    let t = 0;
    COUNTRIES.forEach(c => { t += getCountryCash(c.id); });
    return t;
  }
  // Spend unlock costs from the richest unlocked country first
  function spendFromRichest(amount){
    const unlocked = COUNTRIES.filter(c => isUnlocked(c.id))
      .sort((a, b) => getCountryCash(b.id) - getCountryCash(a.id));
    let need = amount;
    for(const c of unlocked){
      const have = getCountryCash(c.id);
      if(have <= 0) continue;
      const take = Math.min(have, need);
      setCountryCash(c.id, have - take);
      need -= take;
      if(need <= 0) return true;
    }
    return need <= 0;
  }
  function canAffordUnlock(cost){
    return totalCash() >= cost;
  }

  // ---------- powerups (bought with global diamonds) ----------
  const POWERUPS = [
    {id:'double_income', icon:'💰', name:'Double Income',   desc:'2× passive income for 10 min', durationMs:10*60*1000, cost:25, effect:'income', mult:2},
    {id:'tap_frenzy',    icon:'👆', name:'Tap Frenzy',      desc:'5× tap gain for 5 min',         durationMs:5*60*1000,  cost:20, effect:'tap',    mult:5},
    {id:'night_owl',     icon:'🌙', name:'Night Owl',       desc:'3× offline rate for 30 min',    durationMs:30*60*1000, cost:30, effect:'offline',mult:3},
    {id:'lucky_charm',   icon:'🍀', name:'Lucky Charm',     desc:'+25% event chance for 15 min',  durationMs:15*60*1000, cost:15, effect:'luck',   mult:0.25},
    {id:'cash_burst',    icon:'💥', name:'Cash Burst',      desc:'Instant 60s of active-country income', durationMs:0, cost:18, effect:'burst', mult:60},
    {id:'rep_boost',     icon:'⭐', name:'Star Chef',       desc:'+20 reputation instantly',      durationMs:0, cost:12, effect:'rep', mult:20},
  ];
  function powerupActive(id){
    const ends = state.activePowerups && state.activePowerups[id];
    return ends && ends > Date.now();
  }
  function powerupMult(effect){
    let m = 1;
    POWERUPS.forEach(p => {
      if(p.effect === effect && powerupActive(p.id) && p.mult > 1) m *= p.mult;
    });
    return m;
  }
  function powerupLuckBonus(){
    let b = 0;
    POWERUPS.forEach(p => {
      if(p.effect === 'luck' && powerupActive(p.id)) b += p.mult;
    });
    return b;
  }
  function buyPowerup(id){
    const def = POWERUPS.find(p => p.id === id);
    if(!def) return;
    if((state.diamonds || 0) < def.cost){ playErrorSfx(); return; }
    if(def.durationMs > 0 && powerupActive(id)){ playErrorSfx(); return; } // already active
    state.diamonds -= def.cost;
    playBuySfx();
    if(def.effect === 'burst'){
      const gain = Math.max(1, countryRatePerSec(activeCountryDef()) * globalMultiplier() * eventMultiplier() * def.mult);
      addCountryCash(state.activeCountry, gain);
      addEarned(gain);
      spawnFloatingGain(gain);
    } else if(def.effect === 'rep'){
      adjustReputation(def.mult);
    } else {
      if(!state.activePowerups) state.activePowerups = {};
      state.activePowerups[id] = Date.now() + def.durationMs;
    }
    save(); renderStats(); renderPowerups();
  }
  function earnDiamonds(n){
    if(n <= 0) return;
    state.diamonds = (state.diamonds || 0) + n;
  }
  function renderPowerups(){
    const list = document.getElementById('powerupsList');
    const bal = document.getElementById('diamondBalance');
    if(bal) bal.textContent = Math.floor(state.diamonds || 0);
    if(!list) return;
    list.innerHTML = '';
    POWERUPS.forEach(def => {
      const active = powerupActive(def.id);
      const remain = active ? Math.ceil((state.activePowerups[def.id] - Date.now()) / 1000) : 0;
      const canBuy = (state.diamonds || 0) >= def.cost && !(def.durationMs > 0 && active);
      const card = document.createElement('div');
      card.className = 'ach-card' + (active ? ' claimed' : '');
      card.innerHTML = `
        <div class="ach-icon${active ? ' done' : ''}" aria-hidden="true">${def.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${def.name}</div>
          <div class="ach-desc">${def.desc}</div>
          <div class="ach-reward">${active ? 'Active · ' + remain + 's left' : '💎 ' + def.cost + ' diamonds'}</div>
        </div>
        <button class="claim-btn" data-action="buy-powerup" data-id="${def.id}" ${canBuy ? '' : 'disabled'}>${active ? 'Active' : 'Buy'}</button>`;
      list.appendChild(card);
    });
  }

  // ---------- persistence ----------
  // Saves are isolated per account so logging out / switching Google accounts
  // never leaks progress between players on the same browser.
  //   guest  → ramenEmpireSave_v2_guest
  //   Google → ramenEmpireSave_v2_u_<uid>
  // Legacy single key ramenEmpireSave_v2 is migrated once into the guest slot.
  const SAVE_KEY_BASE = 'ramenEmpireSave_v2';
  const SAVE_KEY_LEGACY = SAVE_KEY_BASE; // pre-1.9.1 shared key
  let activeAccountId = 'guest'; // 'guest' | firebase uid
  // Declared early so cloud-save helpers (defined near save()) and the
  // auth callback can both see them without temporal-dead-zone issues.
  let firebaseUser = null;
  let myFriends = [];
  let authInitDone = false;

  function saveKeyFor(accountId){
    if(!accountId || accountId === 'guest') return SAVE_KEY_BASE + '_guest';
    return SAVE_KEY_BASE + '_u_' + accountId;
  }
  function currentSaveKey(){
    return saveKeyFor(activeAccountId);
  }

  // Profile is complete once name + age have been collected once for this account.
  function hasCompleteProfile(s){
    s = s || state;
    if(!s || !s.profile) return false;
    const name = (s.profile.name || '').trim();
    const age = parseInt(s.profile.age, 10);
    return !!name && !isNaN(age) && age >= 5 && age <= 120;
  }

  // NOTE on integrity: this is tamper-EVIDENCE, not tamper-PROOF. The salt below
  // ships in plain client JS, so anyone who opens devtools can read it and forge
  // a matching checksum. All this does is catch casual/naive save edits (someone
  // pasting a bigger cash number into localStorage without recalculating the
  // checksum) and set state.integrityFlag so a future leaderboard or IAP check
  // can refuse to trust a flagged save. A determined cheater on a client-only
  // game can always get around this — real protection requires a server that
  // validates state server-side.
  const SAVE_SALT = 'ramen-empire-v2-integrity';
  function hashString(str){
    let h = 5381;
    for(let i = 0; i < str.length; i++){
      h = ((h << 5) + h + str.charCodeAt(i)) | 0; // djb2
    }
    return (h >>> 0).toString(36);
  }
  function computeChecksum(s){
    const { __checksum, ...rest } = s;
    let payload = SAVE_SALT + JSON.stringify(rest);
    let h = hashString(payload);
    // three rounds + include prestigeCount so a pure cash edit is more likely to fail
    for(let i = 0; i < 3; i++) h = hashString(h + SAVE_SALT + (s.prestigeCount || 0));
    return h;
  }

  function createFreshState(){
    const s = {
      cash: 0,
      countryCash: {},
      diamonds: 0,
      activePowerups: {},
      totalEarned: 0,
      prestigePoints: 0,
      prestigeCount: 0,
      shards: 0,
      metaUpgrades: {},
      equippedSkin: 'classic',
      countries: {},
      unlockedCountries: ['japan'],
      activeCountry: 'japan',
      lastSeen: Date.now(),
      totalTaps: 0,
      criticEventsSeen: 0,
      inspectorsPassed: 0,
      luckyEventsSeen: 0,
      milestoneIdx: -1,
      achievementsClaimed: {},
      achievementBonus: 0,
      integrityFlag: false,
      profile: { name: '', age: null, provider: null },
      onboarded: false,
      daily: { streak: 0, lastClaimDate: null },
      challenges: { daily: null, weekly: null },
      weeklyEarned: 0,
      weekId: null,
      seasonWins: 0,
      tapFxEnabled: true,
      musicEnabled: true,
      sfxEnabled: true,
      reputation: CONFIG.REP_START,
      ingredients: {},
      activeRecipe: null,
      ordersFulfilled: 0,
      recipesCrafted: 0,
      storyClaimed: {},
      seasonal: { eventId: null, progress: 0, claimed: false, skinUnlocked: {} },
      guildId: null,
      guildName: null,
      gifts: { lastGiftDate: null, giftedToday: {}, pendingClaimed: {} }
    };
    COUNTRIES.forEach(c => {
      s.countries[c.id] = initCountryState(c);
      s.countryCash[c.id] = 0;
    });
    META_UPGRADES.forEach(m => { s.metaUpgrades[m.id] = 0; });
    return s;
  }

  function normalizeLoadedState(loaded){
    // Pre-1.2.0 saves kept a single flat `businesses` map
    if(loaded.businesses && !loaded.countries){
      loaded.countries = { japan: loaded.businesses };
      loaded.unlockedCountries = ['japan'];
      loaded.activeCountry = 'japan';
      delete loaded.businesses;
    }
    const base = createFreshState();
    // Preserve settings prefs from current session when loading empty? No — full replace
    state = Object.assign(base, loaded);
    // Re-apply nested defaults that Object.assign may have partially overwritten
    if(!state.countryCash) state.countryCash = {};
    COUNTRIES.forEach(c => {
      if(state.countryCash[c.id] === undefined) state.countryCash[c.id] = 0;
      if(!state.countries[c.id]) state.countries[c.id] = initCountryState(c);
      const bizState = state.countries[c.id];
      c.businesses.forEach(def => {
        if(!bizState[def.id]) bizState[def.id] = freshBusiness();
        const biz = bizState[def.id];
        if(biz.speed === undefined) biz.speed = 0;
        if(biz.capacity === undefined) biz.capacity = 0;
        if(biz.quality === undefined) biz.quality = 0;
        if(biz.managerLevel === undefined) biz.managerLevel = biz.manager ? 1 : 0;
      });
    });
    if(typeof loaded.cash === 'number' && loaded.cash > 0 && !loaded.countryCash){
      state.countryCash.japan = (state.countryCash.japan || 0) + loaded.cash;
    }
    if(state.diamonds === undefined) state.diamonds = 0;
    if(!state.activePowerups) state.activePowerups = {};
    if(!state.unlockedCountries) state.unlockedCountries = ['japan'];
    if(!state.unlockedCountries.includes('japan')) state.unlockedCountries.unshift('japan');
    if(!state.activeCountry || !isUnlocked(state.activeCountry)) state.activeCountry = 'japan';
    if(!state.achievementsClaimed) state.achievementsClaimed = {};
    if(!state.profile) state.profile = { name: '', age: null, provider: null };
    if(state.onboarded === undefined) state.onboarded = false;
    // Once name+age exist for this save, never re-ask on later logins
    if(hasCompleteProfile(state)) state.onboarded = true;
    if(!state.daily) state.daily = { streak: 0, lastClaimDate: null };
    if(!state.challenges) state.challenges = { daily: null, weekly: null };
    if(state.achievementBonus === undefined) state.achievementBonus = 0;
    if(state.totalTaps === undefined) state.totalTaps = 0;
    if(state.criticEventsSeen === undefined) state.criticEventsSeen = 0;
    if(state.inspectorsPassed === undefined) state.inspectorsPassed = 0;
    if(state.luckyEventsSeen === undefined) state.luckyEventsSeen = 0;
    if(state.milestoneIdx === undefined) state.milestoneIdx = -1;
    if(state.shards === undefined) state.shards = 0;
    if(!state.metaUpgrades) state.metaUpgrades = {};
    META_UPGRADES.forEach(m => { if(state.metaUpgrades[m.id] === undefined) state.metaUpgrades[m.id] = 0; });
    if(!state.equippedSkin || !COSMETICS.some(c => c.id === state.equippedSkin)) state.equippedSkin = 'classic';
    if(state.prestigeCount === undefined) state.prestigeCount = 0;
    if(state.reputation === undefined) state.reputation = CONFIG.REP_START;
    if(!state.ingredients) state.ingredients = {};
    if(state.activeRecipe && state.activeRecipe.endsAt < Date.now()) state.activeRecipe = null;
    if(state.ordersFulfilled === undefined) state.ordersFulfilled = 0;
    if(state.recipesCrafted === undefined) state.recipesCrafted = 0;
    if(state.tapFxEnabled === undefined) state.tapFxEnabled = true;
    if(state.musicEnabled === undefined) state.musicEnabled = true;
    if(state.sfxEnabled === undefined) state.sfxEnabled = true;
    if(!state.storyClaimed) state.storyClaimed = {};
    if(!state.seasonal) state.seasonal = { eventId: null, progress: 0, claimed: false, skinUnlocked: {} };
    if(!state.seasonal.skinUnlocked) state.seasonal.skinUnlocked = {};
    if(state.guildId === undefined) state.guildId = null;
    if(state.guildName === undefined) state.guildName = null;
    if(!state.gifts) state.gifts = { lastGiftDate: null, giftedToday: {}, pendingClaimed: {} };
    if(!state.gifts.giftedToday) state.gifts.giftedToday = {};
    if(!state.gifts.pendingClaimed) state.gifts.pendingClaimed = {};
  }

  function clearRuntimeSession(){
    // Wipe transient UI/session state that must not carry across accounts
    if(typeof activeEvent !== 'undefined'){
      activeEvent = {type:null, endsAt:0, tapsNeeded:0, tapsDone:0};
    }
    if(typeof activeOrder !== 'undefined') activeOrder = null;
    if(typeof pendingDailyReward !== 'undefined') pendingDailyReward = null;
    if(typeof pendingOfflineGain !== 'undefined') pendingOfflineGain = 0;
    if(typeof lastLeaderboardSubmit !== 'undefined') lastLeaderboardSubmit = 0;
    if(typeof lastGuildContribute !== 'undefined') lastGuildContribute = 0;
    if(typeof myGuildCache !== 'undefined') myGuildCache = null;
    if(typeof myFriends !== 'undefined') myFriends = [];
    if(typeof giftBoostEndsAt !== 'undefined'){ giftBoostEndsAt = 0; giftBoostAmount = 0; }
    if(typeof bizElCache !== 'undefined') bizElCache = {};
  }

  function migrateLegacySaveOnce(){
    try{
      const legacy = localStorage.getItem(SAVE_KEY_LEGACY);
      if(!legacy) return;
      // Only migrate if neither guest nor any obvious account key was written yet
      if(!localStorage.getItem(saveKeyFor('guest'))){
        localStorage.setItem(saveKeyFor('guest'), legacy);
      }
      localStorage.removeItem(SAVE_KEY_LEGACY);
    }catch(e){ console.warn('Legacy save migration failed', e); }
  }

  // Cloud save throttle (Firestore free-tier friendly). Local save is always
  // immediate; cloud is debounced so rapid ticks/autosaves don't spam writes.
  let lastCloudSaveAt = 0;
  let cloudSaveTimer = null;
  const CLOUD_SAVE_MIN_MS = 20000; // at most one cloud write every 20s

  function save(){
    state.lastSeen = Date.now();
    // Keep legacy cash field = sum for checksums / any remaining readers
    state.cash = totalCash();
    state.__checksum = computeChecksum(state);
    try{
      localStorage.setItem(currentSaveKey(), JSON.stringify(state));
    }catch(e){ console.warn('Save failed', e); }
    submitScore();
    scheduleCloudSave();
  }

  function scheduleCloudSave(force){
    if(!firebaseUser) return;
    if(force){
      if(cloudSaveTimer){ clearTimeout(cloudSaveTimer); cloudSaveTimer = null; }
      cloudSaveNow();
      return;
    }
    const now = Date.now();
    const elapsed = now - lastCloudSaveAt;
    if(elapsed >= CLOUD_SAVE_MIN_MS){
      cloudSaveNow();
    } else if(!cloudSaveTimer){
      cloudSaveTimer = setTimeout(() => {
        cloudSaveTimer = null;
        cloudSaveNow();
      }, CLOUD_SAVE_MIN_MS - elapsed);
    }
  }

  function cloudSaveNow(){
    if(!firebaseUser) return;
    lastCloudSaveAt = Date.now();
    // Clone without the integrity checksum (server doesn't need it)
    let payload;
    try{
      const { __checksum, ...rest } = state;
      payload = JSON.parse(JSON.stringify(rest));
    }catch(e){
      console.warn('Cloud save clone failed', e);
      return;
    }
    db.collection('saves').doc(firebaseUser.uid).set({
      state: payload,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastSeen: state.lastSeen || Date.now(),
      totalEarned: state.totalEarned || 0,
      prestigeCount: state.prestigeCount || 0
    }).catch(err => console.warn('Cloud save failed', err));
  }

  // Load cloud save for the current Google user and adopt it if it is clearly
  // ahead of the local save (higher lifetime earnings, or same earnings but
  // newer lastSeen). Returns a Promise that resolves after any merge.
  function maybeLoadCloudSave(){
    if(!firebaseUser || activeAccountId === 'guest') return Promise.resolve(false);
    // Snapshot local metrics BEFORE any normalize (which overwrites global state)
    const localEarned = state.totalEarned || 0;
    const localSeen = state.lastSeen || 0;
    const wasFlagged = !!state.integrityFlag;
    return db.collection('saves').doc(firebaseUser.uid).get().then(doc => {
      if(!doc.exists) return false;
      const data = doc.data();
      if(!data || !data.state) return false;
      const cloudRaw = data.state;
      const cloudEarned = cloudRaw.totalEarned || 0;
      const cloudSeen = cloudRaw.lastSeen || data.lastSeen || 0;
      // Prefer cloud when it has meaningfully more progress, or equal progress
      // but a newer timestamp (another device played more recently).
      const cloudWins = cloudEarned > localEarned + 0.5
        || (Math.abs(cloudEarned - localEarned) < 1 && cloudSeen > localSeen + 1000);
      if(!cloudWins) return false;
      // normalizeLoadedState assigns the fully-defaulted object to global state
      normalizeLoadedState(cloudRaw);
      state.integrityFlag = wasFlagged;
      // Ensure provider is correct for this Google session
      if(!state.profile) state.profile = { name: '', age: null, provider: 'google' };
      state.profile.provider = 'google';
      if(hasCompleteProfile(state)) state.onboarded = true;
      // Write the adopted cloud state back to localStorage so offline play
      // continues from the best known progress.
      try{
        state.__checksum = computeChecksum(state);
        localStorage.setItem(currentSaveKey(), JSON.stringify(state));
      }catch(e){}
      return true;
    }).catch(err => {
      console.warn('Cloud load failed', err);
      return false;
    });
  }

  function loadFromKey(key){
    const raw = localStorage.getItem(key);
    if(!raw){
      state = createFreshState();
      state.integrityFlag = false;
      return false;
    }
    try{
      const loaded = JSON.parse(raw);
      const savedChecksum = loaded.__checksum;
      const valid = savedChecksum !== undefined && savedChecksum === computeChecksum(loaded);
      normalizeLoadedState(loaded);
      state.integrityFlag = !valid;
      if(!valid) console.warn('Ramen Empire: save checksum mismatch — state may have been edited outside the game.');
      return true;
    }catch(e){
      console.warn('save corrupt, starting fresh', e);
      state = createFreshState();
      state.integrityFlag = false;
      return false;
    }
  }

  function load(){
    loadFromKey(currentSaveKey());
  }

  // Switch the in-memory game to a different account's save. Saves the previous
  // account first (if any progress existed), then loads the target (or a blank
  // save). Used on login / logout / account change.
  function switchAccount(nextAccountId, opts){
    opts = opts || {};
    const next = nextAccountId || 'guest';
    if(next === activeAccountId && !opts.force) return;

    // Persist current account before leaving it (forces a cloud flush too)
    try{
      if(state && (state.onboarded || state.totalEarned > 0 || totalCash() > 0)){
        save();
        if(firebaseUser) scheduleCloudSave(true);
      }
    }catch(e){ console.warn('Pre-switch save failed', e); }

    activeAccountId = next;
    clearRuntimeSession();
    const hadLocal = loadFromKey(currentSaveKey());

    // If this is a brand-new Google account and we are carrying guest progress
    // forward (first-time link), opts.seedFromGuest can copy once.
    if(opts.seedFromGuest && next !== 'guest'){
      // loadFromKey already ran; if the account key was empty we have fresh state.
      // Only seed when the account truly had no prior local save AND guest had progress.
      if(!hadLocal){
        const guestRaw = localStorage.getItem(saveKeyFor('guest'));
        if(guestRaw){
          try{
            const guestLoaded = JSON.parse(guestRaw);
            if(guestLoaded && (guestLoaded.onboarded || (guestLoaded.totalEarned||0) > 0)){
              normalizeLoadedState(guestLoaded);
              // Still bind profile to the Google identity after seed
              if(opts.googleProfile){
                state.profile = Object.assign({}, state.profile || {}, opts.googleProfile);
                if(hasCompleteProfile(state)) state.onboarded = true;
              }
              save();
            }
          }catch(e){ /* ignore */ }
        }
      }
    }

    if(opts.googleProfile && state.profile){
      // Keep name/age but ensure provider reflects Google
      state.profile.provider = 'google';
      if(opts.googleProfile.name && !state.profile.name){
        state.profile.name = opts.googleProfile.name;
      }
      if(hasCompleteProfile(state)) state.onboarded = true;
    } else if(next === 'guest' && state.profile){
      // Logged out: demote provider so UI shows Guest
      if(state.profile.provider === 'google') state.profile.provider = 'guest';
    }

    function refreshAfterSwitch(){
      try{
        if(typeof renderEventBanner === 'function') renderEventBanner();
        if(typeof renderOrderCard === 'function') renderOrderCard();
        if(typeof renderProfileSettings === 'function') renderProfileSettings();
        if(typeof renderTapFxBtn === 'function') renderTapFxBtn();
        if(typeof renderMusicBtn === 'function') renderMusicBtn();
        if(typeof renderSfxBtn === 'function') renderSfxBtn();
        if(typeof renderBusinesses === 'function') renderBusinesses();
        if(typeof renderWorld === 'function') renderWorld();
        if(typeof renderStats === 'function') renderStats();
        if(typeof renderAchievements === 'function') renderAchievements();
        if(typeof applyCosmeticTheme === 'function') applyCosmeticTheme();
        if(typeof renderSeasonalBanner === 'function') renderSeasonalBanner();
        if(typeof ensureChallenges === 'function') ensureChallenges();
        if(typeof ensureWeeklyPeriod === 'function') ensureWeeklyPeriod();
      }catch(e){ console.warn('Post-switch render failed', e); }
    }

    // For Google accounts, also pull any newer cloud save (other device).
    // Fire-and-forget; re-render if cloud was adopted.
    if(next !== 'guest'){
      maybeLoadCloudSave().then(adopted => {
        if(adopted) refreshAfterSwitch();
      });
    }

    refreshAfterSwitch();
  }

  function resetCurrentAccountProgress(){
    // Wipe this account's save entirely and start a new blank run
    try{ localStorage.removeItem(currentSaveKey()); }catch(e){}
    if(firebaseUser){
      db.collection('saves').doc(firebaseUser.uid).delete().catch(err => console.warn('Cloud save delete failed', err));
    }
    clearRuntimeSession();
    state = createFreshState();
    // Keep audio/settings preferences if present in memory — actually fresh is fine
    save();
    try{
      if(typeof renderEventBanner === 'function') renderEventBanner();
      if(typeof renderOrderCard === 'function') renderOrderCard();
      if(typeof renderProfileSettings === 'function') renderProfileSettings();
      if(typeof renderBusinesses === 'function') renderBusinesses();
      if(typeof renderWorld === 'function') renderWorld();
      if(typeof renderStats === 'function') renderStats();
      if(typeof renderAchievements === 'function') renderAchievements();
      if(typeof applyCosmeticTheme === 'function') applyCosmeticTheme();
    }catch(e){}
  }

