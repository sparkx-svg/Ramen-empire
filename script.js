(function(){
  "use strict";

  // ---------- countries / cuisines ----------
  // Each country owns its own 8-tier business ladder (same cost/income curve
  // shape, different theme). All UNLOCKED countries produce income in
  // parallel at all times — state.activeCountry only controls which one's
  // shop list is currently shown/managed in the Shops tab, it does not gate
  // production. unlockCost is spent once, in cash, via the World tab.
  const COUNTRIES = [
    {
      id:'japan', name:'Japan', icon:'🇯🇵', tagline:'Where it all began', unlockCost:0,
      businesses:[
        {id:'cart',   name:'Street Cart',       icon:'🛒', baseCost:10,      baseIncome:0.5,   unlockAt:0},
        {id:'stall',  name:'Noodle Stall',      icon:'🏮', baseCost:100,     baseIncome:4,     unlockAt:0},
        {id:'shop',   name:'Corner Shop',       icon:'🏠', baseCost:1100,    baseIncome:30,    unlockAt:0},
        {id:'diner',  name:'Family Diner',      icon:'🍽️', baseCost:12000,   baseIncome:200,   unlockAt:5},
        {id:'chain',  name:'City Chain',        icon:'🏢', baseCost:130000,  baseIncome:1400,  unlockAt:5},
        {id:'factory',name:'Broth Factory',     icon:'🏭', baseCost:1400000, baseIncome:9000,  unlockAt:10},
        {id:'mall',   name:'Mall Franchise',    icon:'🏬', baseCost:2e7,     baseIncome:55000, unlockAt:10},
        {id:'global', name:'Global Empire HQ',  icon:'🌆', baseCost:3.3e8,   baseIncome:330000,unlockAt:15},
      ]
    },
    {
      id:'italy', name:'Italy', icon:'🇮🇹', tagline:'Pasta, pizza & espresso', unlockCost:75000,
      businesses:[
        {id:'cart',   name:'Panini Cart',        icon:'🥖', baseCost:10,      baseIncome:0.5,   unlockAt:0},
        {id:'stall',  name:'Pizza Stall',        icon:'🍕', baseCost:100,     baseIncome:4,     unlockAt:0},
        {id:'shop',   name:'Trattoria',          icon:'🍝', baseCost:1100,    baseIncome:30,    unlockAt:0},
        {id:'diner',  name:'Family Ristorante',  icon:'🍷', baseCost:12000,   baseIncome:200,   unlockAt:5},
        {id:'chain',  name:'City Pizzeria Chain',icon:'🏢', baseCost:130000,  baseIncome:1400,  unlockAt:5},
        {id:'factory',name:'Pasta Factory',      icon:'🏭', baseCost:1400000, baseIncome:9000,  unlockAt:10},
        {id:'mall',   name:'Piazza Franchise',   icon:'🏬', baseCost:2e7,     baseIncome:55000, unlockAt:10},
        {id:'global', name:'Roman Empire HQ',    icon:'🏛️', baseCost:3.3e8,   baseIncome:330000,unlockAt:15},
      ]
    },
    {
      id:'mexico', name:'Mexico', icon:'🇲🇽', tagline:'Tacos, salsa & fire', unlockCost:6000000,
      businesses:[
        {id:'cart',   name:'Taco Cart',         icon:'🌮', baseCost:10,      baseIncome:0.5,   unlockAt:0},
        {id:'stall',  name:'Salsa Stall',       icon:'🌶️', baseCost:100,     baseIncome:4,     unlockAt:0},
        {id:'shop',   name:'Taqueria',          icon:'🫔', baseCost:1100,    baseIncome:30,    unlockAt:0},
        {id:'diner',  name:'Family Cantina',    icon:'🍹', baseCost:12000,   baseIncome:200,   unlockAt:5},
        {id:'chain',  name:'City Taco Chain',   icon:'🏢', baseCost:130000,  baseIncome:1400,  unlockAt:5},
        {id:'factory',name:'Tortilla Factory',  icon:'🏭', baseCost:1400000, baseIncome:9000,  unlockAt:10},
        {id:'mall',   name:'Mercado Franchise', icon:'🏬', baseCost:2e7,     baseIncome:55000, unlockAt:10},
        {id:'global', name:'Aztec Empire HQ',   icon:'🌆', baseCost:3.3e8,   baseIncome:330000,unlockAt:15},
      ]
    },
    {
      id:'india', name:'India', icon:'🇮🇳', tagline:'Curry, spice & chai', unlockCost:600000000,
      businesses:[
        {id:'cart',   name:'Chai Cart',         icon:'🍵', baseCost:10,      baseIncome:0.5,   unlockAt:0},
        {id:'stall',  name:'Samosa Stall',      icon:'🥟', baseCost:100,     baseIncome:4,     unlockAt:0},
        {id:'shop',   name:'Curry House',       icon:'🍛', baseCost:1100,    baseIncome:30,    unlockAt:0},
        {id:'diner',  name:'Family Dhaba',      icon:'🫓', baseCost:12000,   baseIncome:200,   unlockAt:5},
        {id:'chain',  name:'City Curry Chain',  icon:'🏢', baseCost:130000,  baseIncome:1400,  unlockAt:5},
        {id:'factory',name:'Spice Factory',     icon:'🏭', baseCost:1400000, baseIncome:9000,  unlockAt:10},
        {id:'mall',   name:'Bazaar Franchise',  icon:'🏬', baseCost:2e7,     baseIncome:55000, unlockAt:10},
        {id:'global', name:'Mughal Empire HQ',  icon:'🕌', baseCost:3.3e8,   baseIncome:330000,unlockAt:15},
      ]
    },
  ];
  function getCountry(id){ return COUNTRIES.find(c => c.id === id); }
  function activeCountryDef(){ return getCountry(state.activeCountry); }
  function isUnlocked(id){ return state.unlockedCountries.includes(id); }
  // ---------- balance & timing config ----------
  // Every tunable gameplay number that isn't already organized into one of
  // the data tables above (COUNTRIES, UPGRADE_TYPES, ACHIEVEMENTS) lives
  // here, so play-testing tweaks are a one-line change instead of a hunt
  // through function bodies. Formatting-only constants (fmt()'s unit
  // thresholds) are left where they are since they're not balance knobs.
  const CONFIG = {
    // Business economy
    COST_GROWTH: 1.15,              // cost multiplier per business level purchased
    MANAGER_COST_MULT: 80,          // manager costs this many times the business's base cost
    MANAGER_UNLOCK_LEVEL: 5,        // business must reach this level before a manager can be hired
    MANAGER_INCOME_MULT: 1.5,       // +50% income once a manager is hired
    LEVEL_INCOME_SCALING: 0.01,     // each business level adds this fraction of extra income on top of linear scaling

    // Prestige
    PRESTIGE_BONUS_PER_POINT: 0.02, // each Miso Point adds 2% to the global income multiplier
    PRESTIGE_EARNINGS_DIVISOR: 1e6, // totalEarned is divided by this before sqrt to get potential prestige points

    // Tapping
    TAP_SCALING_FACTOR: 0.00001,    // how much lifetime earnings boost each tap's base cash gain

    // Random events
    EVENT_CHECK_INTERVAL_MS: 15000, // how often we roll for a new event
    EVENT_TRIGGER_CHANCE: 0.12,     // chance a check actually starts an event
    CRITIC_EVENT_SHARE: 0.7,        // of triggered events, this fraction are Food Critic (rest are Health Inspector)
    CRITIC_DURATION_MS: 60000,
    CRITIC_INCOME_MULT: 2.5,
    INSPECTOR_DURATION_MS: 20000,
    INSPECTOR_TAPS_NEEDED: 15,
    INSPECTOR_INCOME_MULT: 0.4,

    // Offline earnings
    OFFLINE_MIN_SEC: 30,            // don't show the modal for very short absences
    OFFLINE_MAX_HOURS: 4,           // cap how much offline time counts toward the reward
    OFFLINE_EARN_MULT: 0.5,         // offline earnings accrue at 50% of the live rate
    OFFLINE_MIN_GAIN: 1,            // don't show the modal for a negligible amount
    OFFLINE_AD_MULT: 2,             // "watch ad to double" multiplier

    // UI / performance timing
    STATS_RENDER_INTERVAL_MS: 100,  // throttle stats DOM writes to ~10fps
    AFFORDABILITY_REFRESH_MS: 1000, // how often buy/manager/upgrade buttons re-check affordability
    AUTOSAVE_INTERVAL_MS: 10000,
    FLOAT_GAIN_LIFETIME_MS: 900,    // how long the "+¥X" tap popup stays before removal
    FLOAT_GAIN_SPREAD_MIN_PCT: 45,  // horizontal placement range for the tap popup (min%)
    FLOAT_GAIN_SPREAD_RANGE_PCT: 10 // ...plus a random amount up to this many percentage points
  };

  // Set to true only once a real rewarded-ad SDK (AdMob, etc.) is wired into
  // doubleOfflineBtn's click handler below. Until then this stays false so the
  // button is hidden rather than silently doubling rewards for a "watch ad"
  // that never actually shows an ad.
  //
  const FEATURES = { adsEnabled: false };

  // upgrade tier definitions: type -> {icon, label, boostPerLevel, costMult, costGrowth, maxLevel}
  const UPGRADE_TYPES = {
    speed:    {icon:'⚡', label:'Speed',    boost:0.08, costMult:0.6, costGrowth:1.12, max:20},
    capacity: {icon:'📦', label:'Capacity', boost:0.15, costMult:2.2, costGrowth:1.16, max:20},
    quality:  {icon:'✨', label:'Quality',  boost:0.25, costMult:6,   costGrowth:1.22, max:20},
  };

  const ACHIEVEMENTS = [
    {id:'first_bowl',  icon:'🥢', name:'First Bowl',       desc:'Tap the bowl once',              reward:0.01, cond: s => s.totalTaps >= 1},
    {id:'open_shop',   icon:'🏮', name:'Open For Business', desc:'Open your first business',       reward:0.01, cond: s => allBusinessStates(s).some(b=>b.level>0)},
    {id:'fast_hands',  icon:'👋', name:'Fast Hands',        desc:'Tap the bowl 100 times',          reward:0.02, cond: s => s.totalTaps >= 100},
    {id:'century',     icon:'💴', name:'Century Club',      desc:'Earn ¥1,000 total',               reward:0.01, cond: s => s.totalEarned >= 1000},
    {id:'millionaire', icon:'💰', name:'Millionaire',       desc:'Earn ¥1,000,000 total',           reward:0.03, cond: s => s.totalEarned >= 1e6},
    {id:'empire',      icon:'🌆', name:'Empire Builder',    desc:'Earn ¥100,000,000 total',         reward:0.05, cond: s => s.totalEarned >= 1e8},
    {id:'full_house',  icon:'🗾', name:'Full House',        desc:'Open all 8 Japan shop types',     reward:0.03, cond: s => Object.values(s.countries.japan).every(b=>b.level>0)},
    {id:'master_chef', icon:'👨‍🍳', name:'Master Chef',       desc:'Reach Quality level 10 on any shop', reward:0.02, cond: s => allBusinessStates(s).some(b=>b.quality>=10)},
    {id:'first_prestige',icon:'⭐', name:'First Retirement', desc:'Prestige once',                  reward:0.03, cond: s => s.prestigeCount >= 1},
    {id:'ten_prestige', icon:'🌟', name:'Serial Retiree',   desc:'Prestige 10 times',               reward:0.05, cond: s => s.prestigeCount >= 10},
    {id:'critic_5',     icon:'📰', name:"Critic's Choice",  desc:'Experience 5 Food Critic events',  reward:0.02, cond: s => s.criticEventsSeen >= 5},
    {id:'inspector_pass',icon:'🕵️', name:'Inspection Passed', desc:'Clear a Health Inspector event by tapping', reward:0.02, cond: s => s.inspectorsPassed >= 1},
    {id:'world_tour',  icon:'🌍', name:'World Tour',        desc:'Expand your empire to every country', reward:0.05, cond: s => s.unlockedCountries.length >= COUNTRIES.length},
  ];
  // Flattens every business-state object across all UNLOCKED countries, so
  // achievement conditions (and anything else that wants "any shop anywhere")
  // don't need to know about the country structure.
  function allBusinessStates(s){
    const out = [];
    COUNTRIES.forEach(c => { if(s.unlockedCountries.includes(c.id)) out.push(...Object.values(s.countries[c.id])); });
    return out;
  }

  let state = {
    cash: 0,
    totalEarned: 0,
    prestigePoints: 0,
    prestigeCount: 0,
    countries: {}, // countryId -> { businessId -> {level, manager, speed, capacity, quality} }
    unlockedCountries: ['japan'],
    activeCountry: 'japan',
    lastSeen: Date.now(),
    totalTaps: 0,
    criticEventsSeen: 0,
    inspectorsPassed: 0,
    achievementsClaimed: {},
    achievementBonus: 0,
    integrityFlag: false,
    profile: { name: '', age: null, provider: null }, // set once onboarding completes
    onboarded: false,
    daily: { streak: 0, lastClaimDate: null },
    challenges: { daily: null, weekly: null }
  };

  function freshBusiness(){ return {level:0, manager:false, speed:0, capacity:0, quality:0}; }
  function initCountryState(country){
    const obj = {};
    country.businesses.forEach(b => obj[b.id] = freshBusiness());
    return obj;
  }
  COUNTRIES.forEach(c => state.countries[c.id] = initCountryState(c));

  // ---------- persistence ----------
  const SAVE_KEY = 'ramenEmpireSave_v2';

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
    return hashString(SAVE_SALT + JSON.stringify(rest));
  }
  function save(){
    state.lastSeen = Date.now();
    state.__checksum = computeChecksum(state);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    submitScore();
  }
  function load(){
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return;
    try{
      const loaded = JSON.parse(raw);
      const savedChecksum = loaded.__checksum;
      const valid = savedChecksum !== undefined && savedChecksum === computeChecksum(loaded);
      // Pre-1.2.0 saves kept a single flat `businesses` map (Japan only, no
      // country concept). Detect that shape before merging and fold it into
      // countries.japan so existing players don't lose progress.
      if(loaded.businesses && !loaded.countries){
        loaded.countries = { japan: loaded.businesses };
        loaded.unlockedCountries = ['japan'];
        loaded.activeCountry = 'japan';
        delete loaded.businesses;
      }
      state = Object.assign(state, loaded);
      state.integrityFlag = !valid;
      if(!valid) console.warn('Ramen Empire: save checksum mismatch — state may have been edited outside the game.');
      if(!state.unlockedCountries) state.unlockedCountries = ['japan'];
      if(!state.unlockedCountries.includes('japan')) state.unlockedCountries.unshift('japan');
      if(!state.activeCountry || !isUnlocked(state.activeCountry)) state.activeCountry = 'japan';
      COUNTRIES.forEach(country => {
        if(!state.countries[country.id]) state.countries[country.id] = initCountryState(country);
        const bizState = state.countries[country.id];
        country.businesses.forEach(def => {
          if(!bizState[def.id]) bizState[def.id] = freshBusiness();
          const biz = bizState[def.id];
          if(biz.speed === undefined) biz.speed = 0;
          if(biz.capacity === undefined) biz.capacity = 0;
          if(biz.quality === undefined) biz.quality = 0;
        });
      });
      if(!state.achievementsClaimed) state.achievementsClaimed = {};
      if(!state.profile) state.profile = { name: '', age: null, provider: null };
      if(state.onboarded === undefined) state.onboarded = false;
      if(!state.daily) state.daily = { streak: 0, lastClaimDate: null };
      if(!state.challenges) state.challenges = { daily: null, weekly: null };
      if(state.achievementBonus === undefined) state.achievementBonus = 0;
      if(state.totalTaps === undefined) state.totalTaps = 0;
      if(state.criticEventsSeen === undefined) state.criticEventsSeen = 0;
      if(state.inspectorsPassed === undefined) state.inspectorsPassed = 0;
      if(state.prestigeCount === undefined) state.prestigeCount = 0;
    }catch(e){ console.warn('save corrupt, starting fresh'); }
  }

  // ---------- math ----------
  function prestigeMultiplier(){ return 1 + state.prestigePoints * CONFIG.PRESTIGE_BONUS_PER_POINT; }
  function globalMultiplier(){ return prestigeMultiplier() * (1 + state.achievementBonus); }
  function businessCost(def, level){ return def.baseCost * Math.pow(CONFIG.COST_GROWTH, level); }
  function upgradeCost(def, type, level){
    const t = UPGRADE_TYPES[type];
    return def.baseCost * t.costMult * Math.pow(t.costGrowth, level);
  }
  function businessUpgradeMult(b){
    return (1 + b.speed*UPGRADE_TYPES.speed.boost) * (1 + b.capacity*UPGRADE_TYPES.capacity.boost) * (1 + b.quality*UPGRADE_TYPES.quality.boost);
  }
  function businessIncome(def, b){
    return def.baseIncome * b.level * (1 + b.level*CONFIG.LEVEL_INCOME_SCALING) * businessUpgradeMult(b);
  }
  function businessIncomeWithManager(def, b){
    return businessIncome(def, b) * (b.manager ? CONFIG.MANAGER_INCOME_MULT : 1);
  }
  function managerCost(def){ return def.baseCost * CONFIG.MANAGER_COST_MULT; }

  function eventMultiplier(){
    if(activeEvent.type === 'critic') return CONFIG.CRITIC_INCOME_MULT;
    if(activeEvent.type === 'inspector') return CONFIG.INSPECTOR_INCOME_MULT;
    return 1;
  }

  function countryRatePerSec(country){
    let total = 0;
    const bizState = state.countries[country.id];
    country.businesses.forEach(def => {
      const b = bizState[def.id];
      if(b.level > 0) total += businessIncomeWithManager(def, b);
    });
    return total;
  }
  function totalRatePerSec(){
    let total = 0;
    COUNTRIES.forEach(country => {
      if(!isUnlocked(country.id)) return;
      total += countryRatePerSec(country);
    });
    return total * globalMultiplier() * eventMultiplier();
  }
  function nextTapGain(){
    return (1 + state.totalEarned * CONFIG.TAP_SCALING_FACTOR) * globalMultiplier();
  }
  function potentialPrestigePoints(){
    return Math.floor(Math.sqrt(state.totalEarned / CONFIG.PRESTIGE_EARNINGS_DIVISOR));
  }
  function fmt(n){
    if(n < 1000) return '¥' + n.toFixed(n < 10 ? 1 : 0);
    const units = ['K','M','B','T','Qa','Qi','Sx','Sp'];
    let u = -1;
    while(n >= 1000 && u < units.length - 1){ n /= 1000; u++; }
    return '¥' + n.toFixed(2) + units[u];
  }

  // ---------- date helpers ----------
  // Keys are local-calendar 'YYYY-MM-DD' strings, not UTC/timestamps, so a
  // streak or challenge rolls over at the player's own midnight, not GMT's.
  function todayKey(d){
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function daysBetween(aKey, bKey){
    const a = new Date(aKey + 'T00:00:00');
    const b = new Date(bKey + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }
  function weekKey(d){
    d = d || new Date();
    const dow = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    const monday = new Date(d);
    monday.setDate(d.getDate() - dow);
    return todayKey(monday);
  }

  // ---------- daily login streak ----------
  let pendingDailyReward = null;
  function dailyStreakReward(streakDay){
    const rate = Math.max(totalRatePerSec(), 1);
    const seconds = 20 + Math.min(streakDay, 30) * 8; // grows with streak, caps around day 30
    let cash = rate * seconds;
    let miso = 0;
    if(streakDay % 30 === 0) miso = 3;
    else if(streakDay % 7 === 0) miso = 1;
    else if(streakDay % 3 === 0) cash *= 1.5;
    return { cash, miso };
  }
  // Returns true if today's reward hasn't been claimed yet (and updates the
  // streak count), so the caller knows whether to show the modal.
  function checkDailyStreak(){
    const today = todayKey();
    if(state.daily.lastClaimDate === today) return false;
    if(state.daily.lastClaimDate){
      const gap = daysBetween(state.daily.lastClaimDate, today);
      state.daily.streak = (gap === 1) ? state.daily.streak + 1 : 1;
    } else {
      state.daily.streak = 1;
    }
    state.daily.lastClaimDate = today;
    pendingDailyReward = dailyStreakReward(state.daily.streak);
    return true;
  }
  function showDailyStreakModal(){
    document.getElementById('dailyStreakSubtitle').textContent = `Streak day ${state.daily.streak}`;
    let text = fmt(pendingDailyReward.cash);
    if(pendingDailyReward.miso > 0) text += ` + ${pendingDailyReward.miso} Miso Point${pendingDailyReward.miso > 1 ? 's' : ''}`;
    document.getElementById('dailyStreakReward').textContent = '+' + text;
    openModal(document.getElementById('dailyStreakModal'));
  }
  // Called once at startup, right after the offline-earnings modal has
  // either been skipped or closed, so the two modals never show at once.
  function maybeShowDailyStreak(){
    if(checkDailyStreak()) showDailyStreakModal();
  }
  function collectDailyStreak(){
    if(!pendingDailyReward) return;
    state.cash += pendingDailyReward.cash;
    state.totalEarned += pendingDailyReward.cash;
    state.prestigePoints += pendingDailyReward.miso;
    pendingDailyReward = null;
    closeModal(document.getElementById('dailyStreakModal'));
    save(); renderStats();
    maybeShowChallengesReadyNotification();
  }
  document.getElementById('dailyStreakCollectBtn').addEventListener('click', collectDailyStreak);
  document.getElementById('dailyStreakModal').addEventListener('click', e => {
    if(e.target === e.currentTarget) e.currentTarget.dispatchEvent(new CustomEvent('modal-dismiss'));
  });
  document.getElementById('dailyStreakModal').addEventListener('modal-dismiss', collectDailyStreak);

  // ---------- daily / weekly challenges ----------
  const CHALLENGE_TYPES = ['taps', 'earn', 'buy'];
  const CHALLENGE_LABELS = {
    taps: { icon: '👋', name: 'Tap Rush', desc: n => `Tap the bowl ${n} times` },
    earn: { icon: '💴', name: 'Big Earner', desc: n => `Earn ${fmt(n)}` },
    buy:  { icon: '🛠️', name: 'Shop Upgrade', desc: n => `Buy ${n} shop levels or upgrades` },
  };
  function genChallenge(scale){
    const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
    const rate = Math.max(totalRatePerSec(), 1);
    let target, reward;
    if(type === 'taps'){
      target = Math.round((100 + Math.random() * 100) * scale);
      reward = { cash: rate * 30 * scale };
    } else if(type === 'earn'){
      target = Math.round(rate * (120 + Math.random() * 180) * scale);
      reward = { cash: target * 0.15 };
    } else {
      target = Math.max(1, Math.round((3 + Math.random() * 4) * scale));
      reward = { cash: rate * 45 * scale };
    }
    if(scale > 1) reward.miso = 1;
    return { type, target, progress: 0, reward, claimed: false, notified: false };
  }
  function ensureChallenges(){
    const dKey = todayKey();
    if(!state.challenges.daily || state.challenges.daily.dateKey !== dKey){
      state.challenges.daily = Object.assign({ dateKey: dKey }, genChallenge(1));
    }
    const wKey = weekKey();
    if(!state.challenges.weekly || state.challenges.weekly.weekKey !== wKey){
      state.challenges.weekly = Object.assign({ weekKey: wKey }, genChallenge(5));
    }
  }
  function addChallengeProgress(type, amount){
    ['daily', 'weekly'].forEach(which => {
      const c = state.challenges[which];
      if(c && c.type === type && !c.claimed){
        const wasReady = c.progress >= c.target;
        c.progress = Math.min(c.target, c.progress + amount);
        if(!wasReady && c.progress >= c.target) notifyChallengeReady(which, c);
      }
    });
  }
  function claimChallenge(which){
    const c = state.challenges[which];
    if(!c || c.claimed || c.progress < c.target) return;
    state.cash += c.reward.cash || 0;
    state.totalEarned += c.reward.cash || 0;
    state.prestigePoints += c.reward.miso || 0;
    c.claimed = true;
    save(); renderAchievements(); renderStats();
  }
  function renderChallengeCard(which, label){
    const c = state.challenges[which];
    if(!c) return '';
    const info = CHALLENGE_LABELS[c.type];
    const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
    const ready = c.progress >= c.target;
    const fmtVal = c.type === 'earn' ? fmt : Math.round;
    let rewardText = fmt(c.reward.cash);
    if(c.reward.miso) rewardText += ` + ${c.reward.miso} Miso Point${c.reward.miso > 1 ? 's' : ''}`;
    return `
      <div class="ach-card${c.claimed ? ' claimed' : ''}">
        <div class="ach-icon${ready ? ' done' : ''}" aria-hidden="true">${info.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${label}: ${info.name}</div>
          <div class="ach-desc">${info.desc(c.type === 'earn' ? c.target : Math.round(c.target))} (${fmtVal(c.progress)} / ${fmtVal(c.target)})</div>
          <div class="chal-progress"><div class="chal-progress-fill" style="width:${pct}%"></div></div>
          <div class="ach-reward">+${rewardText}</div>
        </div>
        <button class="claim-btn${c.claimed ? ' done' : ''}" data-action="claim-challenge" data-which="${which}" ${!ready || c.claimed ? 'disabled' : ''}>${c.claimed ? '✓ Done' : (ready ? 'Claim' : 'Locked')}</button>
      </div>`;
  }

  // ---------- notifications ----------
  // Requests permission and relays local notifications through the service
  // worker, which can show them even while the tab is backgrounded. This
  // does NOT reach someone after they've fully closed the browser — that
  // needs a real server push (Firebase Cloud Messaging + a Cloud Function),
  // which isn't set up here.
  function notifyChallengeReady(which, c){
    if(c.notified) return;
    c.notified = true;
    sendLocalNotification('Challenge complete!', `Your ${which} challenge is done — come claim your reward.`, 'challenge-' + which);
  }
  function maybeShowChallengesReadyNotification(){
    ['daily', 'weekly'].forEach(which => {
      const c = state.challenges[which];
      if(c && c.progress >= c.target && !c.claimed) notifyChallengeReady(which, c);
    });
  }
  function sendLocalNotification(title, body, tag){
    if(!('Notification' in window) || Notification.permission !== 'granted') return;
    if(!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => {
      if(reg && reg.active) reg.active.postMessage({ type: 'show-notification', title, body, tag });
    });
  }
  function updateNotifBtn(){
    const btn = document.getElementById('notifBtn');
    if(!btn) return;
    if(!('Notification' in window)){ btn.textContent = 'Unsupported'; btn.disabled = true; return; }
    if(Notification.permission === 'granted'){ btn.textContent = 'Enabled ✓'; btn.disabled = true; }
    else if(Notification.permission === 'denied'){ btn.textContent = 'Blocked'; btn.disabled = true; }
    else { btn.textContent = 'Enable'; btn.disabled = false; }
  }
  document.getElementById('notifBtn').addEventListener('click', () => {
    Notification.requestPermission().then(updateNotifBtn);
  });
  updateNotifBtn();

  // ---------- random events ----------
  let activeEvent = {type:null, endsAt:0, tapsNeeded:0, tapsDone:0};
  let nextEventCheck = Date.now() + CONFIG.EVENT_CHECK_INTERVAL_MS;

  function maybeTriggerEvent(){
    if(activeEvent.type) return;
    if(Date.now() < nextEventCheck) return;
    nextEventCheck = Date.now() + CONFIG.EVENT_CHECK_INTERVAL_MS;
    if(Math.random() < CONFIG.EVENT_TRIGGER_CHANCE){
      if(Math.random() < CONFIG.CRITIC_EVENT_SHARE) startCriticEvent();
      else startInspectorEvent();
    }
  }
  function startCriticEvent(){
    activeEvent = {type:'critic', endsAt: Date.now() + CONFIG.CRITIC_DURATION_MS, tapsNeeded:0, tapsDone:0};
    state.criticEventsSeen++;
    renderEventBanner();
  }
  function startInspectorEvent(){
    activeEvent = {type:'inspector', endsAt: Date.now() + CONFIG.INSPECTOR_DURATION_MS, tapsNeeded:CONFIG.INSPECTOR_TAPS_NEEDED, tapsDone:0};
    renderEventBanner();
  }
  function clearEvent(passed){
    if(activeEvent.type === 'inspector' && passed) state.inspectorsPassed++;
    activeEvent = {type:null, endsAt:0, tapsNeeded:0, tapsDone:0};
    renderEventBanner();
  }
  function renderEventBanner(){
    const banner = document.getElementById('eventBanner');
    const bowl = document.getElementById('bowlEl');
    const inspProg = document.getElementById('inspProgress');
    if(activeEvent.type === 'critic'){
      banner.className = 'event-banner show critic';
      document.getElementById('eventIcon').textContent = '📰';
      document.getElementById('eventText').textContent = `Food Critic visiting! Income x${CONFIG.CRITIC_INCOME_MULT}`;
      bowl.classList.remove('inspector-mode');
      inspProg.classList.remove('show');
    } else if(activeEvent.type === 'inspector'){
      banner.className = 'event-banner show inspector';
      document.getElementById('eventIcon').textContent = '🕵️';
      document.getElementById('eventText').textContent = 'Health Inspector! Tap fast to pass';
      bowl.classList.add('inspector-mode');
      inspProg.classList.add('show');
    } else {
      banner.className = 'event-banner';
      bowl.classList.remove('inspector-mode');
      inspProg.classList.remove('show');
    }
  }
  function tickEvent(){
    if(!activeEvent.type) return;
    const remain = Math.max(0, activeEvent.endsAt - Date.now());
    document.getElementById('eventTime').textContent = Math.ceil(remain/1000) + 's';
    if(activeEvent.type === 'inspector'){
      const pct = Math.min(100, (activeEvent.tapsDone / activeEvent.tapsNeeded) * 100);
      document.getElementById('inspProgressFill').style.width = pct + '%';
    }
    if(remain <= 0){
      clearEvent(false);
    }
  }

  // ---------- rendering ----------
  const expandedCards = new Set();
  // Derived once from CONFIG so the badge and button text can never drift
  // out of sync with the actual multiplier applied in businessIncomeWithManager().
  const MANAGER_BONUS_LABEL = '+' + Math.round((CONFIG.MANAGER_INCOME_MULT - 1) * 100) + '%';
  const bizPanel = document.getElementById('bizCards');
  // Maps business id -> cached references to its buy/manager/upgrade buttons,
  // populated whenever renderBusinesses() does a full rebuild. Lets the
  // once-a-second affordability check (below) flip .disabled on existing
  // elements instead of tearing down and rebuilding all 8 cards every tick.
  let bizElCache = {};

  function renderBusinesses(){
    const country = activeCountryDef();
    const bizState = state.countries[country.id];
    document.getElementById('countryBarIcon').textContent = country.icon;
    document.getElementById('countryBarName').textContent = country.name;
    bizPanel.innerHTML = '';
    bizElCache = {};
    country.businesses.forEach((def, idx) => {
      const b = bizState[def.id];
      const prevDef = country.businesses[idx-1];
      const locked = idx > 0 && b.level === 0 && (!prevDef || bizState[prevDef.id].level < def.unlockAt) && def.unlockAt > 0;
      const cost = businessCost(def, b.level);
      const canAfford = state.cash >= cost;
      const income = businessIncomeWithManager(def, b);
      const mCost = managerCost(def);
      const isOpen = expandedCards.has(def.id);

      const card = document.createElement('div');
      card.className = 'biz-card' + (locked ? ' locked' : '');

      let upgradeChips = '';
      if(b.level > 0){
        Object.keys(UPGRADE_TYPES).forEach(type => {
          const t = UPGRADE_TYPES[type];
          const lvl = b[type];
          const uc = upgradeCost(def, type, lvl);
          const maxed = lvl >= t.max;
          const canBuy = state.cash >= uc && !maxed;
          const upgLabel = `${t.label} upgrade for ${def.name}, level ${lvl}${maxed ? ', maxed out' : ', cost ' + fmt(uc)}`;
          upgradeChips += `
            <button class="upgrade-chip" data-action="upgrade" data-id="${def.id}" data-type="${type}" aria-label="${upgLabel}" ${!canBuy ? 'disabled':''}>
              <div class="u-icon" aria-hidden="true">${t.icon}</div>
              <div class="u-name">${t.label}</div>
              <div class="u-lvl">Lv ${lvl}${maxed ? ' MAX':''}</div>
              <div class="u-cost">${maxed ? '—' : fmt(uc)}</div>
            </button>`;
        });
      }

      const toggleAttrs = b.level > 0
        ? `role="button" tabindex="0" aria-expanded="${isOpen}" aria-label="${def.name}, level ${b.level}, ${isOpen ? 'collapse' : 'expand'} upgrades"`
        : '';
      const buyLabel = `${b.level === 0 ? 'Open' : 'Upgrade'} ${def.name} for ${fmt(cost)}`;

      card.innerHTML = `
        <div class="biz-main" data-action="toggle" data-id="${def.id}" ${toggleAttrs}>
          <div class="biz-icon" aria-hidden="true">${def.icon}</div>
          <div class="biz-info">
            <div class="biz-name">${def.name} ${b.manager ? `<span class="manager-badge">${MANAGER_BONUS_LABEL}</span>` : ''}${b.level>0 ? '<span class="expand-caret'+(isOpen?' open':'')+'" aria-hidden="true">▶</span>':''}</div>
            <div class="biz-level">Level ${b.level}</div>
            <div class="biz-income">${b.level>0 ? fmt(income)+'/s' : 'Not opened yet'}</div>
          </div>
          ${!b.manager && b.level >= CONFIG.MANAGER_UNLOCK_LEVEL ? `<button class="buy-btn manager-btn" data-action="manager" data-id="${def.id}" aria-label="Hire manager for ${def.name}, cost ${fmt(mCost)}" ${state.cash < mCost ? 'disabled' : ''}>${MANAGER_BONUS_LABEL}<small>${fmt(mCost)}</small></button>` : ''}
          <button class="buy-btn" data-action="buy" data-id="${def.id}" aria-label="${buyLabel}" ${!canAfford || locked ? 'disabled' : ''}>${b.level===0?'OPEN':'UPGRADE'}<small>${fmt(cost)}</small></button>
        </div>
        ${b.level > 0 ? `<div class="upgrade-panel${isOpen?' open':''}"><div class="upgrade-row">${upgradeChips}</div></div>` : ''}
      `;
      bizPanel.appendChild(card);

      const cache = { buyBtn: card.querySelector('[data-action="buy"]'), managerBtn: card.querySelector('[data-action="manager"]'), upgradeChips: {} };
      if(b.level > 0){
        Object.keys(UPGRADE_TYPES).forEach(type => {
          cache.upgradeChips[type] = card.querySelector(`[data-action="upgrade"][data-type="${type}"]`);
        });
      }
      bizElCache[def.id] = cache;
    });
  }

  // Runs every second: updates only the disabled/enabled state of existing
  // buy/manager/upgrade buttons as cash accrues, without rebuilding any DOM.
  // Cost, level, income, and locked status only change on an explicit action
  // (buy, hire, upgrade, toggle) — each of those already calls the full
  // renderBusinesses() directly, so this never needs to touch text or layout.
  function refreshBusinessAffordability(){
    const country = activeCountryDef();
    const bizState = state.countries[country.id];
    country.businesses.forEach((def, idx) => {
      const cache = bizElCache[def.id];
      if(!cache) return;
      const b = bizState[def.id];
      const prevDef = country.businesses[idx-1];
      const locked = idx > 0 && b.level === 0 && (!prevDef || bizState[prevDef.id].level < def.unlockAt) && def.unlockAt > 0;
      const cost = businessCost(def, b.level);
      if(cache.buyBtn) cache.buyBtn.disabled = state.cash < cost || locked;
      if(cache.managerBtn) cache.managerBtn.disabled = state.cash < managerCost(def);
      if(b.level > 0){
        Object.keys(UPGRADE_TYPES).forEach(type => {
          const chip = cache.upgradeChips[type];
          if(!chip) return;
          const t = UPGRADE_TYPES[type];
          const lvl = b[type];
          const maxed = lvl >= t.max;
          chip.disabled = maxed || state.cash < upgradeCost(def, type, lvl);
        });
      }
    });
  }

  function renderAchievements(){
    const panel = document.getElementById('achPanel');
    panel.innerHTML = '<div class="chal-section-label">Challenges</div>' +
      renderChallengeCard('daily', 'Daily') + renderChallengeCard('weekly', 'Weekly') +
      '<div class="chal-section-label" style="margin-top:14px;">Achievements</div>';
    let anyUnclaimed = false;
    ACHIEVEMENTS.forEach(ach => {
      const claimed = !!state.achievementsClaimed[ach.id];
      const unlocked = ach.cond(state);
      if(unlocked && !claimed) anyUnclaimed = true;
      const card = document.createElement('div');
      card.className = 'ach-card' + (claimed ? ' claimed':'');
      card.innerHTML = `
        <div class="ach-icon${unlocked?' done':''}" aria-hidden="true">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
          <div class="ach-reward">+${Math.round(ach.reward*100)}% permanent income</div>
        </div>
        <button class="claim-btn${claimed?' done':''}" data-action="claim" data-id="${ach.id}" aria-label="${ach.name}: ${claimed?'already claimed':(unlocked?'claim reward':'locked')}" ${!unlocked || claimed ? 'disabled':''}>${claimed?'✓ Done':(unlocked?'Claim':'Locked')}</button>
      `;
      panel.appendChild(card);
    });
    const challengeReady = ['daily','weekly'].some(w => {
      const c = state.challenges[w];
      return c && !c.claimed && c.progress >= c.target;
    });
    document.getElementById('achDot').classList.toggle('show', anyUnclaimed || challengeReady);
  }

  function renderWorld(){
    const panel = document.getElementById('worldPanel');
    panel.innerHTML = '';
    COUNTRIES.forEach(country => {
      const unlocked = isUnlocked(country.id);
      const active = state.activeCountry === country.id;
      const rate = unlocked ? countryRatePerSec(country) * globalMultiplier() : 0;
      const card = document.createElement('div');
      card.className = 'world-card' + (unlocked ? '' : ' locked') + (active ? ' active' : '');
      const btn = unlocked
        ? `<button class="world-btn${active ? ' active-btn' : ''}" data-action="select" data-id="${country.id}" aria-label="${active ? country.name + ' is currently active' : 'Manage ' + country.name}" ${active ? 'disabled' : ''}>${active ? 'ACTIVE' : 'MANAGE'}</button>`
        : `<button class="world-btn" data-action="unlock" data-id="${country.id}" aria-label="Unlock ${country.name} for ${fmt(country.unlockCost)}" ${state.cash < country.unlockCost ? 'disabled' : ''}>UNLOCK<small>${fmt(country.unlockCost)}</small></button>`;
      card.innerHTML = `
        <div class="world-flag" aria-hidden="true">${country.icon}</div>
        <div class="world-info">
          <div class="world-name">${country.name}${active ? '<span class="active-tag">ACTIVE</span>' : ''}</div>
          <div class="world-tagline">${country.tagline}</div>
          <div class="world-income">${unlocked ? fmt(rate) + '/s' : 'Locked'}</div>
        </div>
        ${btn}
      `;
      panel.appendChild(card);
    });
  }
  function unlockCountry(id){
    const country = getCountry(id);
    if(!country || isUnlocked(id) || state.cash < country.unlockCost) return;
    state.cash -= country.unlockCost;
    state.unlockedCountries.push(id);
    state.activeCountry = id;
    renderWorld(); renderBusinesses(); renderStats(); checkAchievements();
    activatePanel('bizPanel');
  }
  function selectCountry(id){
    if(!isUnlocked(id) || state.activeCountry === id) return;
    state.activeCountry = id;
    renderWorld(); renderBusinesses(); renderStats();
    activatePanel('bizPanel');
  }
  document.getElementById('worldPanel').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    if(btn.dataset.action === 'unlock') unlockCountry(btn.dataset.id);
    else if(btn.dataset.action === 'select') selectCountry(btn.dataset.id);
  });

  function renderStats(){
    document.getElementById('cashDisplay').textContent = fmt(state.cash);
    document.getElementById('rateDisplay').textContent = fmt(totalRatePerSec()) + '/s';
    document.getElementById('prestigeDisplay').textContent = Math.floor(state.prestigePoints);
    document.getElementById('multiplierDisplay').textContent = 'x' + globalMultiplier().toFixed(2);
    const potential = potentialPrestigePoints();
    document.getElementById('prestigePreview').textContent = '+' + potential;
    document.getElementById('prestigeBtn').disabled = potential <= 0;
  }

  // ---------- actions ----------
  // All buy/manager/upgrade actions operate on the currently active country
  // (the one shown in the Shops tab) — every other unlocked country keeps
  // producing in the background regardless of which one is active.
  function buyBusiness(id){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    const cost = businessCost(def, b.level);
    if(state.cash < cost) return;
    state.cash -= cost;
    b.level++;
    addChallengeProgress('buy', 1);
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function hireManager(id){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    const cost = managerCost(def);
    if(state.cash < cost) return;
    state.cash -= cost;
    b.manager = true;
    renderBusinesses(); renderStats();
  }
  function buyUpgrade(id, type){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    const t = UPGRADE_TYPES[type];
    if(b[type] >= t.max) return;
    const cost = upgradeCost(def, type, b[type]);
    if(state.cash < cost) return;
    state.cash -= cost;
    b[type]++;
    addChallengeProgress('buy', 1);
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function doPrestige(){
    const potential = potentialPrestigePoints();
    if(potential <= 0) return;
    state.prestigePoints += potential;
    state.prestigeCount++;
    state.cash = 0;
    state.totalEarned = 0;
    // Retiring resets every country's shops — unlocked countries stay
    // unlocked, only their business levels/upgrades/managers reset.
    COUNTRIES.forEach(c => state.countries[c.id] = initCountryState(c));
    save();
    renderBusinesses(); renderWorld(); renderStats(); checkAchievements();
  }

  // Called on every tap/purchase plus once a second — cheap by default
  // (just recomputes the nav dot). Only pays for a full achievements-panel
  // rebuild when that panel is actually the one on screen.
  function checkAchievements(){
    let anyUnclaimed = false;
    ACHIEVEMENTS.forEach(ach => {
      if(!state.achievementsClaimed[ach.id] && ach.cond(state)) anyUnclaimed = true;
    });
    const challengeReady = ['daily','weekly'].some(w => {
      const c = state.challenges[w];
      return c && !c.claimed && c.progress >= c.target;
    });
    document.getElementById('achDot').classList.toggle('show', anyUnclaimed || challengeReady);
    if(document.getElementById('achPanel').classList.contains('active')) renderAchievements();
  }

  // ---------- modal focus management ----------
  // Traps Tab focus inside an open modal so keyboard users can't tab out to
  // the page behind it, restores focus to whatever triggered the modal when
  // it closes, and fires a 'modal-dismiss' event on Escape or backdrop click
  // so each modal can decide what dismissal means (e.g. offline earnings
  // should still be collected, not silently lost).
  function getFocusable(container){
    return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
  }
  let modalReturnFocus = null;
  let modalKeydownHandler = null;
  function openModal(overlayEl){
    modalReturnFocus = document.activeElement;
    overlayEl.classList.add('show');
    const dialog = overlayEl.querySelector('[role="dialog"]');
    const focusables = getFocusable(dialog);
    (focusables[0] || dialog).focus();
    modalKeydownHandler = e => {
      if(e.key === 'Escape'){
        e.preventDefault();
        overlayEl.dispatchEvent(new CustomEvent('modal-dismiss'));
        return;
      }
      if(e.key === 'Tab'){
        const items = getFocusable(dialog);
        if(items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault(); last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', modalKeydownHandler);
  }
  function closeModal(overlayEl){
    overlayEl.classList.remove('show');
    if(modalKeydownHandler){
      document.removeEventListener('keydown', modalKeydownHandler);
      modalKeydownHandler = null;
    }
    if(modalReturnFocus && typeof modalReturnFocus.focus === 'function'){
      modalReturnFocus.focus();
    }
    modalReturnFocus = null;
  }
  [document.getElementById('offlineModal'), document.getElementById('achModal')].forEach(overlay => {
    overlay.addEventListener('click', e => {
      if(e.target === overlay) overlay.dispatchEvent(new CustomEvent('modal-dismiss'));
    });
  });
  function claimAchievement(id){
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if(!ach || state.achievementsClaimed[id]) return;
    if(!ach.cond(state)) return;
    state.achievementsClaimed[id] = true;
    state.achievementBonus += ach.reward;
    renderAchievements(); renderStats();
    document.getElementById('achModalTitle').textContent = 'Achievement Unlocked!';
    document.getElementById('achModalText').textContent = `${ach.name} — permanent +${Math.round(ach.reward*100)}% income bonus applied.`;
    openModal(document.getElementById('achModal'));
  }

  bizPanel.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if(action === 'buy') buyBusiness(id);
    else if(action === 'manager') hireManager(id);
    else if(action === 'upgrade') buyUpgrade(id, btn.dataset.type);
    else if(action === 'toggle'){
      if(state.countries[state.activeCountry][id].level === 0) return;
      if(expandedCards.has(id)) expandedCards.delete(id); else expandedCards.add(id);
      renderBusinesses();
    }
  });
  bizPanel.addEventListener('keydown', e => {
    const toggle = e.target.closest('[data-action="toggle"]');
    if(!toggle) return;
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
      e.preventDefault();
      toggle.click();
    }
  });

  document.getElementById('achPanel').addEventListener('click', e => {
    const claimBtn = e.target.closest('[data-action="claim"]');
    if(claimBtn){ claimAchievement(claimBtn.dataset.id); return; }
    const chalBtn = e.target.closest('[data-action="claim-challenge"]');
    if(chalBtn){ claimChallenge(chalBtn.dataset.which); return; }
  });
  function closeAchModal(){ closeModal(document.getElementById('achModal')); }
  document.getElementById('achModalClose').addEventListener('click', closeAchModal);
  document.getElementById('achModal').addEventListener('modal-dismiss', closeAchModal);

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
    auth.signInWithPopup(googleProvider).then(result => {
      const user = result.user;
      pendingProvider = 'google';
      authNameInput.value = (user.displayName || '').slice(0, 24);
      // Firebase doesn't provide age, so still collect it on the profile step.
      authStepProvider.style.display = 'none';
      authStepProfile.style.display = 'block';
      authCancelBtn.style.display = 'none';
      authAgeInput.focus();
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
    state.profile = { name: name.slice(0, 24), age, provider: pendingProvider || state.profile.provider || 'guest' };
    state.onboarded = true;
    save();
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

  // ---------- leaderboard ----------
  // Only signed-in Google players get a leaderboard entry — guests have no
  // Firebase auth session, so firebaseUser stays null for them and
  // submitScore()/renderLeaderboard() below simply skip writing for them.
  let firebaseUser = null;
  auth.onAuthStateChanged(user => { firebaseUser = user; });

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  let lastLeaderboardSubmit = 0;
  function submitScore(){
    if(!firebaseUser) return;
    const now = Date.now();
    if(now - lastLeaderboardSubmit < 30000) return; // avoid excessive writes
    lastLeaderboardSubmit = now;
    db.collection('leaderboard').doc(firebaseUser.uid).set({
      name: state.profile.name || firebaseUser.displayName || 'Anonymous',
      cash: state.cash,
      totalEarned: state.totalEarned,
      prestigePoints: state.prestigePoints,
      prestigeCount: state.prestigeCount,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.warn('Leaderboard submit failed', err));
  }

  function renderLeaderboard(){
    const statusEl = document.getElementById('leaderboardStatus');
    const listEl = document.getElementById('leaderboardList');
    statusEl.style.display = 'flex';
    statusEl.querySelector('span').textContent = 'Loading leaderboard…';
    listEl.innerHTML = '';
    db.collection('leaderboard').orderBy('totalEarned', 'desc').limit(50).get().then(snap => {
      statusEl.style.display = 'none';
      if(snap.empty){
        listEl.innerHTML = '<div class="settings-item"><span>No scores yet — be the first!</span></div>';
        return;
      }
      let rank = 0;
      listEl.innerHTML = snap.docs.map(doc => {
        rank++;
        const d = doc.data();
        const isMe = firebaseUser && doc.id === firebaseUser.uid;
        return `<div class="lb-row${isMe ? ' me' : ''}"><span class="lb-rank">#${rank}</span><span class="lb-name">${escapeHtml(d.name || 'Anonymous')}</span><span class="lb-cash">¥${fmt(d.totalEarned || 0)}</span></div>`;
      }).join('');
    }).catch(err => {
      console.warn('Leaderboard load failed', err);
      statusEl.querySelector('span').textContent = 'Could not load leaderboard.';
    });
  }

  // ---------- tap to earn ----------
  const bowlWrap = document.getElementById('bowlWrap');
  const tapZone = document.getElementById('tapZone');
  function handleTap(){
    state.totalTaps++;
    addChallengeProgress('taps', 1);
    if(activeEvent.type === 'inspector'){
      activeEvent.tapsDone++;
      spawnFloatingGain(0, 'insp');
      if(activeEvent.tapsDone >= activeEvent.tapsNeeded){
        clearEvent(true);
        checkAchievements();
      }
    } else {
      const gain = nextTapGain();
      state.cash += gain;
      state.totalEarned += gain;
      addChallengeProgress('earn', gain);
      spawnFloatingGain(gain);
    }
    renderStats();
    checkAchievements();
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
    document.querySelectorAll('.nav-btn').forEach(b => {
      const on = b.dataset.panel === panelId;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.panel-view').forEach(p => p.classList.toggle('active', p.id === panelId));
    if(panelId === 'achPanel') renderAchievements();
    if(panelId === 'worldPanel') renderWorld();
    if(panelId === 'leaderboardPanel') renderLeaderboard();
  }
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => activatePanel(btn.dataset.panel));
  });
  document.getElementById('countrySwitchBtn').addEventListener('click', () => activatePanel('worldPanel'));

  document.getElementById('prestigeBtn').addEventListener('click', doPrestige);
  document.getElementById('saveBtn').addEventListener('click', () => { save(); alert('Saved!'); });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if(confirm('Reset ALL progress? This cannot be undone.')){
      localStorage.removeItem(SAVE_KEY);
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
    pendingOfflineGain = rate * elapsedSec * CONFIG.OFFLINE_EARN_MULT;
    if(pendingOfflineGain < CONFIG.OFFLINE_MIN_GAIN) return false;
    document.getElementById('offlineText').textContent =
      `While you were away for ${Math.round(elapsedSec/60)} min, your shops earned ${fmt(pendingOfflineGain)}.`;
    openModal(document.getElementById('offlineModal'));
    return true;
  }
  function collectOffline(multiplier){
    const amount = pendingOfflineGain * multiplier;
    state.cash += amount;
    state.totalEarned += amount;
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
    const gain = totalRatePerSec() * dt;
    if(gain > 0){
      state.cash += gain;
      state.totalEarned += gain;
      addChallengeProgress('earn', gain);
    }
    maybeTriggerEvent();
    tickEvent();
    if(now - lastStatsRender >= CONFIG.STATS_RENDER_INTERVAL_MS){
      renderStats();
      lastStatsRender = now;
    }
    requestAnimationFrame(tick);
  }

  setInterval(() => { refreshBusinessAffordability(); checkAchievements(); ensureChallenges(); }, CONFIG.AFFORDABILITY_REFRESH_MS);
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
    const offlineModalShown = checkOfflineEarnings();
    if(!offlineModalShown) maybeShowDailyStreak();
    renderBusinesses();
    renderAchievements();
    renderWorld();
    renderStats();
    requestAnimationFrame(tick);
  }

  load();
  renderProfileSettings();
  if(state.onboarded){
    startGame();
  } else {
    openAuthOverlay('onboard');
  }

  window.addEventListener('beforeunload', save);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if(document.hidden) save(); });

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
    });
  }

})();
