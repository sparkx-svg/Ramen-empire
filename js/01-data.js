/**
 * Ramen Empire — 01 Data
 * Static data: countries, CONFIG, recipes, cosmetics, achievements, etc.
 *
 * This file is part of the split source. Run `node build-script.js` (or npm run build:script)
 * to concatenate js/*.js back into script.js for deployment.
 */
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
        {id:'cart',   name:'Street Cart',       icon:'🛒', baseCost:15,      baseIncome:0.25,  unlockAt:0},
        {id:'stall',  name:'Noodle Stall',      icon:'🏮', baseCost:180,     baseIncome:1.5,   unlockAt:0},
        {id:'shop',   name:'Corner Shop',       icon:'🏠', baseCost:2500,    baseIncome:10,    unlockAt:0},
        {id:'diner',  name:'Family Diner',      icon:'🍽️', baseCost:45000,   baseIncome:55,    unlockAt:8},
        {id:'chain',  name:'City Chain',        icon:'🏢', baseCost:8e5,     baseIncome:320,   unlockAt:12},
        {id:'factory',name:'Broth Factory',     icon:'🏭', baseCost:2e7,     baseIncome:1800,  unlockAt:18},
        {id:'mall',   name:'Mall Franchise',    icon:'🏬', baseCost:8e8,     baseIncome:12000, unlockAt:25},
        {id:'global', name:'Global Empire HQ',  icon:'🌆', baseCost:5e11,    baseIncome:80000, unlockAt:35},
      ]
    },
    {
      id:'italy', name:'Italy', icon:'🇮🇹', tagline:'Pasta, pizza & espresso', unlockCost:5e6,
      businesses:[
        {id:'cart',   name:'Panini Cart',        icon:'🥖', baseCost:15,      baseIncome:0.25,  unlockAt:0},
        {id:'stall',  name:'Pizza Stall',        icon:'🍕', baseCost:180,     baseIncome:1.5,   unlockAt:0},
        {id:'shop',   name:'Trattoria',          icon:'🍝', baseCost:2500,    baseIncome:10,    unlockAt:0},
        {id:'diner',  name:'Family Ristorante',  icon:'🍷', baseCost:45000,   baseIncome:55,    unlockAt:8},
        {id:'chain',  name:'City Pizzeria Chain',icon:'🏢', baseCost:8e5,     baseIncome:320,   unlockAt:12},
        {id:'factory',name:'Pasta Factory',      icon:'🏭', baseCost:2e7,     baseIncome:1800,  unlockAt:18},
        {id:'mall',   name:'Piazza Franchise',   icon:'🏬', baseCost:8e8,     baseIncome:12000, unlockAt:25},
        {id:'global', name:'Roman Empire HQ',    icon:'🏛️', baseCost:5e11,    baseIncome:80000, unlockAt:35},
      ]
    },
    {
      id:'mexico', name:'Mexico', icon:'🇲🇽', tagline:'Tacos, salsa & fire', unlockCost:2e12,
      businesses:[
        {id:'cart',   name:'Taco Cart',         icon:'🌮', baseCost:15,      baseIncome:0.25,  unlockAt:0},
        {id:'stall',  name:'Salsa Stall',       icon:'🌶️', baseCost:180,     baseIncome:1.5,   unlockAt:0},
        {id:'shop',   name:'Taqueria',          icon:'🫔', baseCost:2500,    baseIncome:10,    unlockAt:0},
        {id:'diner',  name:'Family Cantina',    icon:'🍹', baseCost:45000,   baseIncome:55,    unlockAt:8},
        {id:'chain',  name:'City Taco Chain',   icon:'🏢', baseCost:8e5,     baseIncome:320,   unlockAt:12},
        {id:'factory',name:'Tortilla Factory',  icon:'🏭', baseCost:2e7,     baseIncome:1800,  unlockAt:18},
        {id:'mall',   name:'Mercado Franchise', icon:'🏬', baseCost:8e8,     baseIncome:12000, unlockAt:25},
        {id:'global', name:'Aztec Empire HQ',   icon:'🌆', baseCost:5e11,    baseIncome:80000, unlockAt:35},
      ]
    },
    {
      id:'india', name:'India', icon:'🇮🇳', tagline:'Curry, spice & chai', unlockCost:1e18,
      businesses:[
        {id:'cart',   name:'Chai Cart',         icon:'🍵', baseCost:15,      baseIncome:0.25,  unlockAt:0},
        {id:'stall',  name:'Samosa Stall',      icon:'🥟', baseCost:180,     baseIncome:1.5,   unlockAt:0},
        {id:'shop',   name:'Curry House',       icon:'🍛', baseCost:2500,    baseIncome:10,    unlockAt:0},
        {id:'diner',  name:'Family Dhaba',      icon:'🫓', baseCost:45000,   baseIncome:55,    unlockAt:8},
        {id:'chain',  name:'City Curry Chain',  icon:'🏢', baseCost:8e5,     baseIncome:320,   unlockAt:12},
        {id:'factory',name:'Spice Factory',     icon:'🏭', baseCost:2e7,     baseIncome:1800,  unlockAt:18},
        {id:'mall',   name:'Bazaar Franchise',  icon:'🏬', baseCost:8e8,     baseIncome:12000, unlockAt:25},
        {id:'global', name:'Mughal Empire HQ',  icon:'🕌', baseCost:5e11,    baseIncome:80000, unlockAt:35},
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
    // Tuned for ~1 month of regular play to finish a full world tour + HQ max.
    // Costs grow faster than income; prestige and diamonds are the long levers.
    COST_GROWTH: 1.32,              // cost multiplier per business level (was 1.19)
    MANAGER_COST_MULT: 220,         // manager costs this many times base cost (was 130)
    MANAGER_UNLOCK_LEVEL: 8,        // business must reach this level before a manager can be hired
    MANAGER_INCOME_MULT: 1.35,      // +35% income once a manager is hired (was 1.5)
    LEVEL_INCOME_SCALING: 0.0025,   // tiny extra income per level (was 0.006)

    // Prestige
    PRESTIGE_BONUS_PER_POINT: 0.008, // each Miso Point adds 0.8% global income (was 1.5%)
    PRESTIGE_EARNINGS_DIVISOR: 5e8, // harder prestige points (was 8e6)
    SHARDS_PER_PRESTIGE_POINT: 12,  // fewer Umami Shards per prestige

    // Tapping
    TAP_SCALING_FACTOR: 0.0000008,  // taps matter less late-game (was 0.000004)

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
    OFFLINE_MAX_HOURS: 6,           // cap how much offline time counts toward the reward
    OFFLINE_EARN_MULT: 0.3,         // offline earnings accrue at 30% of the live rate
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

