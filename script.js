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
      id:'italy', name:'Italy', icon:'🇮🇹', tagline:'Pasta, pizza & espresso', unlockCost:350000,
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
      id:'mexico', name:'Mexico', icon:'🇲🇽', tagline:'Tacos, salsa & fire', unlockCost:45000000,
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
      id:'india', name:'India', icon:'🇮🇳', tagline:'Curry, spice & chai', unlockCost:9000000000,
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
    // Tuned for a much slower, grindier climb: costs escalate faster per
    // level than income does, so brute-force leveling stops paying for
    // itself sooner and players have to lean harder on managers, upgrades,
    // reputation, and prestige to keep progressing.
    COST_GROWTH: 1.19,              // cost multiplier per business level purchased (was 1.15)
    MANAGER_COST_MULT: 130,         // manager costs this many times the business's base cost (was 80)
    MANAGER_UNLOCK_LEVEL: 5,        // business must reach this level before a manager can be hired
    MANAGER_INCOME_MULT: 1.5,       // +50% income once a manager is hired
    LEVEL_INCOME_SCALING: 0.006,    // each business level adds this fraction of extra income on top of linear scaling (was 0.01)

    // Prestige
    PRESTIGE_BONUS_PER_POINT: 0.015, // each Miso Point adds 1.5% to the global income multiplier (was 2%)
    PRESTIGE_EARNINGS_DIVISOR: 8e6, // totalEarned is divided by this before sqrt to get potential prestige points (was 1e6 — fewer points per run)
    SHARDS_PER_PRESTIGE_POINT: 10,  // potential Miso Points are divided by this (then floored) to get Umami Shards earned on that same prestige

    // Tapping
    TAP_SCALING_FACTOR: 0.000004,   // how much lifetime earnings boost each tap's base cash gain (was 0.00001 — tapping matters less late-game, forcing real investment)

    // Random events
    EVENT_CHECK_INTERVAL_MS: 15000, // how often we roll for a new event
    EVENT_TRIGGER_CHANCE: 0.12,     // chance a check actually starts an event
    LUCKY_EVENT_SHARE: 0.15,        // of triggered events, this fraction are Lucky Customer (rest split between Critic/Inspector below)
    LUCKY_DURATION_MS: 8000,
    LUCKY_TAP_MULT: 8,              // taps pay this many times their normal cash gain during the event
    CRITIC_EVENT_SHARE: 0.7,        // of the NON-lucky remainder, this fraction are Food Critic (rest are Health Inspector)
    CRITIC_DURATION_MS: 60000,
    CRITIC_INCOME_MULT: 2.5,
    INSPECTOR_DURATION_MS: 20000,
    INSPECTOR_TAPS_NEEDED: 15,
    INSPECTOR_INCOME_MULT: 0.4,

    // Cash milestones (short celebratory popups, separate from Achievements)
    MILESTONE_BONUS_SECONDS: 15,    // milestone bonus = this many seconds of current income/sec

    // Offline earnings
    OFFLINE_MIN_SEC: 30,            // don't show the modal for very short absences
    OFFLINE_MAX_HOURS: 4,           // cap how much offline time counts toward the reward
    OFFLINE_EARN_MULT: 0.5,         // offline earnings accrue at 50% of the live rate
    OFFLINE_MIN_GAIN: 1,            // don't show the modal for a negligible amount
    OFFLINE_AD_MULT: 2,             // "watch ad to double" multiplier

    // UI / performance timing
    STATS_RENDER_INTERVAL_MS: 100,  // throttle stats DOM writes to ~10fps
    AFFORDABILITY_REFRESH_MS: 1000, // how often buy/manager/upgrade buttons re-check affordability
    AUTOSAVE_INTERVAL_MS: 5000,
    FLOAT_GAIN_LIFETIME_MS: 900,    // how long the "+¥X" tap popup stays before removal
    FLOAT_GAIN_SPREAD_MIN_PCT: 45,  // horizontal placement range for the tap popup (min%)
    FLOAT_GAIN_SPREAD_RANGE_PCT: 10, // ...plus a random amount up to this many percentage points

    // Tap feedback ("juice") — screen shake, particle burst, pop sound, haptic
    TAP_SHAKE_MS: 220,
    TAP_PARTICLE_COUNT: 6,
    TAP_PARTICLE_MIN_DIST: 26,
    TAP_PARTICLE_DIST_RANGE: 26,
    TAP_PARTICLE_LIFETIME_MS: 480,
    TAP_HAPTIC_MS: 12,           // normal reward tap
    TAP_HAPTIC_INSPECTOR_MS: 8,  // lighter buzz for health-inspector taps (no cash reward)

    // Reputation (0–100). Multiplies passive income; decays while the game is open.
    REP_START: 70,
    REP_MIN: 0,
    REP_MAX: 100,
    REP_DECAY_PER_SEC: 0.015,      // ~1 point per minute while playing
    REP_TAP_GAIN: 0.08,            // small bump per reward tap
    REP_ORDER_GAIN: 4,             // fulfill a customer order
    REP_ORDER_MISS: 3,             // let an order expire
    REP_INSPECTOR_PASS: 5,
    REP_INSPECTOR_FAIL: 8,
    REP_CRITIC_GAIN: 2,
    REP_REPAIR_COST_MULT: 8,       // cash repair costs this many seconds of income
    REP_REPAIR_AMOUNT: 12,         // points restored per paid repair
    // Income multiplier from reputation: linear from REP_INCOME_MIN at 0 to REP_INCOME_MAX at 100
    REP_INCOME_MIN: 0.55,
    REP_INCOME_MAX: 1.45,

    // Customer orders (active-play requests near the bowl)
    ORDER_CHECK_INTERVAL_MS: 22000,
    ORDER_TRIGGER_CHANCE: 0.28,
    ORDER_DURATION_MS: 18000,
    ORDER_REWARD_SECONDS: 12,      // bonus cash ≈ this many seconds of current income
    ORDER_REWARD_TAP_MULT: 1.35,   // also scales with nextTapGain() a bit

    // Crafting / signature ramen
    INGREDIENT_DROP_CHANCE: 0.22,  // chance a business level-up grants an ingredient
    RECIPE_DURATION_MS: 90000,     // how long a crafted signature ramen boost lasts

    // Staff (manager) leveling — hired managers can be trained further
    MANAGER_MAX_LEVEL: 10,         // level 1 = just hired; up to 10
    MANAGER_TRAIN_COST_MULT: 25,   // train cost = baseCost * this * growth^level
    MANAGER_TRAIN_COST_GROWTH: 1.45,
    MANAGER_LEVEL_INCOME_BOOST: 0.06, // +6% income for that shop per manager level above 0
    MANAGER_LEVEL_OFFLINE_BOOST: 0.02, // +2% offline rate contribution per level (global soft)

    // Seasonal events
    SEASONAL_CHALLENGE_SCALE: 2.5  // seasonal challenges are harder / richer than daily
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

  // Second prestige layer. Umami Shards are earned alongside Miso Points on
  // every Prestige, but trickle in far more slowly (see SHARDS_PER_PRESTIGE_POINT),
  // and are NEVER reset by anything — not even Prestige itself. Unlike Miso
  // Points (a flat +2%/point multiplier), each Shard upgrade does something
  // qualitatively different, so late-game players who've prestiged dozens of
  // times still have fresh things to choose between instead of just "more %".
  const META_UPGRADES = [
    {id:'umami',   icon:'🍥', name:'Umami Mastery',    desc:'+3% global income per level',        boost:0.03, baseCost:1, costGrowth:1.35, max:30},
    {id:'tap',     icon:'👆', name:'Tap Mastery',      desc:'+10% tap gain per level',             boost:0.10, baseCost:1, costGrowth:1.30, max:20},
    {id:'manager', icon:'🧑‍🍳', name:'Manager Training', desc:'-3% manager hiring cost per level',   boost:0.03, baseCost:2, costGrowth:1.40, max:10},
    {id:'offline', icon:'🌙', name:'Night Shift',      desc:'+8% offline earning rate per level',  boost:0.08, baseCost:2, costGrowth:1.35, max:10},
    {id:'luck',    icon:'🍀', name:"Fortune's Favor",  desc:'+1% random event chance per level',   boost:0.01, baseCost:3, costGrowth:1.50, max:8},
  ];

  // Ingredients drop when you level businesses (themed by country). Used only
  // for crafting signature ramen — no other economy touchpoints.
  const INGREDIENTS = [
    {id:'noodles',   icon:'🍜', name:'Fresh Noodles',   country:'japan'},
    {id:'broth',     icon:'🍲', name:'Rich Broth',      country:'japan'},
    {id:'chashu',    icon:'🥓', name:'Chashu Pork',     country:'japan'},
    {id:'nori',      icon:'🍙', name:'Nori Sheets',     country:'japan'},
    {id:'dough',     icon:'🥖', name:'Pasta Dough',     country:'italy'},
    {id:'tomato',    icon:'🍅', name:'San Marzano',     country:'italy'},
    {id:'basil',     icon:'🌿', name:'Fresh Basil',     country:'italy'},
    {id:'cheese',    icon:'🧀', name:'Aged Parmesan',   country:'italy'},
    {id:'tortilla',  icon:'🌮', name:'Corn Tortilla',   country:'mexico'},
    {id:'salsa',     icon:'🌶️', name:'Fire Salsa',      country:'mexico'},
    {id:'avocado',   icon:'🥑', name:'Ripe Avocado',    country:'mexico'},
    {id:'lime',      icon:'🍋', name:'Zesty Lime',      country:'mexico'},
    {id:'spice',     icon:'🧂', name:'Garam Masala',    country:'india'},
    {id:'naan',      icon:'🫓', name:'Warm Naan',       country:'india'},
    {id:'paneer',    icon:'🧈', name:'Fresh Paneer',    country:'india'},
    {id:'chai',      icon:'🍵', name:'Masala Chai',     country:'india'},
  ];
  // Signature recipes: consume ingredients for a temporary global boost.
  // boost: { income?: number, tap?: number, rep?: number } — additive multipliers / flat rep.
  const RECIPES = [
    {id:'tonkotsu',   icon:'🍜', name:'Signature Tonkotsu', desc:'+40% income for 90s',
      cost:{noodles:2, broth:2, chashu:1}, boost:{income:0.40}},
    {id:'miso_bomb',  icon:'🍥', name:'Miso Umami Bomb',   desc:'+60% tap gain for 90s',
      cost:{noodles:1, broth:1, nori:2}, boost:{tap:0.60}},
    {id:'carbonara',  icon:'🍝', name:'Ramen Carbonara',   desc:'+25% income & +5 rep',
      cost:{dough:2, cheese:1, basil:1}, boost:{income:0.25, rep:5}},
    {id:'spicy_taco', icon:'🌶️', name:'Spicy Taco Ramen',  desc:'+50% income for 90s',
      cost:{tortilla:1, salsa:2, lime:1}, boost:{income:0.50}},
    {id:'curry_bowl', icon:'🍛', name:'Curry Ramen Bowl',  desc:'+30% income & +20% tap',
      cost:{spice:2, naan:1, paneer:1}, boost:{income:0.30, tap:0.20}},
    {id:'legend',     icon:'👑', name:'Empire Special',    desc:'+75% income for 90s',
      cost:{noodles:2, broth:1, tomato:1, salsa:1, spice:1, cheese:1}, boost:{income:0.75}},
  ];
  // Customer order templates — short timed requests the player can fulfill with a tap.
  const ORDER_TYPES = [
    {id:'spicy',   icon:'🌶️', label:'Extra spicy!',       flavor:'A customer wants heat.'},
    {id:'extra',   icon:'🥚', label:'Extra toppings',     flavor:'Pile it high, please.'},
    {id:'quick',   icon:'⚡', label:'Rush order',         flavor:'They\'re in a hurry!'},
    {id:'classic', icon:'🍜', label:'Classic bowl',       flavor:'Keep it traditional.'},
    {id:'veggie',  icon:'🥬', label:'Vegetarian special', flavor:'No meat this time.'},
    {id:'large',   icon:'📦', label:'Large portion',      flavor:'Make it a big one.'},
  ];

  // Story chapters — narrative quests tied to each country unlock path.
  // Quests unlock in order within a chapter; chapters gate on country unlock
  // (except Japan, which is always available). cond(s) returns true when done.
  const STORY_CHAPTERS = [
    {
      id:'japan', country:'japan', icon:'🇯🇵', title:'Chapter 1: First Steam',
      blurb:'A single cart in the alley. Prove you can feed the neighborhood.',
      quests:[
        {id:'j1', icon:'🛒', name:'Open the Street Cart', desc:'Buy your first Street Cart', cond:s => (s.countries.japan&&s.countries.japan.cart&&s.countries.japan.cart.level>0), reward:{cashSec:20}},
        {id:'j2', icon:'👋', name:'Serve 50 Bowls', desc:'Tap the bowl 50 times', cond:s => s.totalTaps>=50, reward:{cashSec:30}},
        {id:'j3', icon:'🏮', name:'Noodle Stall Rising', desc:'Open a Noodle Stall', cond:s => (s.countries.japan&&s.countries.japan.stall&&s.countries.japan.stall.level>0), reward:{cashSec:40}},
        {id:'j4', icon:'🧑‍🍳', name:'Hire Help', desc:'Hire any manager in Japan', cond:s => Object.values((s.countries.japan)||{}).some(b=>b.manager), reward:{cashSec:45, miso:0}},
        {id:'j5', icon:'🏠', name:'Corner Shop', desc:'Open a Corner Shop', cond:s => (s.countries.japan&&s.countries.japan.shop&&s.countries.japan.shop.level>0), reward:{cashSec:60}},
        {id:'j6', icon:'💴', name:'Neighborhood Hero', desc:'Earn ¥10,000 total', cond:s => s.totalEarned>=1e4, reward:{cashSec:80}},
      ]
    },
    {
      id:'italy', country:'italy', icon:'🇮🇹', title:'Chapter 2: Roman Expansion',
      blurb:'Pasta meets broth. Cross the sea and plant a flag in Italy.',
      quests:[
        {id:'i1', icon:'🇮🇹', name:'Unlock Italy', desc:'Spend cash to unlock Italy', cond:s => (s.unlockedCountries||[]).includes('italy'), reward:{cashSec:50}},
        {id:'i2', icon:'🥖', name:'Panini Cart', desc:'Open a Panini Cart in Italy', cond:s => (s.countries.italy&&s.countries.italy.cart&&s.countries.italy.cart.level>0), reward:{cashSec:40}},
        {id:'i3', icon:'🍕', name:'Pizza Stall', desc:'Open a Pizza Stall', cond:s => (s.countries.italy&&s.countries.italy.stall&&s.countries.italy.stall.level>0), reward:{cashSec:50}},
        {id:'i4', icon:'🧑‍🍳', name:'Italian Manager', desc:'Hire a manager in Italy', cond:s => Object.values((s.countries.italy)||{}).some(b=>b.manager), reward:{cashSec:55}},
        {id:'i5', icon:'🍝', name:'Trattoria', desc:'Open a Trattoria', cond:s => (s.countries.italy&&s.countries.italy.shop&&s.countries.italy.shop.level>0), reward:{cashSec:70}},
        {id:'i6', icon:'💰', name:'Pasta Empire', desc:'Earn ¥1,000,000 total', cond:s => s.totalEarned>=1e6, reward:{cashSec:100, miso:1}},
      ]
    },
    {
      id:'mexico', country:'mexico', icon:'🇲🇽', title:'Chapter 3: Fire & Spice',
      blurb:'Heat rises. Bring the empire to the markets of Mexico.',
      quests:[
        {id:'m1', icon:'🇲🇽', name:'Unlock Mexico', desc:'Unlock Mexico on the World map', cond:s => (s.unlockedCountries||[]).includes('mexico'), reward:{cashSec:80}},
        {id:'m2', icon:'🌮', name:'Taco Cart', desc:'Open a Taco Cart', cond:s => (s.countries.mexico&&s.countries.mexico.cart&&s.countries.mexico.cart.level>0), reward:{cashSec:50}},
        {id:'m3', icon:'🌶️', name:'Salsa Stall', desc:'Open a Salsa Stall', cond:s => (s.countries.mexico&&s.countries.mexico.stall&&s.countries.mexico.stall.level>0), reward:{cashSec:60}},
        {id:'m4', icon:'⭐', name:'Train a Star', desc:'Train any manager to level 3+', cond:s => allBusinessStates(s).some(b=>(b.managerLevel||0)>=3), reward:{cashSec:90}},
        {id:'m5', icon:'🏭', name:'Tortilla Factory', desc:'Open a Tortilla Factory', cond:s => (s.countries.mexico&&s.countries.mexico.factory&&s.countries.mexico.factory.level>0), reward:{cashSec:120}},
        {id:'m6', icon:'🌆', name:'Aztec Ambition', desc:'Earn ¥100,000,000 total', cond:s => s.totalEarned>=1e8, reward:{cashSec:150, miso:1}},
      ]
    },
    {
      id:'india', country:'india', icon:'🇮🇳', title:'Chapter 4: Spice Route',
      blurb:'The final frontier of flavor. Curry, chai, and a global crown.',
      quests:[
        {id:'d1', icon:'🇮🇳', name:'Unlock India', desc:'Unlock India on the World map', cond:s => (s.unlockedCountries||[]).includes('india'), reward:{cashSec:100}},
        {id:'d2', icon:'🍵', name:'Chai Cart', desc:'Open a Chai Cart', cond:s => (s.countries.india&&s.countries.india.cart&&s.countries.india.cart.level>0), reward:{cashSec:60}},
        {id:'d3', icon:'🍛', name:'Curry House', desc:'Open a Curry House', cond:s => (s.countries.india&&s.countries.india.shop&&s.countries.india.shop.level>0), reward:{cashSec:80}},
        {id:'d4', icon:'🧑‍🍳', name:'Master Staff', desc:'Train any manager to level 5+', cond:s => allBusinessStates(s).some(b=>(b.managerLevel||0)>=5), reward:{cashSec:120}},
        {id:'d5', icon:'🕌', name:'Mughal HQ', desc:'Open the Mughal Empire HQ', cond:s => (s.countries.india&&s.countries.india.global&&s.countries.india.global.level>0), reward:{cashSec:200}},
        {id:'d6', icon:'🌍', name:'World Tour Complete', desc:'Unlock every country', cond:s => (s.unlockedCountries||[]).length>=4, reward:{cashSec:250, miso:2}},
      ]
    },
  ];

  // Seasonal / limited-time events. Month is 1–12; day ranges are inclusive.
  // When "today" falls in range, the event is live (client clock).
  // challengeType mirrors daily challenge types for progress tracking.
  const SEASONAL_EVENTS = [
    {id:'newyear',   icon:'🎆', name:'New Year Noodles',   month:1,  startDay:1,  endDay:7,   skinId:'newyear',   challengeType:'taps', challengeTarget:200, rewardMiso:1, blurb:'Ring in the year with a thousand bowls.'},
    {id:'valentine', icon:'💝', name:'Hearty Broth',       month:2,  startDay:10, endDay:16,  skinId:'valentine',challengeType:'earn', challengeTarget:0, rewardMiso:1, blurb:'Serve love by the ladle.'}, // target scaled at runtime
    {id:'spring',    icon:'🌸', name:'Sakura Season',      month:3,  startDay:20, endDay:31,  skinId:'sakura_s', challengeType:'buy',  challengeTarget:15, rewardMiso:1, blurb:'Petals in the steam.'},
    {id:'summer',    icon:'☀️', name:'Summer Festival',    month:7,  startDay:1,  endDay:21,  skinId:'summer',   challengeType:'taps', challengeTarget:300, rewardMiso:1, blurb:'Festival stalls and fireworks.'},
    {id:'halloween', icon:'🎃', name:'Spooky Ramen',       month:10, startDay:24, endDay:31,  skinId:'halloween',challengeType:'earn', challengeTarget:0, rewardMiso:1, blurb:'A little fear, a lot of umami.'},
    {id:'holiday',   icon:'🎄', name:'Winter Feast',       month:12, startDay:15, endDay:31,  skinId:'holiday',  challengeType:'buy',  challengeTarget:20, rewardMiso:2, blurb:'The empire\'s warmest week.'},
  ];

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
    {id:'lucky_break', icon:'🍀', name:'Lucky Break',       desc:'Catch a Lucky Customer event',    reward:0.02, cond: s => (s.luckyEventsSeen||0) >= 1},
    {id:'world_tour',  icon:'🌍', name:'World Tour',        desc:'Expand your empire to every country', reward:0.05, cond: s => s.unlockedCountries.length >= COUNTRIES.length},
    {id:'first_order', icon:'🧾', name:'Order Up!',         desc:'Fulfill your first customer order', reward:0.02, cond: s => (s.ordersFulfilled||0) >= 1},
    {id:'order_pro',   icon:'🛎️', name:'Service Pro',       desc:'Fulfill 25 customer orders',       reward:0.03, cond: s => (s.ordersFulfilled||0) >= 25},
    {id:'first_craft', icon:'🧪', name:'Kitchen Debut',     desc:'Craft your first signature ramen', reward:0.02, cond: s => (s.recipesCrafted||0) >= 1},
    {id:'chef_five',   icon:'👨‍🍳', name:'Five-Star Kitchen', desc:'Craft 10 signature ramen dishes',  reward:0.03, cond: s => (s.recipesCrafted||0) >= 10},
    {id:'rep_high',    icon:'⭐', name:'Beloved Shop',      desc:'Reach 95 reputation',              reward:0.03, cond: s => (s.reputation||0) >= 95},
    {id:'story_japan', icon:'📖', name:'First Chapter',     desc:'Complete Japan story chapter',      reward:0.02, cond: s => isChapterComplete(s,'japan')},
    {id:'story_all',   icon:'📚', name:'Full Saga',         desc:'Complete every story chapter',      reward:0.05, cond: s => STORY_CHAPTERS.every(ch => isChapterComplete(s, ch.id))},
    {id:'staff_train', icon:'🎓', name:'Staff Trainer',     desc:'Train any manager to level 5',      reward:0.03, cond: s => allBusinessStates(s).some(b => (b.managerLevel||0) >= 5)},
    {id:'staff_max',   icon:'🏅', name:'Head Chef',         desc:'Max a manager to level 10',         reward:0.04, cond: s => allBusinessStates(s).some(b => (b.managerLevel||0) >= 10)},
  ];
  // Cash-earned thresholds that trigger a celebratory milestone popup (confetti
  // + chime + a small bonus). Independent of ACHIEVEMENTS above: these are
  // meant to fire often and just be a quick dopamine hit, not a strategic goal.
  const MILESTONES = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15];

  // Pure-cosmetic bowl skins, unlocked as milestoneIdx (see MILESTONES above)
  // climbs. No stat effect whatsoever — just something to collect and show
  // off, which is why milestoneReq points at specific MILESTONES indices
  // rather than needing its own separate threshold system.
  const COSMETICS = [
    {id:'classic',   name:'Classic Bowl',   icon:'🍜', theme:'classic',   milestoneReq:-1, desc:'Where it all began.'},
    {id:'golden',    name:'Golden Bowl',    icon:'🥣', theme:'golden',    milestoneReq:1,  desc:'A gilded bowl for a rising empire.'},
    {id:'jade',      name:'Jade Bowl',      icon:'🍵', theme:'jade',      milestoneReq:3,  desc:'Cool jade glaze, calm and steady.'},
    {id:'sakura',    name:'Sakura Bowl',    icon:'🌸', theme:'sakura',    milestoneReq:5,  desc:'Petals swirl in the broth.'},
    {id:'fire',      name:'Fire Wok',       icon:'🔥', theme:'fire',      milestoneReq:7,  desc:'Serving up pure heat.'},
    {id:'cosmic',    name:'Cosmic Bowl',    icon:'🌌', theme:'cosmic',    milestoneReq:9,  desc:'Noodles from beyond the stars.'},
    {id:'legendary', name:'Legendary Bowl', icon:'👑', theme:'legendary', milestoneReq:11, desc:'The stuff of ramen legend.'},
    // Seasonal skins — unlocked by completing the matching seasonal challenge
    {id:'newyear',   name:'New Year Bowl',  icon:'🎆', theme:'newyear',   seasonal:true, desc:'Fireworks in the broth.'},
    {id:'valentine', name:'Heart Bowl',     icon:'💝', theme:'sakura',    seasonal:true, desc:'Served with a side of affection.'},
    {id:'sakura_s',  name:'Festival Sakura',icon:'🌸', theme:'sakura',    seasonal:true, desc:'Seasonal petal glaze.'},
    {id:'summer',    name:'Summer Bowl',    icon:'☀️', theme:'fire',      seasonal:true, desc:'Bright as a festival lantern.'},
    {id:'halloween', name:'Spooky Bowl',    icon:'🎃', theme:'cosmic',    seasonal:true, desc:'A little eerie, very delicious.'},
    {id:'holiday',   name:'Winter Feast',   icon:'🎄', theme:'golden',    seasonal:true, desc:'The empire\'s holiday special.'},
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
      if(!state.storyClaimed) state.storyClaimed = {};
      if(!state.seasonal) state.seasonal = { eventId: null, progress: 0, claimed: false, skinUnlocked: {} };
      if(!state.seasonal.skinUnlocked) state.seasonal.skinUnlocked = {};
      if(state.guildId === undefined) state.guildId = null;
      if(state.guildName === undefined) state.guildName = null;
      if(!state.gifts) state.gifts = { lastGiftDate: null, giftedToday: {}, pendingClaimed: {} };
      if(!state.gifts.giftedToday) state.gifts.giftedToday = {};
      if(!state.gifts.pendingClaimed) state.gifts.pendingClaimed = {};
      // Migrate managerLevel on existing businesses
      COUNTRIES.forEach(country => {
        const bizState = state.countries[country.id];
        if(!bizState) return;
        country.businesses.forEach(def => {
          const biz = bizState[def.id];
          if(!biz) return;
          if(biz.managerLevel === undefined) biz.managerLevel = biz.manager ? 1 : 0;
        });
      });
    }catch(e){ console.warn('save corrupt, starting fresh'); }
  }

  // ---------- math ----------
  // ---------- meta upgrades (Umami Shards — never reset, see META_UPGRADES) ----------
  function metaLevel(id){ return (state.metaUpgrades && state.metaUpgrades[id]) || 0; }
  function metaUpgradeCost(def){ return def.baseCost * Math.pow(def.costGrowth, metaLevel(def.id)); }
  function metaBonus(id){
    const def = META_UPGRADES.find(m => m.id === id);
    return def ? metaLevel(id) * def.boost : 0;
  }
  function potentialShards(){ return Math.floor(potentialPrestigePoints() / CONFIG.SHARDS_PER_PRESTIGE_POINT); }

  function prestigeMultiplier(){ return 1 + state.prestigePoints * CONFIG.PRESTIGE_BONUS_PER_POINT; }
  function reputationMultiplier(){
    const r = Math.max(CONFIG.REP_MIN, Math.min(CONFIG.REP_MAX, state.reputation || CONFIG.REP_START));
    const t = r / CONFIG.REP_MAX;
    return CONFIG.REP_INCOME_MIN + (CONFIG.REP_INCOME_MAX - CONFIG.REP_INCOME_MIN) * t;
  }
  function activeRecipeBoost(kind){
    if(!state.activeRecipe || state.activeRecipe.endsAt <= Date.now()) return 0;
    const def = RECIPES.find(r => r.id === state.activeRecipe.id);
    return (def && def.boost && def.boost[kind]) || 0;
  }
  function globalMultiplier(){
    return prestigeMultiplier()
      * (1 + state.achievementBonus)
      * (1 + metaBonus('umami'))
      * reputationMultiplier()
      * (1 + activeRecipeBoost('income'))
      * (typeof giftBoostMultiplier === 'function' ? giftBoostMultiplier() : 1);
  }
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
    if(!b.manager) return businessIncome(def, b);
    const level = Math.max(1, b.managerLevel || 1);
    const levelBoost = 1 + (level - 1) * CONFIG.MANAGER_LEVEL_INCOME_BOOST;
    return businessIncome(def, b) * CONFIG.MANAGER_INCOME_MULT * levelBoost;
  }
  // Manager Training (Shards) discounts hiring cost, capped so a maxed line
  // can never make managers free.
  function managerCost(def){ return def.baseCost * CONFIG.MANAGER_COST_MULT * (1 - Math.min(0.8, metaBonus('manager'))); }
  function managerTrainCost(def, currentLevel){
    // currentLevel is the level BEFORE training (1 = just hired)
    return def.baseCost * CONFIG.MANAGER_TRAIN_COST_MULT * Math.pow(CONFIG.MANAGER_TRAIN_COST_GROWTH, Math.max(0, currentLevel - 1));
  }
  function totalManagerOfflineBoost(){
    let levels = 0;
    allBusinessStates(state).forEach(b => { if(b.manager) levels += Math.max(0, (b.managerLevel || 1) - 1); });
    return levels * CONFIG.MANAGER_LEVEL_OFFLINE_BOOST;
  }

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
    const luckyMult = activeEvent.type === 'lucky' ? CONFIG.LUCKY_TAP_MULT : 1;
    return (1 + state.totalEarned * CONFIG.TAP_SCALING_FACTOR)
      * globalMultiplier()
      * luckyMult
      * (1 + metaBonus('tap'))
      * (1 + activeRecipeBoost('tap'));
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
    addEarned(pendingDailyReward.cash);
    state.prestigePoints += pendingDailyReward.miso;
    pendingDailyReward = null;
    closeModal(document.getElementById('dailyStreakModal'));
    save(); renderStats(); checkMilestones();
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
    if(typeof addSeasonalProgress === 'function') addSeasonalProgress(type, amount);
  }
  function claimChallenge(which){
    const c = state.challenges[which];
    if(!c || c.claimed || c.progress < c.target) return;
    state.cash += c.reward.cash || 0;
    addEarned(c.reward.cash || 0);
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
    if(Math.random() < CONFIG.EVENT_TRIGGER_CHANCE + metaBonus('luck')){
      const roll = Math.random();
      if(roll < CONFIG.LUCKY_EVENT_SHARE) startLuckyEvent();
      else if(roll < CONFIG.LUCKY_EVENT_SHARE + (1 - CONFIG.LUCKY_EVENT_SHARE) * CONFIG.CRITIC_EVENT_SHARE) startCriticEvent();
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
  // Rare, short-lived tap bonus — reuses the same activeEvent/banner plumbing
  // as Critic/Inspector above. Doesn't touch passive income (eventMultiplier())
  // since it's meant to reward active tapping specifically; see nextTapGain().
  function startLuckyEvent(){
    activeEvent = {type:'lucky', endsAt: Date.now() + CONFIG.LUCKY_DURATION_MS, tapsNeeded:0, tapsDone:0};
    state.luckyEventsSeen = (state.luckyEventsSeen||0) + 1;
    renderEventBanner();
    checkAchievements();
  }
  function clearEvent(passed){
    if(activeEvent.type === 'inspector'){
      if(passed){
        state.inspectorsPassed++;
        adjustReputation(CONFIG.REP_INSPECTOR_PASS);
      } else {
        adjustReputation(-CONFIG.REP_INSPECTOR_FAIL);
      }
    } else if(activeEvent.type === 'critic'){
      adjustReputation(CONFIG.REP_CRITIC_GAIN);
    }
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
    } else if(activeEvent.type === 'lucky'){
      banner.className = 'event-banner show lucky';
      document.getElementById('eventIcon').textContent = '🍀';
      document.getElementById('eventText').textContent = `Lucky Customer! Taps pay x${CONFIG.LUCKY_TAP_MULT}`;
      bowl.classList.remove('inspector-mode');
      inspProg.classList.remove('show');
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

  // ---------- reputation ----------
  function adjustReputation(delta){
    state.reputation = Math.max(CONFIG.REP_MIN, Math.min(CONFIG.REP_MAX, (state.reputation || CONFIG.REP_START) + delta));
  }
  function tickReputation(dt){
    if(dt <= 0) return;
    adjustReputation(-CONFIG.REP_DECAY_PER_SEC * dt);
  }
  function reputationRepairCost(){
    return Math.max(10, totalRatePerSec() * CONFIG.REP_REPAIR_COST_MULT);
  }
  function repairReputation(){
    if(state.reputation >= CONFIG.REP_MAX) return;
    const cost = reputationRepairCost();
    if(state.cash < cost) return;
    state.cash -= cost;
    adjustReputation(CONFIG.REP_REPAIR_AMOUNT);
    renderStats();
    renderKitchen();
  }

  // ---------- customer orders ----------
  let activeOrder = null; // { typeId, endsAt }
  let nextOrderCheck = Date.now() + CONFIG.ORDER_CHECK_INTERVAL_MS;

  function maybeTriggerOrder(){
    if(activeOrder) return;
    if(activeEvent.type === 'inspector') return; // don't stack with inspector taps
    if(Date.now() < nextOrderCheck) return;
    nextOrderCheck = Date.now() + CONFIG.ORDER_CHECK_INTERVAL_MS;
    if(Math.random() < CONFIG.ORDER_TRIGGER_CHANCE){
      const def = ORDER_TYPES[Math.floor(Math.random() * ORDER_TYPES.length)];
      activeOrder = { typeId: def.id, endsAt: Date.now() + CONFIG.ORDER_DURATION_MS };
      renderOrderCard();
    }
  }
  function fulfillOrder(){
    if(!activeOrder) return;
    const rate = Math.max(totalRatePerSec(), 0.5);
    const gain = rate * CONFIG.ORDER_REWARD_SECONDS + nextTapGain() * CONFIG.ORDER_REWARD_TAP_MULT;
    state.cash += gain;
    addEarned(gain);
    state.ordersFulfilled = (state.ordersFulfilled || 0) + 1;
    adjustReputation(CONFIG.REP_ORDER_GAIN);
    spawnFloatingGain(gain);
    fireTapFeedback(false);
    activeOrder = null;
    renderOrderCard();
    renderStats();
    checkAchievements();
  }
  function missOrder(){
    if(!activeOrder) return;
    adjustReputation(-CONFIG.REP_ORDER_MISS);
    activeOrder = null;
    renderOrderCard();
    renderStats();
  }
  function renderOrderCard(){
    const el = document.getElementById('orderCard');
    if(!el) return;
    if(!activeOrder){
      el.classList.remove('show');
      return;
    }
    const def = ORDER_TYPES.find(o => o.id === activeOrder.typeId) || ORDER_TYPES[0];
    el.classList.add('show');
    document.getElementById('orderIcon').textContent = def.icon;
    document.getElementById('orderLabel').textContent = def.label;
    document.getElementById('orderFlavor').textContent = def.flavor;
  }
  function tickOrder(){
    if(!activeOrder) return;
    const remain = Math.max(0, activeOrder.endsAt - Date.now());
    const timeEl = document.getElementById('orderTime');
    if(timeEl) timeEl.textContent = Math.ceil(remain/1000) + 's';
    if(remain <= 0) missOrder();
  }

  // ---------- crafting / ingredients ----------
  function ingredientCount(id){ return (state.ingredients && state.ingredients[id]) || 0; }
  function addIngredient(id, n){
    if(!state.ingredients) state.ingredients = {};
    state.ingredients[id] = (state.ingredients[id] || 0) + (n || 1);
  }
  function tryDropIngredient(countryId){
    if(Math.random() > CONFIG.INGREDIENT_DROP_CHANCE) return null;
    const pool = INGREDIENTS.filter(ing => ing.country === countryId && isUnlocked(ing.country));
    // Also allow japan ingredients always once unlocked (always is)
    if(!pool.length) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    addIngredient(pick.id, 1);
    return pick;
  }
  function canCraft(recipe){
    return Object.keys(recipe.cost).every(id => ingredientCount(id) >= recipe.cost[id]);
  }
  function craftRecipe(recipeId){
    const recipe = RECIPES.find(r => r.id === recipeId);
    if(!recipe || !canCraft(recipe)) return;
    if(state.activeRecipe && state.activeRecipe.endsAt > Date.now()) return; // one at a time
    Object.keys(recipe.cost).forEach(id => {
      state.ingredients[id] -= recipe.cost[id];
    });
    state.activeRecipe = { id: recipe.id, endsAt: Date.now() + CONFIG.RECIPE_DURATION_MS };
    state.recipesCrafted = (state.recipesCrafted || 0) + 1;
    if(recipe.boost.rep) adjustReputation(recipe.boost.rep);
    renderKitchen();
    renderStats();
    checkAchievements();
  }
  function tickRecipe(){
    if(state.activeRecipe && state.activeRecipe.endsAt <= Date.now()){
      state.activeRecipe = null;
      renderKitchen();
      renderStats();
    }
  }
  function renderKitchen(){
    const panel = document.getElementById('kitchenPanel');
    if(!panel || !panel.classList.contains('active')) return;
    // Reputation block
    const rep = Math.round(state.reputation || 0);
    const repPct = Math.max(0, Math.min(100, rep));
    const mult = reputationMultiplier();
    const repairCost = reputationRepairCost();
    let html = `
      <div class="chal-section-label">Reputation</div>
      <div class="rep-panel-card">
        <div class="rep-panel-top">
          <span class="rep-panel-score">${rep}/100</span>
          <span class="rep-panel-mult">Income ×${mult.toFixed(2)}</span>
        </div>
        <div class="rep-track big"><div class="rep-fill" style="width:${repPct}%"></div></div>
        <p class="rep-hint">Decays slowly while you play. Fulfill orders, pass inspections, or spend cash to restore it.</p>
        <button class="modal-btn" id="repairRepBtn" ${rep >= CONFIG.REP_MAX || state.cash < repairCost ? 'disabled' : ''}>
          Polish Reputation · ${fmt(repairCost)}
        </button>
      </div>`;

    // Active recipe
    html += `<div class="chal-section-label" style="margin-top:14px;">Signature Ramen</div>`;
    if(state.activeRecipe && state.activeRecipe.endsAt > Date.now()){
      const def = RECIPES.find(r => r.id === state.activeRecipe.id);
      const remain = Math.ceil((state.activeRecipe.endsAt - Date.now()) / 1000);
      html += `<div class="recipe-active-banner">
        <span aria-hidden="true">${def ? def.icon : '🍜'}</span>
        <div><strong>${def ? def.name : 'Boost'}</strong> active · ${remain}s left</div>
      </div>`;
    } else {
      html += `<p class="rep-hint">Craft a signature dish for a temporary boost. Ingredients drop when you level shops.</p>`;
    }

    // Ingredient inventory
    html += `<div class="chal-section-label" style="margin-top:12px;">Ingredients</div><div class="ing-grid">`;
    INGREDIENTS.forEach(ing => {
      const locked = !isUnlocked(ing.country);
      const count = ingredientCount(ing.id);
      html += `<div class="ing-chip${locked ? ' locked' : ''}${count ? ' has' : ''}" title="${ing.name}">
        <span class="ing-icon">${ing.icon}</span>
        <span class="ing-count">${locked ? '🔒' : count}</span>
        <span class="ing-name">${ing.name}</span>
      </div>`;
    });
    html += `</div>`;

    // Recipes
    html += `<div class="chal-section-label" style="margin-top:14px;">Recipes</div>`;
    RECIPES.forEach(recipe => {
      const ok = canCraft(recipe);
      const busy = state.activeRecipe && state.activeRecipe.endsAt > Date.now();
      const costParts = Object.keys(recipe.cost).map(id => {
        const ing = INGREDIENTS.find(i => i.id === id);
        const have = ingredientCount(id);
        const need = recipe.cost[id];
        return `<span class="${have >= need ? 'have' : 'need'}">${ing ? ing.icon : '?'} ${have}/${need}</span>`;
      }).join(' ');
      html += `<div class="recipe-card${!ok || busy ? ' dim' : ''}">
        <div class="recipe-icon" aria-hidden="true">${recipe.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${recipe.name}</div>
          <div class="recipe-desc">${recipe.desc}</div>
          <div class="recipe-cost">${costParts}</div>
        </div>
        <button class="claim-btn" data-action="craft" data-id="${recipe.id}" ${!ok || busy ? 'disabled' : ''}>Craft</button>
      </div>`;
    });
    panel.innerHTML = html;
    const repairBtn = document.getElementById('repairRepBtn');
    if(repairBtn) repairBtn.addEventListener('click', repairReputation);
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

      const mLvl = b.manager ? (b.managerLevel || 1) : 0;
      const mBadge = b.manager
        ? `<span class="manager-badge">${MANAGER_BONUS_LABEL} · Lv${mLvl}</span>`
        : '';
      let staffBtn = '';
      if(!b.manager && b.level >= CONFIG.MANAGER_UNLOCK_LEVEL){
        staffBtn = `<button class="buy-btn manager-btn" data-action="manager" data-id="${def.id}" aria-label="Hire manager for ${def.name}, cost ${fmt(mCost)}" ${state.cash < mCost ? 'disabled' : ''}>${MANAGER_BONUS_LABEL}<small>${fmt(mCost)}</small></button>`;
      } else if(b.manager && mLvl < CONFIG.MANAGER_MAX_LEVEL){
        const tCost = managerTrainCost(def, mLvl);
        staffBtn = `<button class="buy-btn manager-btn train-btn" data-action="train" data-id="${def.id}" aria-label="Train manager for ${def.name} to level ${mLvl+1}, cost ${fmt(tCost)}" ${state.cash < tCost ? 'disabled' : ''}>Train Lv${mLvl+1}<small>${fmt(tCost)}</small></button>`;
      } else if(b.manager){
        staffBtn = `<button class="buy-btn manager-btn" disabled>MAX Lv${mLvl}</button>`;
      }

      card.innerHTML = `
        <div class="biz-main" data-action="toggle" data-id="${def.id}" ${toggleAttrs}>
          <div class="biz-icon" aria-hidden="true">${def.icon}</div>
          <div class="biz-info">
            <div class="biz-name">${def.name} ${mBadge}${b.level>0 ? '<span class="expand-caret'+(isOpen?' open':'')+'" aria-hidden="true">▶</span>':''}</div>
            <div class="biz-level">Level ${b.level}</div>
            <div class="biz-income">${b.level>0 ? fmt(income)+'/s' : 'Not opened yet'}</div>
          </div>
          ${staffBtn}
          <button class="buy-btn" data-action="buy" data-id="${def.id}" aria-label="${buyLabel}" ${!canAfford || locked ? 'disabled' : ''}>${b.level===0?'OPEN':'UPGRADE'}<small>${fmt(cost)}</small></button>
        </div>
        ${b.level > 0 ? `<div class="upgrade-panel${isOpen?' open':''}"><div class="upgrade-row">${upgradeChips}</div></div>` : ''}
      `;
      bizPanel.appendChild(card);

      const cache = { buyBtn: card.querySelector('[data-action="buy"]'), managerBtn: card.querySelector('[data-action="manager"],[data-action="train"]'), upgradeChips: {} };
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
      if(cache.managerBtn){
        if(b.manager){
          const ml = b.managerLevel || 1;
          if(ml >= CONFIG.MANAGER_MAX_LEVEL) cache.managerBtn.disabled = true;
          else cache.managerBtn.disabled = state.cash < managerTrainCost(def, ml);
        } else {
          cache.managerBtn.disabled = state.cash < managerCost(def);
        }
      }
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

  // ---------- story chapters ----------
  function isChapterComplete(s, chapterId){
    const ch = STORY_CHAPTERS.find(c => c.id === chapterId);
    if(!ch) return false;
    const claimed = (s.storyClaimed) || {};
    return ch.quests.every(q => claimed[q.id]);
  }
  function isChapterUnlocked(ch){
    if(ch.country === 'japan') return true;
    return isUnlocked(ch.country);
  }
  function storyQuestRewardCash(q){
    const rate = Math.max(totalRatePerSec(), 1);
    return rate * (q.reward.cashSec || 30);
  }
  function claimStoryQuest(questId){
    if(state.storyClaimed[questId]) return;
    let found = null;
    STORY_CHAPTERS.forEach(ch => {
      const q = ch.quests.find(x => x.id === questId);
      if(q) found = q;
    });
    if(!found || !found.cond(state)) return;
    state.storyClaimed[questId] = true;
    const cash = storyQuestRewardCash(found);
    state.cash += cash;
    addEarned(cash);
    if(found.reward.miso) state.prestigePoints += found.reward.miso;
    save();
    renderAchievements();
    renderStats();
    checkAchievements();
  }
  function renderStorySection(){
    let html = '<div class="chal-section-label" style="margin-top:14px;">Story</div>';
    STORY_CHAPTERS.forEach(ch => {
      const unlocked = isChapterUnlocked(ch);
      const done = isChapterComplete(state, ch.id);
      html += `<div class="story-chapter${unlocked?'':' locked'}">
        <div class="story-chapter-head">
          <span class="story-chapter-icon">${ch.icon}</span>
          <div>
            <div class="story-chapter-title">${ch.title}${done ? ' ✓' : ''}</div>
            <div class="story-chapter-blurb">${unlocked ? ch.blurb : 'Unlock this country on the World map to begin.'}</div>
          </div>
        </div>`;
      if(unlocked){
        let priorDone = true;
        ch.quests.forEach(q => {
          const claimed = !!state.storyClaimed[q.id];
          const ready = priorDone && q.cond(state);
          const lockedQ = !priorDone;
          const cash = storyQuestRewardCash(q);
          let rewardTxt = fmt(cash);
          if(q.reward.miso) rewardTxt += ` + ${q.reward.miso} Miso`;
          html += `<div class="ach-card${claimed?' claimed':''}${lockedQ?' locked':''}">
            <div class="ach-icon${ready||claimed?' done':''}" aria-hidden="true">${q.icon}</div>
            <div class="ach-info">
              <div class="ach-name">${q.name}</div>
              <div class="ach-desc">${q.desc}</div>
              <div class="ach-reward">+${rewardTxt}</div>
            </div>
            <button class="claim-btn${claimed?' done':''}" data-action="claim-story" data-id="${q.id}" ${claimed||!ready?'disabled':''}>${claimed?'✓ Done':(ready?'Claim':'Locked')}</button>
          </div>`;
          if(!claimed) priorDone = false;
        });
      }
      html += `</div>`;
    });
    return html;
  }

  // ---------- seasonal events ----------
  function getActiveSeasonalEvent(){
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return SEASONAL_EVENTS.find(ev => ev.month === month && day >= ev.startDay && day <= ev.endDay) || null;
  }
  function seasonalDaysLeft(ev){
    const now = new Date();
    const end = new Date(now.getFullYear(), ev.month - 1, ev.endDay, 23, 59, 59);
    return Math.max(0, Math.ceil((end - now) / 86400000));
  }
  function ensureSeasonalState(){
    const ev = getActiveSeasonalEvent();
    if(!ev){
      if(state.seasonal && state.seasonal.eventId){
        state.seasonal.eventId = null;
        state.seasonal.progress = 0;
        state.seasonal.claimed = false;
      }
      return null;
    }
    if(!state.seasonal) state.seasonal = { eventId: null, progress: 0, claimed: false, skinUnlocked: {} };
    if(state.seasonal.eventId !== ev.id){
      state.seasonal.eventId = ev.id;
      state.seasonal.progress = 0;
      state.seasonal.claimed = false;
    }
    return ev;
  }
  function seasonalTarget(ev){
    if(ev.challengeType === 'earn'){
      const rate = Math.max(totalRatePerSec(), 1);
      return Math.round(rate * 180 * CONFIG.SEASONAL_CHALLENGE_SCALE);
    }
    return Math.round(ev.challengeTarget || 100);
  }
  function addSeasonalProgress(type, amount){
    const ev = ensureSeasonalState();
    if(!ev || state.seasonal.claimed) return;
    if(ev.challengeType !== type) return;
    const target = seasonalTarget(ev);
    state.seasonal.progress = Math.min(target, (state.seasonal.progress || 0) + amount);
  }
  function claimSeasonal(){
    const ev = ensureSeasonalState();
    if(!ev || state.seasonal.claimed) return;
    const target = seasonalTarget(ev);
    if((state.seasonal.progress || 0) < target) return;
    state.seasonal.claimed = true;
    if(ev.skinId){
      if(!state.seasonal.skinUnlocked) state.seasonal.skinUnlocked = {};
      state.seasonal.skinUnlocked[ev.skinId] = true;
    }
    if(ev.rewardMiso) state.prestigePoints += ev.rewardMiso;
    const cash = Math.max(totalRatePerSec(), 1) * 60;
    state.cash += cash;
    addEarned(cash);
    save();
    renderAchievements();
    renderStats();
    checkCollectionNotif();
  }
  function renderSeasonalSection(){
    const ev = ensureSeasonalState();
    if(!ev) return '';
    const target = seasonalTarget(ev);
    const progress = state.seasonal.progress || 0;
    const pct = Math.min(100, Math.round((progress / target) * 100));
    const claimed = !!state.seasonal.claimed;
    const ready = progress >= target;
    const days = seasonalDaysLeft(ev);
    const typeLabel = {taps:'Tap the bowl', earn:'Earn cash', buy:'Buy shop levels / upgrades'}[ev.challengeType] || 'Progress';
    const fmtVal = ev.challengeType === 'earn' ? fmt : Math.round;
    return `<div class="chal-section-label">Seasonal Event</div>
      <div class="seasonal-card">
        <div class="seasonal-head">
          <span class="seasonal-icon">${ev.icon}</span>
          <div>
            <div class="seasonal-name">${ev.name}</div>
            <div class="seasonal-blurb">${ev.blurb}</div>
            <div class="seasonal-countdown">${days === 0 ? 'Ends today!' : days + ' day' + (days===1?'':'s') + ' left'}</div>
          </div>
        </div>
        <div class="ach-desc" style="margin-top:8px;">${typeLabel}: ${fmtVal(progress)} / ${fmtVal(target)}</div>
        <div class="chal-progress"><div class="chal-progress-fill" style="width:${pct}%"></div></div>
        <div class="ach-reward" style="margin-top:6px;">Reward: ${ev.skinId ? '🎁 Seasonal skin + ' : ''}${ev.rewardMiso || 0} Miso + cash</div>
        <button class="claim-btn${claimed?' done':''}" data-action="claim-seasonal" style="margin-top:10px; width:100%;" ${claimed||!ready?'disabled':''}>${claimed?'✓ Claimed':(ready?'Claim Reward':'In Progress')}</button>
      </div>`;
  }
  function renderSeasonalBanner(){
    const banner = document.getElementById('seasonalBanner');
    if(!banner) return;
    const ev = ensureSeasonalState();
    if(!ev){
      banner.classList.remove('show');
      return;
    }
    banner.classList.add('show');
    document.getElementById('seasonalBannerIcon').textContent = ev.icon;
    document.getElementById('seasonalBannerText').textContent = ev.name;
    document.getElementById('seasonalBannerTime').textContent = seasonalDaysLeft(ev) + 'd left';
  }

  function renderAchievements(){
    const panel = document.getElementById('achPanel');
    panel.innerHTML = renderSeasonalSection() +
      '<div class="chal-section-label"' + (getActiveSeasonalEvent() ? ' style="margin-top:14px;"' : '') + '>Challenges</div>' +
      renderChallengeCard('daily', 'Daily') + renderChallengeCard('weekly', 'Weekly') +
      renderStorySection() +
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
    const storyReady = STORY_CHAPTERS.some(ch => {
      if(!isChapterUnlocked(ch)) return false;
      let prior = true;
      for(const q of ch.quests){
        if(!prior) break;
        if(state.storyClaimed[q.id]) continue;
        if(q.cond(state)) return true;
        prior = false;
      }
      return false;
    });
    const seasonalReady = (() => {
      const ev = ensureSeasonalState();
      if(!ev || state.seasonal.claimed) return false;
      return (state.seasonal.progress || 0) >= seasonalTarget(ev);
    })();
    document.getElementById('achDot').classList.toggle('show', anyUnclaimed || challengeReady || storyReady || seasonalReady);
    syncMoreDot();
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

  // ---------- meta upgrades (Umami Shards shop, in the Prestige panel) ----------
  function renderPrestige(){
    document.getElementById('shardBalance').textContent = Math.floor(state.shards);
    const shardsNext = potentialShards();
    const line = document.getElementById('shardPreviewLine');
    line.textContent = shardsNext > 0
      ? `Next Prestige also earns +${shardsNext} 🍥 Umami Shard${shardsNext === 1 ? '' : 's'}`
      : `Earn more before Prestiging to also gain Umami Shards`;
    const list = document.getElementById('metaUpgradesList');
    list.innerHTML = '';
    META_UPGRADES.forEach(def => {
      const lvl = metaLevel(def.id);
      const maxed = lvl >= def.max;
      const cost = metaUpgradeCost(def);
      const canBuy = !maxed && state.shards >= cost;
      const card = document.createElement('div');
      card.className = 'ach-card' + (maxed ? ' claimed' : '');
      card.innerHTML = `
        <div class="ach-icon${lvl > 0 ? ' done' : ''}" aria-hidden="true">${def.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${def.name}</div>
          <div class="ach-desc">${def.desc}</div>
          <div class="ach-reward">Lv ${lvl}${maxed ? ' (MAX)' : ' / ' + def.max}</div>
        </div>
        <button class="claim-btn" data-action="buy-meta" data-id="${def.id}" aria-label="${def.name}: ${maxed ? 'maxed out' : 'costs ' + fmt(cost) + ' Umami Shards'}" ${maxed || !canBuy ? 'disabled' : ''}>${maxed ? '✓ Max' : fmt(cost) + ' 🍥'}</button>
      `;
      list.appendChild(card);
    });
  }
  function buyMetaUpgrade(id){
    const def = META_UPGRADES.find(m => m.id === id);
    if(!def) return;
    const lvl = metaLevel(id);
    if(lvl >= def.max) return;
    const cost = metaUpgradeCost(def);
    if(state.shards < cost) return;
    state.shards -= cost;
    state.metaUpgrades[id] = lvl + 1;
    renderPrestige(); renderStats(); refreshBusinessAffordability();
  }
  document.getElementById('prestigePanel').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="buy-meta"]');
    if(btn) buyMetaUpgrade(btn.dataset.id);
  });

  // ---------- collection (cosmetic bowl skins) ----------
  // Purely visual — see COSMETICS above. Unlock state is derived entirely
  // from state.milestoneIdx (never stored separately), so it can't drift out
  // of sync with the milestone popups that grant it.
  function activeCosmetic(){ return COSMETICS.find(c => c.id === state.equippedSkin) || COSMETICS[0]; }
  function isCosmeticUnlocked(c){
    if(c.seasonal) return !!(state.seasonal && state.seasonal.skinUnlocked && state.seasonal.skinUnlocked[c.id]);
    return c.milestoneReq < 0 || state.milestoneIdx >= c.milestoneReq;
  }
  function applyCosmeticTheme(){
    const bowl = document.getElementById('bowlEl');
    if(!bowl) return;
    const c = activeCosmetic();
    bowl.className = bowl.className.split(' ').filter(cls => !cls.startsWith('theme-')).join(' ').trim();
    if(c.theme !== 'classic') bowl.classList.add('theme-' + c.theme);
    bowl.textContent = c.icon;
  }
  function equipSkin(id){
    const c = COSMETICS.find(c => c.id === id);
    if(!c || !isCosmeticUnlocked(c)) return;
    state.equippedSkin = id;
    applyCosmeticTheme();
    renderCollection();
  }
  function renderCollection(){
    const panel = document.getElementById('collectionPanel');
    const unlockedCount = COSMETICS.filter(isCosmeticUnlocked).length;
    panel.innerHTML = `<div class="chal-section-label">Bowl Skins — ${unlockedCount}/${COSMETICS.length} collected</div>`;
    COSMETICS.forEach(c => {
      const unlocked = isCosmeticUnlocked(c);
      const equipped = state.equippedSkin === c.id;
      const card = document.createElement('div');
      card.className = 'ach-card' + (!unlocked ? ' claimed' : '');
      const desc = unlocked ? c.desc : `Unlocks at ${fmt(MILESTONES[c.milestoneReq])} total earned`;
      card.innerHTML = `
        <div class="ach-icon${unlocked ? ' done' : ''}" aria-hidden="true">${unlocked ? c.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${c.name}</div>
          <div class="ach-desc">${desc}</div>
        </div>
        <button class="claim-btn${equipped ? ' done' : ''}" data-action="equip" data-id="${c.id}" aria-label="${c.name}: ${equipped ? 'currently equipped' : (unlocked ? 'equip' : 'locked')}" ${!unlocked || equipped ? 'disabled' : ''}>${equipped ? '✓ Equipped' : (unlocked ? 'Equip' : 'Locked')}</button>
      `;
      panel.appendChild(card);
    });
  }
  document.getElementById('collectionPanel').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="equip"]');
    if(btn) equipSkin(btn.dataset.id);
  });
  // Small nav-dot nudge when a skin has newly unlocked but isn't equipped yet
  // — checked on the same cadence as achievements/milestones.
  function checkCollectionNotif(){
    const anyNew = COSMETICS.some(c => c.id !== 'classic' && isCosmeticUnlocked(c) && state.equippedSkin !== c.id);
    document.getElementById('collectionDot').classList.toggle('show', anyNew);
    syncMoreDot();
  }

  function renderStats(){
    document.getElementById('cashDisplay').textContent = fmt(state.cash);
    document.getElementById('rateDisplay').textContent = fmt(totalRatePerSec()) + '/s';
    document.getElementById('prestigeDisplay').textContent = Math.floor(state.prestigePoints);
    const multEl = document.getElementById('multiplierDisplay');
    if(multEl) multEl.textContent = 'x' + globalMultiplier().toFixed(2);
    const potential = potentialPrestigePoints();
    const prev = document.getElementById('prestigePreview');
    if(prev) prev.textContent = '+' + potential;
    const pBtn = document.getElementById('prestigeBtn');
    if(pBtn) pBtn.disabled = potential <= 0;
    // Reputation header meter
    const rep = Math.max(0, Math.min(100, state.reputation || 0));
    const repFill = document.getElementById('repFill');
    const repValue = document.getElementById('repValue');
    if(repFill) repFill.style.width = rep + '%';
    if(repValue) repValue.textContent = Math.round(rep);
    // Active recipe chip in header
    const recipeChip = document.getElementById('recipeChip');
    if(recipeChip){
      if(state.activeRecipe && state.activeRecipe.endsAt > Date.now()){
        const def = RECIPES.find(r => r.id === state.activeRecipe.id);
        const remain = Math.ceil((state.activeRecipe.endsAt - Date.now()) / 1000);
        recipeChip.style.display = 'flex';
        recipeChip.textContent = `${def ? def.icon : '🍜'} ${remain}s`;
      } else {
        recipeChip.style.display = 'none';
      }
    }
    renderNextUnlock();
  }

  // ---------- "next unlock" progress bar ----------
  // Always points at whatever's closest, in priority order: a business in the
  // active country that's gated behind leveling up an earlier one, then a
  // business that's unlocked but not yet bought, then the next country. Keeps
  // there being "always something close" regardless of where the player is.
  function nextUnlockTarget(){
    const country = activeCountryDef();
    const bizState = state.countries[country.id];
    for(let i = 1; i < country.businesses.length; i++){
      const def = country.businesses[i];
      const prevDef = country.businesses[i-1];
      const b = bizState[def.id];
      if(def.unlockAt > 0 && b.level === 0 && bizState[prevDef.id].level < def.unlockAt){
        return {
          icon: def.icon, name: def.name,
          detail: `Level up ${prevDef.name} to Lv ${def.unlockAt}`,
          progress: bizState[prevDef.id].level / def.unlockAt
        };
      }
    }
    for(const def of country.businesses){
      const b = bizState[def.id];
      if(b.level === 0){
        const cost = businessCost(def, 0);
        return { icon: def.icon, name: def.name, detail: `Save up ${fmt(cost)}`, progress: state.cash / cost };
      }
    }
    const nextCountry = COUNTRIES.find(c => !isUnlocked(c.id));
    if(nextCountry){
      return {
        icon: nextCountry.icon, name: nextCountry.name,
        detail: `Unlock for ${fmt(nextCountry.unlockCost)}`, progress: state.cash / nextCountry.unlockCost
      };
    }
    return null;
  }
  function renderNextUnlock(){
    const bar = document.getElementById('nextUnlockBar');
    const target = nextUnlockTarget();
    if(!target){ bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    const pct = Math.max(0, Math.min(100, target.progress * 100));
    document.getElementById('nuIcon').textContent = target.icon;
    document.getElementById('nuLabel').textContent = `Next: ${target.name}`;
    document.getElementById('nuDetail').textContent = target.detail;
    document.getElementById('nuFill').style.width = pct + '%';
    document.getElementById('nuPct').textContent = Math.floor(pct) + '%';
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
    const dropped = tryDropIngredient(country.id);
    if(dropped){
      // Brief toast via floating gain style
      const el = document.createElement('div');
      el.className = 'float-gain';
      el.textContent = `+${dropped.icon}`;
      el.style.left = '50%';
      const zone = document.getElementById('tapZone');
      if(zone){ zone.appendChild(el); setTimeout(() => el.remove(), CONFIG.FLOAT_GAIN_LIFETIME_MS); }
    }
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
    b.managerLevel = 1;
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function trainManager(id){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    if(!b.manager) return;
    const lvl = b.managerLevel || 1;
    if(lvl >= CONFIG.MANAGER_MAX_LEVEL) return;
    const cost = managerTrainCost(def, lvl);
    if(state.cash < cost) return;
    state.cash -= cost;
    b.managerLevel = lvl + 1;
    addChallengeProgress('buy', 1);
    renderBusinesses(); renderStats(); checkAchievements();
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
    const shardsGained = potentialShards();
    state.prestigePoints += potential;
    state.shards += shardsGained;
    state.prestigeCount++;
    state.cash = 0;
    state.totalEarned = 0;
    // Retiring resets every country's shops — unlocked countries stay
    // unlocked, only their business levels/upgrades/managers reset.
    // Umami Shards and metaUpgrades are untouched: that's the whole point of
    // the second currency, a grind that survives every retirement.
    // Reputation, ingredients, and craft counters also persist — kitchen
    // mastery is a long-term layer alongside shards.
    COUNTRIES.forEach(c => state.countries[c.id] = initCountryState(c));
    state.activeRecipe = null;
    activeOrder = null;
    renderOrderCard();
    save();
    renderBusinesses(); renderWorld(); renderStats(); checkAchievements();
    if(document.getElementById('prestigePanel').classList.contains('active')) renderPrestige();
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
    syncMoreDot();
    if(document.getElementById('achPanel').classList.contains('active')) renderAchievements();
  }

  // ---------- cash milestones (confetti + chime popup) ----------
  // Separate from ACHIEVEMENTS: fires automatically the moment a threshold is
  // crossed, no claim button, just a quick celebratory hit plus a small cash
  // bonus. Queued so a big offline/challenge payout that jumps several
  // thresholds at once still shows them one at a time instead of stacking.
  let milestoneQueue = [];
  let milestoneModalOpen = false;
  function checkMilestones(){
    while(state.milestoneIdx + 1 < MILESTONES.length && state.totalEarned >= MILESTONES[state.milestoneIdx + 1]){
      state.milestoneIdx++;
      const bonus = totalRatePerSec() * CONFIG.MILESTONE_BONUS_SECONDS;
      state.cash += bonus;
      addEarned(bonus);
      milestoneQueue.push({ threshold: MILESTONES[state.milestoneIdx], bonus });
    }
    maybeShowNextMilestone();
  }
  function maybeShowNextMilestone(){
    if(milestoneModalOpen || milestoneQueue.length === 0) return;
    const m = milestoneQueue.shift();
    milestoneModalOpen = true;
    document.getElementById('milestoneModalText').textContent = `Total earnings passed ${fmt(m.threshold)}!`;
    document.getElementById('milestoneBonus').textContent = m.bonus > 0 ? '+' + fmt(m.bonus) + ' bonus' : '';
    openModal(document.getElementById('milestoneModal'));
    fireConfetti();
    playMilestoneChime();
    renderStats();
  }
  function closeMilestoneModal(){
    closeModal(document.getElementById('milestoneModal'));
    milestoneModalOpen = false;
    checkCollectionNotif();
    setTimeout(maybeShowNextMilestone, 250); // let the close animation settle before stacking the next one
  }
  document.getElementById('milestoneModalClose').addEventListener('click', closeMilestoneModal);
  document.getElementById('milestoneModal').addEventListener('modal-dismiss', closeMilestoneModal);
  document.getElementById('milestoneModal').addEventListener('click', e => {
    if(e.target === e.currentTarget) e.currentTarget.dispatchEvent(new CustomEvent('modal-dismiss'));
  });

  function fireConfetti(){
    const layer = document.getElementById('confettiLayer');
    const colors = ['#d4a017', '#c1272d', '#4a7856', '#6a9e77', '#f5ede0', '#7a4fb0'];
    for(let i = 0; i < 36; i++){
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 0.3) + 's';
      piece.style.animationDuration = (1.6 + Math.random() * 0.9) + 's';
      piece.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }
  // Synthesizes a quick ascending chime with the Web Audio API rather than
  // shipping an audio asset — keeps the milestone reward feeling instant
  // without adding anything for the service worker to cache/fetch.
  let milestoneAudioCtx = null;
  function playMilestoneChime(){
    try{
      milestoneAudioCtx = milestoneAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = milestoneAudioCtx;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const t0 = now + i * 0.09;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.4);
      });
    }catch(e){ /* Web Audio unavailable/blocked — milestone popup still shows visually */ }
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
    else if(action === 'train') trainManager(id);
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
    const storyBtn = e.target.closest('[data-action="claim-story"]');
    if(storyBtn){ claimStoryQuest(storyBtn.dataset.id); return; }
    const seasBtn = e.target.closest('[data-action="claim-seasonal"]');
    if(seasBtn){ claimSeasonal(); return; }
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

  // ---- tap effects toggle ----
  const tapFxBtn = document.getElementById('tapFxBtn');
  function renderTapFxBtn(){ tapFxBtn.textContent = state.tapFxEnabled ? 'On' : 'Off'; }
  tapFxBtn.addEventListener('click', () => {
    state.tapFxEnabled = !state.tapFxEnabled;
    renderTapFxBtn();
    save();
  });
  renderTapFxBtn();

  // ---- log in (upgrade a Guest profile to Google) ----
  // Reuses the same signInWithPopup + profile-step flow as first-run
  // onboarding, but pre-fills the existing name/age so it reads as an
  // upgrade rather than a fresh signup. Local progress is untouched either
  // way — this only changes state.profile.provider and starts submitting
  // scores to the leaderboard under the new Google identity going forward.
  document.getElementById('loginGoogleBtn').addEventListener('click', () => {
    if(state.profile.provider === 'google'){
      alert("You're already signed in with Google.");
      return;
    }
    auth.signInWithPopup(googleProvider).then(result => {
      const user = result.user;
      pendingProvider = 'google';
      authError.style.display = 'none';
      authStepProvider.style.display = 'none';
      authStepProfile.style.display = 'block';
      authCancelBtn.style.display = 'block';
      authNameInput.value = (state.profile.name || user.displayName || '').slice(0, 24);
      authAgeInput.value = state.profile.age || '';
      openModal(authOverlay);
      authAgeInput.focus();
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
    auth.signOut().then(() => {
      state.profile.provider = 'guest';
      save();
      renderProfileSettings();
      alert('Logged out. Your local progress is unchanged.');
    }).catch(err => {
      console.warn('Sign out failed', err);
      alert('Log out failed — check your connection and try again.');
    });
  });

  // ---------- leaderboard ----------
  // Only signed-in Google players get a leaderboard entry — guests have no
  // Firebase auth session, so firebaseUser stays null for them and
  // submitScore()/renderLeaderboard() below simply skip writing for them.
  let firebaseUser = null;
  // cached uids this player follows; refreshed each time the Friends tab
  // opens. Declared here (rather than down by loadFriends()) because
  // onAuthStateChanged below can in principle fire before that later
  // declaration is reached, which would otherwise throw a "Cannot access
  // 'myFriends' before initialization" error.
  let myFriends = [];
  auth.onAuthStateChanged(user => {
    firebaseUser = user;
    myFriends = []; // stale for a new session/account — reloaded on next Friends tab open
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
    const now = Date.now();
    if(now - lastLeaderboardSubmit < 30000) return; // avoid excessive writes
    lastLeaderboardSubmit = now;
    db.collection('leaderboard').doc(firebaseUser.uid).set({
      name: state.profile.name || firebaseUser.displayName || 'Anonymous',
      code: myFriendCode(),
      cash: state.cash,
      totalEarned: state.totalEarned,
      weeklyEarned: state.weeklyEarned || 0,
      weekId: state.weekId,
      seasonWins: state.seasonWins || 0,
      prestigePoints: state.prestigePoints,
      prestigeCount: state.prestigeCount,
      guildId: state.guildId || null,
      guildName: state.guildName || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.warn('Leaderboard submit failed', err));
    // Push this week's earnings into the guild shared total (best-effort)
    if(state.guildId){
      contributeToGuild(state.weeklyEarned || 0);
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
  let lastGuildContribValue = 0;

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
    // Throttle and only push the delta since last contribution write
    if(now - lastGuildContribute < 60000) return;
    const delta = Math.max(0, (weeklyEarned || 0) - lastGuildContribValue);
    if(delta < 1) return;
    lastGuildContribute = now;
    lastGuildContribValue = weeklyEarned || 0;
    const ref = db.collection('guilds').doc(state.guildId);
    const wid = currentWeekId();
    ref.get().then(doc => {
      if(!doc.exists) return;
      const data = doc.data();
      if(data.weekId !== wid){
        // New week — reset shared counter
        return ref.update({ weekId: wid, weeklyContrib: delta });
      }
      return ref.update({
        weeklyContrib: firebase.firestore.FieldValue.increment(delta)
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

  // ---- gifting ----
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
  function sendGift(toUid, toName){
    if(!firebaseUser) return Promise.reject(new Error('Not signed in'));
    if(toUid === firebaseUser.uid) return Promise.reject(new Error('Cannot gift yourself'));
    resetGiftDayIfNeeded();
    if(state.gifts.giftedToday[toUid]) return Promise.reject(new Error('Already gifted today'));
    const amount = giftAmount();
    const today = todayKey();
    const giftId = firebaseUser.uid + '_' + today;
    return db.collection('gifts').doc(toUid).collection('inbox').doc(giftId).set({
      fromUid: firebaseUser.uid,
      fromName: state.profile.name || firebaseUser.displayName || 'Anonymous',
      amount,
      boost: 0.05, // +5% income for 10 minutes when claimed
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      dateKey: today
    }).then(() => {
      state.gifts.giftedToday[toUid] = true;
      save();
      return { amount, toName };
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
        state.cash += data.amount || 0;
        addEarned(data.amount || 0);
        if(data.boost){
          // Short income boost via activeRecipe-like temporary state
          applyGiftBoost(data.boost);
        }
        state.gifts.pendingClaimed[doc.id] = true;
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
      if(opts.showGift && firebaseUser && d.__id !== firebaseUser.uid){
        const can = canGiftFriend(d.__id);
        giftBtn = `<button class="gift-btn" data-action="gift" data-uid="${d.__id}" data-name="${escapeHtml(d.name || 'player')}" ${can ? '' : 'disabled'} title="${can ? 'Send a daily gift' : 'Already gifted today'}">🎁</button>`;
      }
      const gTag = d.guildName ? ` <span class="lb-guild-tag">${escapeHtml(d.guildName)}</span>` : '';
      return `<div class="lb-row${isMe ? ' me' : ''}"><span class="lb-rank">#${i + 1}</span><span class="lb-name">${escapeHtml(d.name || 'Anonymous')}${trophy}${gTag}</span>${giftBtn}<span class="lb-cash">¥${fmt(d[cashField] || 0)}</span></div>`;
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
        if(status) status.textContent = `Sent ${fmt(res.amount)} to ${name}!`;
        giftBtn.title = 'Already gifted today';
      }).catch(err => {
        giftBtn.disabled = false;
        const status = document.getElementById('addFriendStatus');
        if(status) status.textContent = err.message || 'Gift failed.';
      });
    }
  });
  document.getElementById('guildNameInput') && document.getElementById('guildNameInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') createGuild(e.target.value);
  });
  document.getElementById('guildCodeInput') && document.getElementById('guildCodeInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') joinGuildByCode(e.target.value);
  });

  // ---------- tap to earn ----------
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
  // asset — same reasoning as playMilestoneChime() above. The buffer is built
  // once and reused; only a cheap BufferSource is created per tap.
  let tapAudioCtx = null;
  let tapNoiseBuffer = null;
  function ensureTapAudio(){
    if(tapAudioCtx) return;
    try{
      tapAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const rate = tapAudioCtx.sampleRate;
      const duration = 0.05;
      tapNoiseBuffer = tapAudioCtx.createBuffer(1, Math.floor(rate * duration), rate);
      const data = tapNoiseBuffer.getChannelData(0);
      for(let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }catch(e){ /* Web Audio unavailable/blocked — shake/particles/haptic still fire */ }
  }
  function playTapPop(){
    ensureTapAudio();
    if(!tapAudioCtx || !tapNoiseBuffer) return;
    try{
      const src = tapAudioCtx.createBufferSource();
      src.buffer = tapNoiseBuffer;
      const filter = tapAudioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900 + Math.random() * 300; // slight variation so rapid taps don't sound identical
      const gain = tapAudioCtx.createGain();
      gain.gain.value = 0.22;
      src.connect(filter).connect(gain).connect(tapAudioCtx.destination);
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
      state.cash += gain;
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
    if(panelId === 'kitchenPanel') renderKitchen();
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
  // Kitchen craft buttons (delegated — panel is rebuilt on each open)
  document.getElementById('kitchenPanel').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="craft"]');
    if(btn) craftRecipe(btn.dataset.id);
  });
  // Order card fulfill button
  const fulfillBtn = document.getElementById('orderFulfillBtn');
  if(fulfillBtn) fulfillBtn.addEventListener('click', fulfillOrder);

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
    pendingOfflineGain = rate * elapsedSec * CONFIG.OFFLINE_EARN_MULT * (1 + metaBonus('offline') + totalManagerOfflineBoost());
    if(pendingOfflineGain < CONFIG.OFFLINE_MIN_GAIN) return false;
    document.getElementById('offlineText').textContent =
      `While you were away for ${Math.round(elapsedSec/60)} min, your shops earned ${fmt(pendingOfflineGain)}.`;
    openModal(document.getElementById('offlineModal'));
    return true;
  }
  function collectOffline(multiplier){
    const amount = pendingOfflineGain * multiplier;
    state.cash += amount;
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
    const gain = totalRatePerSec() * dt;
    if(gain > 0){
      state.cash += gain;
      addEarned(gain);
      addChallengeProgress('earn', gain);
    }
    tickReputation(dt);
    maybeTriggerEvent();
    tickEvent();
    maybeTriggerOrder();
    tickOrder();
    tickRecipe();
    if(now - lastStatsRender >= CONFIG.STATS_RENDER_INTERVAL_MS){
      renderStats();
      lastStatsRender = now;
    }
    requestAnimationFrame(tick);
  }

  setInterval(() => { refreshBusinessAffordability(); checkAchievements(); checkMilestones(); checkCollectionNotif(); ensureChallenges(); ensureWeeklyPeriod(); }, CONFIG.AFFORDABILITY_REFRESH_MS);
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
    checkCollectionNotif();
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
