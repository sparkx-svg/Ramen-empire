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

    // GDD Part 6 — Economy
    MENU_PRICE_MIN: 0.6,
    MENU_PRICE_MAX: 1.8,
    MENU_PRICE_DEFAULT: 1.0,
    MENU_PRICE_STEP: 0.1,
    WHEEL_FREE_SPINS_PER_DAY: 1,
    WHEEL_EXTRA_SPIN_DIAMOND_COST: 8,

    // GDD Part 7 — Progression
    FAME_START: 0,
    FAME_MAX: 1000,
    FAME_PER_ORDER: 0.4,
    FAME_PER_VIP: 3,
    FAME_PER_CELEB: 12,
    FAME_PER_REVIEW: 1.5,
    FAME_PER_MICHELIN: 40,
    FAME_PER_COUNTRY: 25,
    FAME_INCOME_PER_100: 0.03,
    FAME_VIP_BONUS: 0.0004,
    EMPIRE_LEVEL_INCOME_PER: 0.015,
    CITY_UNLOCK_REP: { italy: 55, mexico: 65, india: 75 },
    CITY_UNLOCK_RATING: { italy: 35, mexico: 50, india: 65 },
    CITY_UNLOCK_SHOP_LEVELS: { italy: 8, mexico: 20, india: 40 },

    // GDD Part 8 — Events
    EVENT_TOKEN_PER_ORDER: 0.15,
    EVENT_TOKEN_PER_CHALLENGE: 5,
    EVENT_TOKEN_SEASONAL_CLAIM: 12,
    CHAMPIONSHIP_DURATION_MS: 90 * 1000,
    CHAMPIONSHIP_COOLDOWN_MS: 30 * 60 * 1000,

    // Customer orders (active-play requests near the bowl)
    ORDER_CHECK_INTERVAL_MS: 20000,
    ORDER_TRIGGER_CHANCE: 0.32,
    ORDER_DURATION_MS: 18000,      // base patience; overridden per customer type
    ORDER_REWARD_SECONDS: 12,      // bonus cash ≈ this many seconds of current income
    ORDER_REWARD_TAP_MULT: 1.35,   // also scales with nextTapGain() a bit
    // GDD Part 5 — Customer System
    SATISFACTION_START: 70,        // 0–100 customer satisfaction score
    SATISFACTION_MIN: 0,
    SATISFACTION_MAX: 100,
    SATISFACTION_FULFILL: 2.5,     // base gain on successful serve
    SATISFACTION_MISS: 4,          // base loss on walk-away
    LOYALTY_PER_FULFILL: 1,        // loyalty points per normal serve
    LOYALTY_VIP_BONUS: 3,
    LOYALTY_CELEB_BONUS: 8,
    LOYALTY_TIER_SIZE: 25,         // every N points = 1 loyalty tier (+1% order rewards)
    LOYALTY_REWARD_PER_TIER: 0.01, // +1% order cash per loyalty tier
    VIP_SPAWN_CHANCE: 0.06,        // extra roll for VIP when rep ≥ 60
    CELEBRITY_SPAWN_CHANCE: 0.015, // rare celebrity when rating ≥ 70
    TOURIST_REP_BONUS: 0.12,       // extra tourist weight at high reputation
    REVIEW_CHANCE: 0.22,           // chance to leave a review after fulfill
    PATIENCE_QUEUE_BONUS: 0.08,    // +8% patience time per total queue upgrade level
    PATIENCE_STAFF_BONUS: 0.04,    // +4% per hired service staff
    PATIENCE_CLEAN_BONUS: 0.15,    // up to +15% from high cleanliness
    PATIENCE_MAX_MULT: 2.2,        // hard cap on patience extension

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
    SEASONAL_CHALLENGE_SCALE: 2.5,  // seasonal challenges are harder / richer than daily

    // ---- GDD systems (Cooking Stations / Research / Chefs / Michelin) ----
    STATION_BASE_COST: 500,
    STATION_COST_GROWTH: 1.55,
    STATION_MAX_LEVEL: 25,
    STATION_INCOME_BOOST: 0.04,      // +4% global income per total station level
    STATION_SPEED_BOOST: 0.02,

    // ---- GDD Part 3: Recipes & Ingredients ----
    RECIPE_MASTERY_PER_CRAFT: 1,
    RECIPE_MASTERY_THRESHOLDS: [0, 5, 15, 40, 100], // Beginner→Skilled→Expert→Master→Legendary
    RECIPE_MASTERY_INCOME: [0, 0.02, 0.05, 0.10, 0.18], // permanent income bonus per mastery tier
    RECIPE_UPGRADE_MAX: 10,
    RECIPE_UPGRADE_COST_BASE: 3,     // ingredient units spent to upgrade a recipe stat
    STORAGE_BASE: 50,                // base ingredient stack capacity
    STORAGE_PER_LEVEL: 25,
    STORAGE_MAX_LEVEL: 20,
    STORAGE_UPGRADE_COST: 5000,
    STORAGE_COST_GROWTH: 1.55,
    SUPPLIER_ORDER_COOLDOWN_MS: 60000,
    INGREDIENT_QUALITY_CHANCE: 0.15, // chance a drop is upgraded quality

    // ---- GDD Part 4: Staff system ----
    STAFF_MAX_LEVEL: 20,
    STAFF_XP_PER_MINUTE: 1,
    STAFF_HAPPINESS_DECAY_PER_MIN: 0.4,
    STAFF_BURNOUT_THRESHOLD: 25,
    STAFF_SALARY_RATE: 0.008,
    STAFF_TRAIN_COST_BASE: 2000,
    STAFF_TRAIN_COST_GROWTH: 1.45,
    STAFF_EQUIP_COST_BASE: 5000,
    STAFF_EQUIP_COST_GROWTH: 1.60,
    STAFF_EQUIP_MAX: 5,
    AUTOMATION_BASE_COST: 1e6,
    AUTOMATION_COST_GROWTH: 2.2,
    AUTOMATION_MAX_LEVEL: 10,
    AUTOMATION_INCOME_BOOST: 0.04,
    BREAK_ROOM_COST: 25000,
    REWARD_STAFF_COST_MULT: 30,

    RESEARCH_POINT_PER_PRESTIGE: 3,
    RESEARCH_POINT_PER_MILESTONE: 1,
    RESEARCH_MAX_LEVEL: 15,
    CHEF_SKILL_DURATION_MS: 30000,
    CHEF_SKILL_COOLDOWN_MS: 180000,
    MICHELIN_REP_REQ: 90,
    MICHELIN_MAX_STARS: 3,
    MICHELIN_INCOME_PER_STAR: 0.08,
    MICHELIN_CHALLENGE_CASH_MULT: 500,

    // ---- GDD Part 2: Restaurant systems ----
    LAYOUT_BASE_COST: 2000,
    LAYOUT_COST_GROWTH: 1.65,
    LAYOUT_MAX_LEVEL: 20,
    LAYOUT_INCOME_BOOST: 0.03,       // +3% income per total layout level
    QUEUE_BASE_COST: 1500,
    QUEUE_COST_GROWTH: 1.60,
    QUEUE_MAX_LEVEL: 15,
    QUEUE_INCOME_BOOST: 0.035,       // faster turnover → more income
    DELIVERY_BASE_COST: 8000,
    DELIVERY_COST_GROWTH: 1.70,
    DELIVERY_MAX_LEVEL: 12,
    DELIVERY_INCOME_PER_LEVEL: 0.06, // delivery fleet adds passive income share
    CLEANING_BASE_COST: 1000,
    CLEANING_COST_GROWTH: 1.50,
    CLEANING_MAX_LEVEL: 15,
    CLEANLINESS_DECAY_PER_MIN: 0.8,  // cleanliness points lost per minute of play
    CLEANLINESS_REPAIR_COST_MULT: 20,
    TAKEAWAY_UNLOCK_COST: 5e5,
    TAKEAWAY_INCOME_BONUS: 0.12,
    DRIVETHRU_UNLOCK_COST: 5e7,
    DRIVETHRU_INCOME_BONUS: 0.20,
    RATING_INCOME_PER_POINT: 0.008   // +0.8% income per rating point (0–100)
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

  // GDD: Cooking Stations — independent production lines that boost the whole empire
  const COOKING_STATIONS = [
    {id:'noodles',  icon:'🍜', name:'Noodle Station',  desc:'Faster noodle prep · +income'},
    {id:'broth',    icon:'🍲', name:'Broth Station',    desc:'Richer stock · +income'},
    {id:'toppings', icon:'🥢', name:'Toppings Station', desc:'Premium garnishes · +income'},
    {id:'drinks',   icon:'🍵', name:'Drinks Station',   desc:'Tea & soft drinks · +income'},
    {id:'desserts', icon:'🍡', name:'Dessert Station',  desc:'Sweet finishers · +income'},
  ];

  // GDD: Manager types — chosen when hiring per-shop; each gives a different shop bonus
  const MANAGER_TYPES = [
    {id:'head_chef',  icon:'👨‍🍳', name:'Head Chef',       incomeMult:1.50, offlineBoost:0.00, desc:'+50% shop income'},
    {id:'waiter',     icon:'🛎️', name:'Waiter Manager',  incomeMult:1.25, offlineBoost:0.05, desc:'+25% income, +5% offline'},
    {id:'cashier',    icon:'💵', name:'Cashier Manager', incomeMult:1.35, offlineBoost:0.00, desc:'+35% shop income'},
    {id:'delivery',   icon:'🛵', name:'Delivery Manager',incomeMult:1.20, offlineBoost:0.10, desc:'+20% income, +10% offline'},
    {id:'marketing',  icon:'📢', name:'Marketing Manager',incomeMult:1.15, offlineBoost:0.00, luckBoost:0.03, desc:'+15% income, +3% event luck'},
  ];

  // GDD Part 4: Empire-wide staff roles (hired once, level up globally)
  const STAFF_ROLES = [
    {id:'head_chef',   icon:'👨‍🍳', name:'Head Chef',        hireCost:5000,   skill:'cooking',    incomeBoost:0.04, desc:'Leads the kitchen'},
    {id:'asst_chef',   icon:'🔪', name:'Assistant Chef',   hireCost:2500,   skill:'cooking',    incomeBoost:0.02, desc:'Prep & plating'},
    {id:'waiter',      icon:'🛎️', name:'Waiter',           hireCost:1500,   skill:'service',    incomeBoost:0.02, desc:'Table service'},
    {id:'cashier',     icon:'💵', name:'Cashier',          hireCost:1200,   skill:'service',    incomeBoost:0.015,desc:'Handles the till'},
    {id:'cleaner',     icon:'🧹', name:'Cleaner',          hireCost:1000,   skill:'service',    incomeBoost:0.01, desc:'Keeps the floor spotless'},
    {id:'driver',      icon:'🛵', name:'Delivery Driver',  hireCost:3000,   skill:'delivery',   incomeBoost:0.025,desc:'On the road'},
    {id:'marketing',   icon:'📢', name:'Marketing Manager',hireCost:8000,   skill:'management', incomeBoost:0.03, desc:'Brings in crowds'},
    {id:'finance',     icon:'📊', name:'Finance Manager',  hireCost:10000,  skill:'management', incomeBoost:0.03, desc:'Optimizes margins'},
    {id:'hr',          icon:'🤝', name:'HR Manager',       hireCost:7000,   skill:'management', incomeBoost:0.02, desc:'Keeps staff happy'},
  ];

  // Culinary Academy training tracks
  const STAFF_SKILLS = [
    {id:'cooking',     icon:'🍳', name:'Cooking',          desc:'+2% income per skill level'},
    {id:'service',     icon:'😊', name:'Customer Service', desc:'+1.5% income & slower happiness decay'},
    {id:'delivery',    icon:'🚚', name:'Delivery',         desc:'+3% offline earnings per level'},
    {id:'management',  icon:'📋', name:'Management',       desc:'-3% salary cost per level'},
  ];

  // Staff equipment
  const STAFF_EQUIPMENT = [
    {id:'knives',    icon:'🔪', name:'Chef Knives',      desc:'+3% income · cooking staff', skill:'cooking'},
    {id:'uniforms',  icon:'👔', name:'Premium Uniforms', desc:'+2% income · all staff · +happiness'},
    {id:'scooters',  icon:'🛵', name:'Fast Scooters',    desc:'+4% offline · delivery'},
    {id:'tools',     icon:'🛠️', name:'Pro Tools',        desc:'+3% income · all staff'},
  ];

  // GDD: Legendary Chefs — rare unlockable characters with active skills
  const LEGENDARY_CHEFS = [
    {id:'ichiro',   icon:'🥋', name:'Ichiro the Swift',   unlockPrestige:1,  skill:'double_profit', skillLabel:'Double profits 30s', desc:'A Tokyo street legend.'},
    {id:'nonna',    icon:'👵', name:'Nonna Rosa',         unlockPrestige:3,  skill:'instant_cook',  skillLabel:'Instant shop levels burst', desc:'Nonna\'s secret sauce.'},
    {id:'diego',    icon:'🔥', name:'Diego del Fuego',    unlockPrestige:5,  skill:'customer_rush', skillLabel:'Customer rush 30s', desc:'Brings the heat.'},
    {id:'priya',    icon:'✨', name:'Priya of Spices',    unlockPrestige:8,  skill:'rep_boost',     skillLabel:'+15 reputation', desc:'Spice routes mastery.'},
    {id:'emperor',  icon:'👑', name:'The Ramen Emperor',  unlockPrestige:15, skill:'empire_aura',   skillLabel:'+100% income 30s', desc:'The final legend.'},
  ];

  // GDD: Research Tree — permanent upgrades bought with Research Points
  const RESEARCH_BRANCHES = [
    {id:'cooking',    icon:'🍳', name:'Cooking',    desc:'+3% income per level',           boost:0.03, kind:'income'},
    {id:'business',   icon:'📈', name:'Business',   desc:'-2% shop upgrade cost per level', boost:0.02, kind:'cost'},
    {id:'marketing',  icon:'📣', name:'Marketing',  desc:'+4% tap gain per level',          boost:0.04, kind:'tap'},
    {id:'delivery',   icon:'🚚', name:'Delivery',   desc:'+5% offline rate per level',      boost:0.05, kind:'offline'},
    {id:'satisfaction',icon:'😊', name:'Satisfaction', desc:'+2 starting reputation per level', boost:2, kind:'rep'},
  ];

  // GDD Part 2: Restaurant Layout upgrades
  const LAYOUT_UPGRADES = [
    {id:'seating',   icon:'🪑', name:'More Seating',      desc:'Extra tables & chairs · capacity'},
    {id:'kitchen',   icon:'🏠', name:'Bigger Kitchen',    desc:'More prep space · throughput'},
    {id:'vip',       icon:'💎', name:'VIP Dining Area',   desc:'Premium seats · higher spend'},
    {id:'lanes',     icon:'➡️', name:'Serving Lanes',     desc:'Faster service lines · speed'},
    {id:'outdoor',   icon:'🌳', name:'Outdoor Seating',   desc:'Patio tables · capacity'},
  ];

  // GDD Part 2: Queue / service upgrades
  const QUEUE_UPGRADES = [
    {id:'patience',  icon:'⏳', name:'Queue Comfort',     desc:'Seats & menus in line · less walk-away'},
    {id:'express',   icon:'⚡', name:'Express Lane',      desc:'Quick orders · faster turnover'},
    {id:'host',      icon:'🎫', name:'Host Desk',         desc:'Smart seating · less wait'},
    {id:'display',   icon:'📺', name:'Order Display',     desc:'Digital boards · fewer mistakes'},
  ];

  // GDD Part 2: Delivery fleet (passive income)
  const DELIVERY_FLEET = [
    {id:'scooter', icon:'🛵', name:'Delivery Scooters', desc:'Neighborhood deliveries'},
    {id:'van',     icon:'🚐', name:'Delivery Vans',     desc:'Bulk lunch runs'},
    {id:'drone',   icon:'🚁', name:'Delivery Drones',   desc:'Premium express drops'},
  ];

  // GDD Part 2: Kitchen workflow stages (maps onto stations conceptually)
  const WORKFLOW_STAGES = [
    {id:'order',    icon:'🧾', name:'Order Intake',   station:'noodles'},
    {id:'noodles',  icon:'🍜', name:'Noodle Cook',    station:'noodles'},
    {id:'broth',    icon:'🍲', name:'Broth Prep',     station:'broth'},
    {id:'toppings', icon:'🥢', name:'Toppings',       station:'toppings'},
    {id:'quality',  icon:'✅', name:'Quality Check',  station:'desserts'},
    {id:'serve',    icon:'🍽️', name:'Serve',          station:'drinks'},
  ];

  // Ingredients drop when you level businesses (themed by country). Used only
  // for crafting signature ramen — no other economy touchpoints.
  // Quality tiers for ingredients (GDD Part 3)
  const INGREDIENT_QUALITIES = [
    {id:'common',    icon:'⚪', name:'Common',    mult:1.0},
    {id:'uncommon',  icon:'🟢', name:'Uncommon',  mult:1.15},
    {id:'rare',      icon:'🔵', name:'Rare',      mult:1.35},
    {id:'epic',      icon:'🟣', name:'Epic',      mult:1.60},
    {id:'legendary', icon:'🟠', name:'Legendary', mult:2.00},
  ];
  const RECIPE_MASTERY_NAMES = ['Beginner','Skilled','Expert','Master','Legendary'];

  // Ingredients — country-themed; quality is tracked per stack in state
  const INGREDIENTS = [
    {id:'noodles',   icon:'🍜', name:'Fresh Noodles',   country:'japan',  category:'wheat'},
    {id:'broth',     icon:'🍲', name:'Rich Broth',      country:'japan',  category:'base'},
    {id:'chashu',    icon:'🥓', name:'Chashu Pork',     country:'japan',  category:'pork'},
    {id:'nori',      icon:'🍙', name:'Nori Sheets',     country:'japan',  category:'seaweed'},
    {id:'egg',       icon:'🥚', name:'Ajitsuke Egg',    country:'japan',  category:'eggs'},
    {id:'mushroom',  icon:'🍄', name:'Shiitake',        country:'japan',  category:'mushrooms'},
    {id:'dough',     icon:'🥖', name:'Pasta Dough',     country:'italy',  category:'wheat'},
    {id:'tomato',    icon:'🍅', name:'San Marzano',     country:'italy',  category:'vegetables'},
    {id:'basil',     icon:'🌿', name:'Fresh Basil',     country:'italy',  category:'vegetables'},
    {id:'cheese',    icon:'🧀', name:'Aged Parmesan',   country:'italy',  category:'dairy'},
    {id:'tortilla',  icon:'🌮', name:'Corn Tortilla',   country:'mexico', category:'wheat'},
    {id:'salsa',     icon:'🌶️', name:'Fire Salsa',      country:'mexico', category:'vegetables'},
    {id:'avocado',   icon:'🥑', name:'Ripe Avocado',    country:'mexico', category:'vegetables'},
    {id:'lime',      icon:'🍋', name:'Zesty Lime',      country:'mexico', category:'vegetables'},
    {id:'chicken',   icon:'🍗', name:'Grilled Chicken', country:'mexico', category:'chicken'},
    {id:'spice',     icon:'🧂', name:'Garam Masala',    country:'india',  category:'spices'},
    {id:'naan',      icon:'🫓', name:'Warm Naan',       country:'india',  category:'wheat'},
    {id:'paneer',    icon:'🧈', name:'Fresh Paneer',    country:'india',  category:'dairy'},
    {id:'chai',      icon:'🍵', name:'Masala Chai',     country:'india',  category:'spices'},
    {id:'seafood',   icon:'🦐', name:'Fresh Prawns',    country:'japan',  category:'seafood'},
    {id:'truffle',   icon:'✨', name:'Black Truffle',   country:'italy',  category:'spices', rare:true},
    {id:'saffron',   icon:'🌺', name:'Saffron Threads', country:'india',  category:'spices', rare:true},
  ];

  // Suppliers (GDD Part 3 supply chain) — buy bulk ingredients with cash
  const SUPPLIERS = [
    {id:'local',    icon:'🏪', name:'Local Market',     country:null,     priceMult:1.0,  qty:3,  unlockCountries:0},
    {id:'tokyo',    icon:'🇯🇵', name:'Tokyo Wholesaler', country:'japan',  priceMult:0.85, qty:5,  unlockCountries:1},
    {id:'rome',     icon:'🇮🇹', name:'Roman Importer',  country:'italy',  priceMult:0.80, qty:5,  unlockCountries:2},
    {id:'global',   icon:'🌍', name:'Global Foods Co.', country:null,     priceMult:0.70, qty:8,  unlockCountries:3},
    {id:'premium',  icon:'💎', name:'Premium Spices',   country:null,     priceMult:1.4,  qty:2,  unlockCountries:2, rareOnly:true},
  ];

  // Signature recipes: cost, boost, rarity, unlock rules, seasonal/secret flags
  // unlock: {country?, prestige?, michelin?, secret?, seasonal?}
  const RECIPES = [
    {id:'tonkotsu',   icon:'🍜', name:'Signature Tonkotsu', desc:'+40% income for 90s', rarity:'common',
      cost:{noodles:2, broth:2, chashu:1}, boost:{income:0.40}, unlock:{}},
    {id:'miso_bomb',  icon:'🍥', name:'Miso Umami Bomb',   desc:'+60% tap gain for 90s', rarity:'common',
      cost:{noodles:1, broth:1, nori:2}, boost:{tap:0.60}, unlock:{}},
    {id:'egg_shoyu',  icon:'🥚', name:'Shoyu Egg Bowl',    desc:'+20% income & +10% tap', rarity:'common',
      cost:{noodles:1, broth:1, egg:2}, boost:{income:0.20, tap:0.10}, unlock:{}},
    {id:'carbonara',  icon:'🍝', name:'Ramen Carbonara',   desc:'+25% income & +5 rep', rarity:'uncommon',
      cost:{dough:2, cheese:1, basil:1}, boost:{income:0.25, rep:5}, unlock:{country:'italy'}},
    {id:'spicy_taco', icon:'🌶️', name:'Spicy Taco Ramen',  desc:'+50% income for 90s', rarity:'uncommon',
      cost:{tortilla:1, salsa:2, lime:1}, boost:{income:0.50}, unlock:{country:'mexico'}},
    {id:'curry_bowl', icon:'🍛', name:'Curry Ramen Bowl',  desc:'+30% income & +20% tap', rarity:'uncommon',
      cost:{spice:2, naan:1, paneer:1}, boost:{income:0.30, tap:0.20}, unlock:{country:'india'}},
    {id:'seafood',    icon:'🦐', name:'Seafood Deluxe',    desc:'+45% income for 90s', rarity:'rare',
      cost:{noodles:2, seafood:2, nori:1}, boost:{income:0.45}, unlock:{country:'japan', prestige:1}},
    {id:'truffle',    icon:'✨', name:'Truffle Ramen',     desc:'+55% income & +8 rep', rarity:'epic',
      cost:{dough:2, truffle:1, cheese:1}, boost:{income:0.55, rep:8}, unlock:{country:'italy', prestige:3}},
    {id:'saffron',    icon:'🌺', name:'Saffron Royal',     desc:'+65% income for 90s', rarity:'epic',
      cost:{spice:2, saffron:1, naan:1}, boost:{income:0.65}, unlock:{country:'india', prestige:5}},
    {id:'legend',     icon:'👑', name:'Empire Special',    desc:'+75% income for 90s', rarity:'legendary',
      cost:{noodles:2, broth:1, tomato:1, salsa:1, spice:1, cheese:1}, boost:{income:0.75}, unlock:{prestige:2}},
    {id:'michelin_bowl', icon:'⭐', name:'Michelin Bowl',  desc:'+90% income for 90s', rarity:'legendary',
      cost:{noodles:3, broth:2, chashu:1, truffle:1, saffron:1}, boost:{income:0.90}, unlock:{michelin:1}},
    // Secret
    {id:'midnight',   icon:'🌙', name:'Midnight Ramen',    desc:'+50% income & +40% offline feel', rarity:'secret',
      cost:{noodles:2, broth:2, mushroom:2, egg:1}, boost:{income:0.50}, unlock:{secret:true, prestige:4}},
    // Seasonal (always craftable once seasonal skin/event seen; treated as unlocked if seasonal flag)
    {id:'sakura_ramen', icon:'🌸', name:'Cherry Blossom Ramen', desc:'+35% income & +15% tap', rarity:'seasonal',
      cost:{noodles:2, broth:1, nori:1, basil:1}, boost:{income:0.35, tap:0.15}, unlock:{seasonal:'sakura'}},
    {id:'spooky_ramen', icon:'🎃', name:'Halloween Spicy Ramen', desc:'+40% income for 90s', rarity:'seasonal',
      cost:{noodles:1, salsa:2, spice:1, egg:1}, boost:{income:0.40}, unlock:{seasonal:'halloween'}},
    {id:'feast_ramen',  icon:'🎄', name:'Christmas Seafood Ramen', desc:'+50% income & +10 rep', rarity:'seasonal',
      cost:{noodles:2, seafood:2, cheese:1}, boost:{income:0.50, rep:10}, unlock:{seasonal:'holiday'}},
  ];
  // GDD Part 5 — Customer types. Each has budget (reward mult), base patience (ms),
  // weight (spawn frequency), favorite order flavor, and optional special flags.
  const CUSTOMER_TYPES = [
    {id:'student',    icon:'🎒', name:'Student',        label:'Budget ramen',        flavor:'Cheap & filling, please!',     budget:0.7,  patience:14000, weight:22, tipChance:0.05},
    {id:'office',     icon:'💼', name:'Office Worker',  label:'Lunch special',       flavor:'Quick — back to the desk!',   budget:1.1,  patience:12000, weight:20, tipChance:0.12},
    {id:'family',     icon:'👨‍👩‍👧', name:'Family',         label:'Family order',        flavor:'Something for everyone.',     budget:1.4,  patience:22000, weight:14, tipChance:0.15},
    {id:'tourist',    icon:'🧳', name:'Tourist',        label:'Local specialty',     flavor:'What\'s the regional classic?', budget:1.6,  patience:20000, weight:12, tipChance:0.20, tourist:true},
    {id:'elderly',    icon:'👴', name:'Elderly',        label:'Mild classic',        flavor:'Not too spicy, dear.',        budget:0.9,  patience:28000, weight:10, tipChance:0.18},
    {id:'foodie',     icon:'😋', name:'Food Lover',     label:'Signature bowl',      flavor:'Surprise me with your best!', budget:1.8,  patience:16000, weight:10, tipChance:0.25},
    {id:'vip',        icon:'💎', name:'VIP Guest',      label:'VIP tasting',         flavor:'I expect excellence.',        budget:3.2,  patience:15000, weight:0,  tipChance:0.55, special:'vip'},
    {id:'celebrity',  icon:'🌟', name:'Celebrity',      label:'Celebrity visit!',    flavor:'The cameras are rolling…',   budget:5.5,  patience:18000, weight:0,  tipChance:0.80, special:'celebrity'},
    {id:'critic',     icon:'📰', name:'Food Critic',    label:'Critic\'s order',     flavor:'Every detail will be noted.', budget:2.4,  patience:16000, weight:0,  tipChance:0.40, special:'critic'},
  ];

  // Legacy alias — order flavors still used for display variety on normal types
  const ORDER_TYPES = CUSTOMER_TYPES.filter(c => !c.special);

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
    {id:'valentine', icon:'💝', name:'Hearty Broth',       month:2,  startDay:10, endDay:16,  skinId:'valentine',challengeType:'earn', challengeTarget:0, rewardMiso:1, blurb:'Serve love by the ladle.'},
    {id:'spring',    icon:'🌸', name:'Sakura Season',      month:3,  startDay:20, endDay:31,  skinId:'sakura_s', challengeType:'buy',  challengeTarget:15, rewardMiso:1, blurb:'Petals in the steam.'},
    {id:'summer',    icon:'☀️', name:'Summer Festival',    month:7,  startDay:1,  endDay:21,  skinId:'summer',   challengeType:'taps', challengeTarget:300, rewardMiso:1, blurb:'Festival stalls and fireworks.'},
    {id:'halloween', icon:'🎃', name:'Spooky Ramen',       month:10, startDay:24, endDay:31,  skinId:'halloween',challengeType:'earn', challengeTarget:0, rewardMiso:1, blurb:'A little fear, a lot of umami.'},
    {id:'holiday',   icon:'🎄', name:'Winter Feast',       month:12, startDay:15, endDay:31,  skinId:'holiday',  challengeType:'buy',  challengeTarget:20, rewardMiso:2, blurb:'The empire\'s warmest week.'},
  ];

  // GDD Part 8 — Weekly Food Festivals (rotate by ISO week number)
  const WEEKLY_FESTIVALS = [
    {id:'spicy',    icon:'🌶️', name:'Spicy Bowl Festival',   blurb:'Heat seekers welcome.',        tokenBonus:1.2},
    {id:'classic',  icon:'🍜', name:'Classic Ramen Week',    blurb:'Back to tradition.',           tokenBonus:1.0},
    {id:'seafood',  icon:'🦐', name:'Seafood Splash',        blurb:'Ocean in every bowl.',         tokenBonus:1.1},
    {id:'veggie',   icon:'🥬', name:'Garden Ramen Week',     blurb:'Green and clean.',             tokenBonus:1.0},
    {id:'fusion',   icon:'🌍', name:'World Fusion Fest',     blurb:'Borders? What borders?',       tokenBonus:1.3},
    {id:'midnight', icon:'🌙', name:'Midnight Noodle Run',   blurb:'After-hours empire.',          tokenBonus:1.15},
    {id:'premium',  icon:'💎', name:'Premium Tasting Week',  blurb:'Only the finest.',             tokenBonus:1.4},
  ];

  // Event Pass tiers — claim sequentially during an active seasonal or weekly event
  const EVENT_PASS_TIERS = [
    {id:'p1',  icon:'💴', label:'Cash Drop',       cost:0,  reward:{cashSec:30}},
    {id:'p2',  icon:'🎫', label:'Event Tokens',    cost:5,  reward:{tokens:8}},
    {id:'p3',  icon:'💎', label:'Diamond Pinch',   cost:12, reward:{diamonds:2}},
    {id:'p4',  icon:'🔬', label:'Research Pack',   cost:20, reward:{research:3}},
    {id:'p5',  icon:'⚡', label:'Booster Voucher', cost:30, reward:{booster:true}},
    {id:'p6',  icon:'🎫', label:'Token Bundle',    cost:40, reward:{tokens:15}},
    {id:'p7',  icon:'💎', label:'Gem Cache',       cost:55, reward:{diamonds:5}},
    {id:'p8',  icon:'👑', label:'Grand Prize',     cost:75, reward:{tokens:25, diamonds:3, cashSec:120}},
  ];

  // Event Shop — spend event tokens
  const EVENT_SHOP = [
    {id:'tok_cash',   icon:'💴', name:'Cash Crate',        cost:10, kind:'cashSec', amount:90},
    {id:'tok_gem',    icon:'💎', name:'Diamond Shard',     cost:25, kind:'diamonds', amount:3},
    {id:'tok_rp',     icon:'🔬', name:'Lab Notes',         cost:15, kind:'research', amount:4},
    {id:'tok_ing',    icon:'🧅', name:'Ingredient Box',    cost:12, kind:'ingredient', amount:5},
    {id:'tok_boost',  icon:'⚡', name:'Rush Hour Voucher', cost:30, kind:'booster', amount:1},
    {id:'tok_loy',    icon:'❤️', name:'Fan Club Pack',     cost:18, kind:'loyalty', amount:10},
    {id:'tok_fame',   icon:'📣', name:'PR Campaign',       cost:20, kind:'fame', amount:15},
  ];

  // World Food Championship AI rivals
  const CHAMPIONSHIP_RIVALS = [
    {id:'tokyo_tiger',  icon:'🐯', name:'Tokyo Tiger Ramen',   skill:0.85},
    {id:'rome_fox',     icon:'🦊', name:'Rome Fox Trattoria',  skill:0.95},
    {id:'osaka_owl',    icon:'🦉', name:'Osaka Owl Stand',     skill:0.75},
    {id:'seoul_dragon', icon:'🐲', name:'Seoul Dragon Bowl',   skill:1.05},
    {id:'sf_phoenix',   icon:'🔥', name:'SF Phoenix Noodles',  skill:1.15},
  ];

  // Community challenge templates (global simulated goals)
  const COMMUNITY_GOALS = [
    {id:'bowls_1b',   icon:'🍜', name:'Serve 1B Bowls',      unit:'bowls',    target:1e9,  rewardTokens:20, rewardDiamonds:3},
    {id:'deliver_10m',icon:'🛵', name:'10M Deliveries',      unit:'delivery', target:1e7,  rewardTokens:15, rewardDiamonds:2},
    {id:'fest_cash',  icon:'💴', name:'Festival Earnings',   unit:'cash',     target:1e12, rewardTokens:25, rewardDiamonds:4},
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
    {id:'order_100',   icon:'🏅', name:'Crowd Favorite',    desc:'Fulfill 100 customer orders',      reward:0.04, cond: s => (s.ordersFulfilled||0) >= 100},
    {id:'vip_serve',   icon:'💎', name:'VIP Treatment',     desc:'Successfully serve a VIP guest',   reward:0.03, cond: s => (s.vipServed||0) >= 1},
    {id:'celeb_serve', icon:'🌟', name:'Star Attraction',   desc:'Serve a celebrity customer',       reward:0.05, cond: s => (s.celebritiesServed||0) >= 1},
    {id:'loyalty_50',  icon:'❤️', name:'Regulars Club',     desc:'Earn 50 loyalty points',           reward:0.03, cond: s => (s.loyaltyPoints||0) >= 50},
    {id:'loyalty_150', icon:'👑', name:'Loyalty Legend',    desc:'Earn 150 loyalty points',          reward:0.05, cond: s => (s.loyaltyPoints||0) >= 150},
    {id:'sat_high',    icon:'😊', name:'Happy Customers',   desc:'Reach 90 customer satisfaction',   reward:0.03, cond: s => (s.satisfaction||0) >= 90},
    {id:'reviews_10',  icon:'⭐', name:'Review Magnet',     desc:'Collect 10 positive customer reviews', reward:0.03, cond: s => (s.reviewsPositive||0) >= 10},

    {id:'first_craft', icon:'🧪', name:'Kitchen Debut',     desc:'Craft your first signature ramen', reward:0.02, cond: s => (s.recipesCrafted||0) >= 1},
    {id:'chef_five',   icon:'👨‍🍳', name:'Five-Star Kitchen', desc:'Craft 10 signature ramen dishes',  reward:0.03, cond: s => (s.recipesCrafted||0) >= 10},
    {id:'rep_high',    icon:'⭐', name:'Beloved Shop',      desc:'Reach 95 reputation',              reward:0.03, cond: s => (s.reputation||0) >= 95},
    {id:'story_japan', icon:'📖', name:'First Chapter',     desc:'Complete Japan story chapter',      reward:0.02, cond: s => isChapterComplete(s,'japan')},
    {id:'story_all',   icon:'📚', name:'Full Saga',         desc:'Complete every story chapter',      reward:0.05, cond: s => STORY_CHAPTERS.every(ch => isChapterComplete(s, ch.id))},
    {id:'staff_train', icon:'🎓', name:'Staff Trainer',     desc:'Train any manager to level 5',      reward:0.03, cond: s => allBusinessStates(s).some(b => (b.managerLevel||0) >= 5)},
    {id:'staff_max',   icon:'🏅', name:'Head Chef',         desc:'Max a manager to level 10',         reward:0.04, cond: s => allBusinessStates(s).some(b => (b.managerLevel||0) >= 10)},
    {id:'stations_5',  icon:'🏭', name:'Full Kitchen',      desc:'Reach level 5 on every cooking station', reward:0.03, cond: s => COOKING_STATIONS.every(st => (s.stations&&s.stations[st.id]||0) >= 5)},
    {id:'research_10', icon:'🔬', name:'Lab Rat',           desc:'Spend 10 research levels total',    reward:0.03, cond: s => Object.values(s.research||{}).reduce((a,b)=>a+b,0) >= 10},
    {id:'first_chef',  icon:'🌟', name:'Star Recruit',      desc:'Unlock a legendary chef',          reward:0.03, cond: s => Object.keys(s.chefsOwned||{}).length >= 1},
    {id:'michelin_1',  icon:'⭐', name:'Michelin Star',     desc:'Earn your first Michelin star',    reward:0.05, cond: s => (s.michelinStars||0) >= 1},
    {id:'michelin_3',  icon:'🌟', name:'Three Stars',       desc:'Earn all 3 Michelin stars',        reward:0.08, cond: s => (s.michelinStars||0) >= 3},
    {id:'layout_10',   icon:'🏗️', name:'Master Builder',    desc:'Reach 10 total layout upgrade levels', reward:0.03, cond: s => Object.values(s.layout||{}).reduce((a,b)=>a+b,0) >= 10},
    {id:'delivery_5',  icon:'🛵', name:'Fleet Commander',   desc:'Reach level 5 on any delivery vehicle', reward:0.03, cond: s => Object.values(s.delivery||{}).some(v => v >= 5)},
    {id:'takeaway',    icon:'🥡', name:'Takeaway King',     desc:'Unlock takeaway service',          reward:0.02, cond: s => !!(s.serviceModes&&s.serviceModes.takeaway)},
    {id:'drivethru',   icon:'🚗', name:'Drive-Thru Pro',    desc:'Unlock drive-through',             reward:0.04, cond: s => !!(s.serviceModes&&s.serviceModes.driveThrough)},
    {id:'rating_80',   icon:'📊', name:'Highly Rated',      desc:'Reach restaurant rating 80',       reward:0.04, cond: s => (typeof restaurantRating === 'function' ? restaurantRating(s) : 0) >= 80},
    {id:'mastery_expert', icon:'📖', name:'Recipe Expert',  desc:'Reach Expert mastery on any recipe', reward:0.03, cond: s => Object.values(s.recipeMastery||{}).some(m => (m||0) >= 15)},
    {id:'mastery_legend', icon:'🏅', name:'Recipe Legend',  desc:'Reach Legendary mastery on any recipe', reward:0.06, cond: s => Object.values(s.recipeMastery||{}).some(m => (m||0) >= 100)},
    {id:'secret_craft', icon:'🤫', name:'Secret Menu',     desc:'Craft a secret recipe',            reward:0.04, cond: s => !!(s.secretsCrafted&&s.secretsCrafted.midnight)},
    {id:'storage_5',   icon:'📦', name:'Stocked Up',       desc:'Upgrade ingredient storage to level 5', reward:0.02, cond: s => (s.storageLevel||0) >= 5},
    {id:'supplier',    icon:'🚚', name:'Supply Chain',     desc:'Place an order with any supplier',  reward:0.02, cond: s => (s.supplierOrders||0) >= 1},
    {id:'hire_staff',  icon:'👥', name:'First Hire',       desc:'Hire your first empire staff member', reward:0.02, cond: s => Object.keys(s.staff||{}).length >= 1},
    {id:'staff_team',  icon:'🏢', name:'Full Team',        desc:'Hire 5 different staff roles',      reward:0.04, cond: s => Object.keys(s.staff||{}).length >= 5},
    {id:'staff_promo', icon:'🎖️', name:'Promotion',        desc:'Promote any staff member to level 10', reward:0.03, cond: s => Object.values(s.staff||{}).some(st => (st.level||0) >= 10)},
    {id:'automation',  icon:'🤖', name:'Fully Automated',  desc:'Reach automation level 3',           reward:0.05, cond: s => (s.automationLevel||0) >= 3},
    {id:'wheel_spin',  icon:'🎡', name:'Feeling Lucky',    desc:'Spin the Lucky Wheel once',         reward:0.02, cond: s => (s.wheelSpins||0) >= 1},
    {id:'wheel_10',    icon:'🎰', name:'High Roller',      desc:'Spin the Lucky Wheel 10 times',     reward:0.04, cond: s => (s.wheelSpins||0) >= 10},
    {id:'price_high',  icon:'📈', name:'Premium Menu',     desc:'Set menu price to 1.5× or higher',   reward:0.02, cond: s => (s.menuPrice||1) >= 1.5},
    {id:'fame_50',     icon:'📣', name:'Local Buzz',       desc:'Reach 50 fame',                     reward:0.02, cond: s => (s.fame||0) >= 50},
    {id:'fame_200',    icon:'📡', name:'Rising Star',      desc:'Reach 200 fame',                    reward:0.03, cond: s => (s.fame||0) >= 200},
    {id:'fame_500',    icon:'🎬', name:'Household Name',   desc:'Reach 500 fame',                    reward:0.05, cond: s => (s.fame||0) >= 500},
    {id:'empire_10',   icon:'🏯', name:'Franchise Boss',   desc:'Reach Empire Level 10',             reward:0.03, cond: s => empireLevel(s) >= 10},
    {id:'empire_25',   icon:'🌐', name:'Global Operator',  desc:'Reach Empire Level 25',             reward:0.05, cond: s => empireLevel(s) >= 25},
    {id:'event_tokens',icon:'🎫', name:'Token Collector',  desc:'Earn 50 event tokens',              reward:0.03, cond: s => (s.eventTokensEarned||0) >= 50},
    {id:'champ_win',   icon:'🏆', name:'Champion',         desc:'Win a World Food Championship',     reward:0.04, cond: s => (s.championshipWins||0) >= 1},
    {id:'pass_full',   icon:'📜', name:'Pass Complete',    desc:'Finish an Event Pass',              reward:0.04, cond: s => (s.eventPassCompletes||0) >= 1},

  ];

  // Player journey stages (display only — derived from progress)
  const JOURNEY_STAGES = [
    {id:'beginner',  icon:'🛒', name:'Street Cart Rookie',  desc:'Learn the craft in one city.',           minEmpire:0,  minCountries:1},
    {id:'mid',       icon:'🏢', name:'City Expansion',      desc:'Multiple cities and hired managers.',    minEmpire:8,  minCountries:2},
    {id:'late',      icon:'🌆', name:'Global Franchise',    desc:'Worldwide ramen with Michelin prestige.', minEmpire:20, minCountries:3},
    {id:'endgame',   icon:'👑', name:'Ramen Legend',        desc:'Max stars, every chef, global rank.',    minEmpire:40, minCountries:4},
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
    // GDD Part 5 — Customer System
    satisfaction: 70,         // 0–100 overall customer satisfaction
    loyaltyPoints: 0,         // accumulates from successful serves
    vipServed: 0,
    celebritiesServed: 0,
    reviewsPositive: 0,
    reviewsTotal: 0,
    customerTypeStats: {},    // customerTypeId -> {served, missed}
    // GDD Part 6 — Economy
    menuPrice: 1.0,           // dynamic pricing multiplier (0.6–1.8)
    wheelSpins: 0,            // lifetime spins
    wheelLastFreeDate: null,  // YYYY-MM-DD of last free spin
    wheelExtraSpins: 0,       // paid extras remaining today
    // GDD Part 7 — Progression
    fame: 0,                  // 0–1000 popularity
    // GDD Part 8 — Events
    eventTokens: 0,
    eventTokensEarned: 0,
    eventPassClaimed: {},
    eventPassWeekId: null,
    eventPassCompletes: 0,
    championshipWins: 0,
    championshipRace: null,
    championshipCooldownUntil: 0,
    communityClaimed: {},
    // Story / seasonal / staff (v1.7)
    storyClaimed: {},     // questId -> true once reward claimed
    seasonal: { eventId: null, progress: 0, claimed: false, skinUnlocked: {} },
    // seasonal.skinUnlocked[skinId] = true after completing that event's challenge
    // Social (v1.8)
    guildId: null,        // Firestore guild doc id, if joined
    guildName: null,
    gifts: { lastGiftDate: null, giftedToday: {}, pendingClaimed: {} },
    // GDD systems (v2.0)
    stations: {},
    research: {},
    researchPoints: 0,
    chefsOwned: {},
    equippedChef: null,
    chefSkillEndsAt: 0,
    chefSkillCooldownUntil: 0,
    michelinStars: 0,
    michelinChallenge: null,
    // GDD Part 2: Restaurant systems
    layout: {},
    queue: {},
    delivery: {},
    serviceModes: { takeaway: false, driveThrough: false },
    cleaningLevel: 0,
    cleanliness: 80,
    // GDD Part 3: Recipes & ingredients
    recipeMastery: {},
    recipeUpgrades: {},
    storageLevel: 0,
    ingredientQuality: {},
    supplierCooldownUntil: 0,
    supplierOrders: 0,
    secretsCrafted: {},
    // GDD Part 4: Staff
    staff: {},
    staffSkills: {},
    staffEquip: {},
    automationLevel: 0,
    breakRoomLevel: 0
  };

  // Every source of cash gain (tap, tick, offline, milestone, challenge/daily
  // reward) should route through here instead of touching totalEarned
  // directly, so the Weekly leaderboard counter always stays in sync with
  // lifetime earnings without duplicating this line at every call site.
  function addEarned(amount){
    state.totalEarned += amount;
    state.weeklyEarned = (state.weeklyEarned || 0) + amount;
    if(typeof tickMichelinChallenge === 'function') tickMichelinChallenge(amount);
    if(typeof addChampionshipScore === 'function') addChampionshipScore(amount);
    if(typeof contributeCommunity === 'function' && amount > 0){
      // Feed community cash goal
      contributeCommunity('fest_cash', amount);
      contributeCommunity('bowls_1b', Math.max(1, Math.floor(amount / Math.max(totalRatePerSec(), 1))));
    }
  }

  function freshBusiness(){ return {level:0, manager:false, managerLevel:0, managerType:null, speed:0, capacity:0, quality:0}; }
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

  // ---------- powerups / boosters (bought with global diamonds) — GDD Part 6 ----------
  const POWERUPS = [
    {id:'double_income', icon:'💰', name:'Double Income',   desc:'2× passive income for 10 min', durationMs:10*60*1000, cost:25, effect:'income', mult:2},
    {id:'tap_frenzy',    icon:'👆', name:'Tap Frenzy',      desc:'5× tap gain for 5 min',         durationMs:5*60*1000,  cost:20, effect:'tap',    mult:5},
    {id:'night_owl',     icon:'🌙', name:'Night Owl',       desc:'3× offline rate for 30 min',    durationMs:30*60*1000, cost:30, effect:'offline',mult:3},
    {id:'lucky_charm',   icon:'🍀', name:'Lucky Charm',     desc:'+25% event chance for 15 min',  durationMs:15*60*1000, cost:15, effect:'luck',   mult:0.25},
    {id:'cash_burst',    icon:'💥', name:'Cash Burst',      desc:'Instant 60s of active-country income', durationMs:0, cost:18, effect:'burst', mult:60},
    {id:'rep_boost',     icon:'⭐', name:'Star Chef',       desc:'+20 reputation instantly',      durationMs:0, cost:12, effect:'rep', mult:20},
    // New boosters (GDD Part 6)
    {id:'rush_hour',     icon:'🚦', name:'Rush Hour',       desc:'+50% customer traffic for 12 min', durationMs:12*60*1000, cost:22, effect:'traffic', mult:1.5},
    {id:'fast_delivery', icon:'🛵', name:'Express Fleet',   desc:'2× delivery income for 15 min',  durationMs:15*60*1000, cost:20, effect:'delivery', mult:2},
    {id:'instant_cook',  icon:'⚡', name:'Instant Cook',    desc:'Instant 90s of income + free order fill', durationMs:0, cost:28, effect:'instant_cook', mult:90},
    {id:'triple_income', icon:'🏆', name:'Golden Hour',     desc:'3× passive income for 5 min',    durationMs:5*60*1000,  cost:45, effect:'income', mult:3},
  ];

  // Lucky Wheel prize table (weighted). kind: cashSec | diamonds | research | ingredient | booster | loyalty
  const WHEEL_PRIZES = [
    {id:'cash_s',   icon:'💴', label:'Cash pile',       weight:22, kind:'cashSec',   amount:45},
    {id:'cash_m',   icon:'💰', label:'Big cash',        weight:14, kind:'cashSec',   amount:120},
    {id:'cash_l',   icon:'🤑', label:'Jackpot cash',    weight:4,  kind:'cashSec',   amount:300},
    {id:'gem_1',    icon:'💎', label:'1 Diamond',       weight:16, kind:'diamonds',  amount:1},
    {id:'gem_3',    icon:'💎', label:'3 Diamonds',      weight:6,  kind:'diamonds',  amount:3},
    {id:'rp',       icon:'🔬', label:'Research Points', weight:12, kind:'research',  amount:2},
    {id:'ing',      icon:'🧅', label:'Rare ingredients',weight:10, kind:'ingredient',amount:3},
    {id:'boost',    icon:'⚡', label:'Free booster',    weight:8,  kind:'booster',   amount:1},
    {id:'loyalty',  icon:'❤️', label:'Loyalty points',  weight:8,  kind:'loyalty',   amount:5},
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
  function powerupTrafficMult(){
    let m = 1;
    POWERUPS.forEach(p => {
      if(p.effect === 'traffic' && powerupActive(p.id)) m *= p.mult;
    });
    return m;
  }
  function buyPowerup(id){
    const def = POWERUPS.find(p => p.id === id);
    if(!def) return;
    if((state.diamonds || 0) < def.cost){ playErrorSfx(); return; }
    if(def.durationMs > 0 && powerupActive(id)){ playErrorSfx(); return; } // already active
    state.diamonds -= def.cost;
    playBuySfx();
    if(def.effect === 'burst' || def.effect === 'instant_cook'){
      const gain = Math.max(1, countryRatePerSec(activeCountryDef()) * globalMultiplier() * eventMultiplier() * def.mult);
      addCountryCash(state.activeCountry, gain);
      addEarned(gain);
      spawnFloatingGain(gain);
      if(def.effect === 'instant_cook' && typeof activeOrder !== 'undefined' && activeOrder && typeof fulfillOrder === 'function'){
        fulfillOrder();
      }
    } else if(def.effect === 'rep'){
      adjustReputation(def.mult);
    } else {
      if(!state.activePowerups) state.activePowerups = {};
      state.activePowerups[id] = Date.now() + def.durationMs;
    }
    save(); renderStats(); renderPowerups();
    if(typeof renderEconomy === 'function') renderEconomy();
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
      satisfaction: CONFIG.SATISFACTION_START,
      loyaltyPoints: 0,
      vipServed: 0,
      celebritiesServed: 0,
      reviewsPositive: 0,
      reviewsTotal: 0,
      customerTypeStats: {},
      menuPrice: CONFIG.MENU_PRICE_DEFAULT || 1.0,
      wheelSpins: 0,
      wheelLastFreeDate: null,
      wheelExtraSpins: 0,
      fame: CONFIG.FAME_START || 0,
      eventTokens: 0,
      eventTokensEarned: 0,
      eventPassClaimed: {},
      eventPassWeekId: null,
      eventPassCompletes: 0,
      championshipWins: 0,
      championshipRace: null,
      championshipCooldownUntil: 0,
      communityClaimed: {},
      storyClaimed: {},
      seasonal: { eventId: null, progress: 0, claimed: false, skinUnlocked: {} },
      guildId: null,
      guildName: null,
      gifts: { lastGiftDate: null, giftedToday: {}, pendingClaimed: {} },
      // GDD systems
      stations: {},           // stationId -> level
      research: {},           // branchId -> level
      researchPoints: 0,
      chefsOwned: {},         // chefId -> true
      equippedChef: null,
      chefSkillEndsAt: 0,
      chefSkillCooldownUntil: 0,
      michelinStars: 0,
      michelinChallenge: null, // {startedAt, targetCash, earned} while active
      // GDD Part 2
      layout: {},
      queue: {},
      delivery: {},
      serviceModes: { takeaway: false, driveThrough: false },
      cleaningLevel: 0,
      cleanliness: 80,
      // GDD Part 3
      recipeMastery: {},
      recipeUpgrades: {},
      storageLevel: 0,
      ingredientQuality: {},
      supplierCooldownUntil: 0,
      supplierOrders: 0,
      secretsCrafted: {},
      // GDD Part 4
      staff: {},
      staffSkills: {},
      staffEquip: {},
      automationLevel: 0,
      breakRoomLevel: 0
    };
    COUNTRIES.forEach(c => {
      s.countries[c.id] = initCountryState(c);
      s.countryCash[c.id] = 0;
    });
    META_UPGRADES.forEach(m => { s.metaUpgrades[m.id] = 0; });
    COOKING_STATIONS.forEach(st => { s.stations[st.id] = 0; });
    RESEARCH_BRANCHES.forEach(br => { s.research[br.id] = 0; });
    LAYOUT_UPGRADES.forEach(u => { s.layout[u.id] = 0; });
    QUEUE_UPGRADES.forEach(u => { s.queue[u.id] = 0; });
    DELIVERY_FLEET.forEach(u => { s.delivery[u.id] = 0; });
    STAFF_SKILLS.forEach(sk => { s.staffSkills[sk.id] = 0; });
    STAFF_EQUIPMENT.forEach(eq => { s.staffEquip[eq.id] = 0; });
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
        if(biz.managerType === undefined) biz.managerType = biz.manager ? 'head_chef' : null;
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
    if(state.satisfaction === undefined) state.satisfaction = CONFIG.SATISFACTION_START;
    if(state.loyaltyPoints === undefined) state.loyaltyPoints = 0;
    if(state.vipServed === undefined) state.vipServed = 0;
    if(state.celebritiesServed === undefined) state.celebritiesServed = 0;
    if(state.reviewsPositive === undefined) state.reviewsPositive = 0;
    if(state.reviewsTotal === undefined) state.reviewsTotal = 0;
    if(!state.customerTypeStats) state.customerTypeStats = {};
    if(state.menuPrice === undefined) state.menuPrice = CONFIG.MENU_PRICE_DEFAULT || 1.0;
    if(state.wheelSpins === undefined) state.wheelSpins = 0;
    if(state.wheelLastFreeDate === undefined) state.wheelLastFreeDate = null;
    if(state.wheelExtraSpins === undefined) state.wheelExtraSpins = 0;
    if(state.fame === undefined) state.fame = CONFIG.FAME_START || 0;
    if(state.eventTokens === undefined) state.eventTokens = 0;
    if(state.eventTokensEarned === undefined) state.eventTokensEarned = 0;
    if(!state.eventPassClaimed) state.eventPassClaimed = {};
    if(state.eventPassWeekId === undefined) state.eventPassWeekId = null;
    if(state.eventPassCompletes === undefined) state.eventPassCompletes = 0;
    if(state.championshipWins === undefined) state.championshipWins = 0;
    if(state.championshipRace === undefined) state.championshipRace = null;
    if(state.championshipCooldownUntil === undefined) state.championshipCooldownUntil = 0;
    if(!state.communityClaimed) state.communityClaimed = {};
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
    // GDD systems
    if(!state.stations) state.stations = {};
    COOKING_STATIONS.forEach(st => { if(state.stations[st.id] === undefined) state.stations[st.id] = 0; });
    if(!state.research) state.research = {};
    RESEARCH_BRANCHES.forEach(br => { if(state.research[br.id] === undefined) state.research[br.id] = 0; });
    if(state.researchPoints === undefined) state.researchPoints = 0;
    if(!state.chefsOwned) state.chefsOwned = {};
    if(state.equippedChef === undefined) state.equippedChef = null;
    if(state.chefSkillEndsAt === undefined) state.chefSkillEndsAt = 0;
    if(state.chefSkillCooldownUntil === undefined) state.chefSkillCooldownUntil = 0;
    if(state.michelinStars === undefined) state.michelinStars = 0;
    if(state.michelinChallenge === undefined) state.michelinChallenge = null;
    if(!state.layout) state.layout = {};
    LAYOUT_UPGRADES.forEach(u => { if(state.layout[u.id] === undefined) state.layout[u.id] = 0; });
    if(!state.queue) state.queue = {};
    QUEUE_UPGRADES.forEach(u => { if(state.queue[u.id] === undefined) state.queue[u.id] = 0; });
    if(!state.delivery) state.delivery = {};
    DELIVERY_FLEET.forEach(u => { if(state.delivery[u.id] === undefined) state.delivery[u.id] = 0; });
    if(!state.serviceModes) state.serviceModes = { takeaway: false, driveThrough: false };
    if(state.serviceModes.takeaway === undefined) state.serviceModes.takeaway = false;
    if(state.serviceModes.driveThrough === undefined) state.serviceModes.driveThrough = false;
    if(state.cleaningLevel === undefined) state.cleaningLevel = 0;
    if(state.cleanliness === undefined) state.cleanliness = 80;
    if(!state.recipeMastery) state.recipeMastery = {};
    if(!state.recipeUpgrades) state.recipeUpgrades = {};
    if(state.storageLevel === undefined) state.storageLevel = 0;
    if(!state.ingredientQuality) state.ingredientQuality = {};
    if(state.supplierCooldownUntil === undefined) state.supplierCooldownUntil = 0;
    if(state.supplierOrders === undefined) state.supplierOrders = 0;
    if(!state.secretsCrafted) state.secretsCrafted = {};
    if(!state.staff) state.staff = {};
    if(!state.staffSkills) state.staffSkills = {};
    STAFF_SKILLS.forEach(sk => { if(state.staffSkills[sk.id] === undefined) state.staffSkills[sk.id] = 0; });
    if(!state.staffEquip) state.staffEquip = {};
    STAFF_EQUIPMENT.forEach(eq => { if(state.staffEquip[eq.id] === undefined) state.staffEquip[eq.id] = 0; });
    if(state.automationLevel === undefined) state.automationLevel = 0;
    if(state.breakRoomLevel === undefined) state.breakRoomLevel = 0;
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
    if(!def || !def.boost) return 0;
    const base = def.boost[kind] || 0;
    const mult = state.activeRecipe.mult || 1;
    return base * mult;
  }
  function totalStationLevels(){
    let n = 0;
    COOKING_STATIONS.forEach(st => { n += (state.stations && state.stations[st.id]) || 0; });
    return n;
  }
  function stationIncomeBonus(){
    return 1 + totalStationLevels() * CONFIG.STATION_INCOME_BOOST;
  }
  function researchLevel(id){ return (state.research && state.research[id]) || 0; }
  function researchIncomeBonus(){
    const br = RESEARCH_BRANCHES.find(b => b.id === 'cooking');
    return 1 + researchLevel('cooking') * (br ? br.boost : 0.03);
  }
  function researchCostBonus(){
    const br = RESEARCH_BRANCHES.find(b => b.id === 'business');
    return Math.max(0.5, 1 - researchLevel('business') * (br ? br.boost : 0.02));
  }
  function researchTapBonus(){
    const br = RESEARCH_BRANCHES.find(b => b.id === 'marketing');
    return 1 + researchLevel('marketing') * (br ? br.boost : 0.04);
  }
  function researchOfflineBonus(){
    const br = RESEARCH_BRANCHES.find(b => b.id === 'delivery');
    return 1 + researchLevel('delivery') * (br ? br.boost : 0.05);
  }
  function michelinBonus(){
    return 1 + (state.michelinStars || 0) * CONFIG.MICHELIN_INCOME_PER_STAR;
  }
  function chefActiveIncomeMult(){
    if(!state.chefSkillEndsAt || state.chefSkillEndsAt <= Date.now()) return 1;
    const chef = LEGENDARY_CHEFS.find(c => c.id === state.equippedChef);
    if(!chef) return 1;
    if(chef.skill === 'double_profit' || chef.skill === 'empire_aura') return 2;
    if(chef.skill === 'customer_rush') return 1.5;
    return 1;
  }
  // ---- GDD Part 2 helpers ----
  function sumLevels(map){
    let n = 0;
    if(!map) return 0;
    Object.values(map).forEach(v => { n += v || 0; });
    return n;
  }
  function layoutIncomeBonus(){
    return 1 + sumLevels(state.layout) * CONFIG.LAYOUT_INCOME_BOOST;
  }
  function queueIncomeBonus(){
    return 1 + sumLevels(state.queue) * CONFIG.QUEUE_INCOME_BOOST;
  }
  function deliveryIncomeBonus(){
    return (1 + sumLevels(state.delivery) * CONFIG.DELIVERY_INCOME_PER_LEVEL) * powerupMult('delivery');
  }
  function menuPriceMult(){
    const p = state.menuPrice == null ? (CONFIG.MENU_PRICE_DEFAULT || 1) : state.menuPrice;
    return Math.max(CONFIG.MENU_PRICE_MIN || 0.6, Math.min(CONFIG.MENU_PRICE_MAX || 1.8, p));
  }
  // Higher prices → fewer orders; lower prices → more traffic
  function menuPriceTrafficMult(){
    const p = menuPriceMult();
    // at 0.6 → ~1.35 traffic, at 1.0 → 1.0, at 1.8 → ~0.55
    return Math.max(0.4, 1.55 - p * 0.55);
  }

  // ---------- GDD Part 7: Fame + Empire Level ----------
  function adjustFame(delta){
    state.fame = Math.max(0, Math.min(CONFIG.FAME_MAX || 1000, (state.fame || 0) + delta));
  }
  function fameMultiplier(){
    return 1 + Math.floor((state.fame || 0) / 100) * (CONFIG.FAME_INCOME_PER_100 || 0.03);
  }
  function empireLevel(s){
    s = s || state;
    // Total shop levels across all countries + station levels / 2
    let n = 0;
    if(typeof allBusinessStates === 'function'){
      allBusinessStates(s).forEach(b => { n += b.level || 0; });
    } else if(s.countries){
      Object.values(s.countries).forEach(c => Object.values(c).forEach(b => { n += b.level || 0; }));
    }
    n += Math.floor(sumLevels(s.stations) / 2);
    return Math.max(1, Math.floor(n / 3) + 1);
  }
  function empireLevelMultiplier(){
    return 1 + Math.max(0, empireLevel() - 1) * (CONFIG.EMPIRE_LEVEL_INCOME_PER || 0.015);
  }
  function michelinTrafficBonus(){
    return 1 + (state.michelinStars || 0) * 0.12; // +12% order traffic per star
  }
  function currentJourneyStage(){
    const el = empireLevel();
    const countries = (state.unlockedCountries || []).length;
    let stage = JOURNEY_STAGES[0];
    JOURNEY_STAGES.forEach(st => {
      if(el >= st.minEmpire && countries >= st.minCountries) stage = st;
    });
    return stage;
  }
  function totalShopLevelsInCountry(countryId){
    const c = state.countries && state.countries[countryId];
    if(!c) return 0;
    return Object.values(c).reduce((a, b) => a + (b.level || 0), 0);
  }
  function cityUnlockRequirements(countryId){
    const repNeed = (CONFIG.CITY_UNLOCK_REP && CONFIG.CITY_UNLOCK_REP[countryId]) || 0;
    const ratingNeed = (CONFIG.CITY_UNLOCK_RATING && CONFIG.CITY_UNLOCK_RATING[countryId]) || 0;
    const shopsNeed = (CONFIG.CITY_UNLOCK_SHOP_LEVELS && CONFIG.CITY_UNLOCK_SHOP_LEVELS[countryId]) || 0;
    // Prior country shop levels: for italy use japan, mexico use sum of unlocked, etc.
    const priorLevels = totalShopLevelsInCountry('japan') +
      (isUnlocked('italy') ? totalShopLevelsInCountry('italy') : 0) +
      (isUnlocked('mexico') ? totalShopLevelsInCountry('mexico') : 0);
    const rep = state.reputation || 0;
    const rating = typeof restaurantRating === 'function' ? restaurantRating() : 0;
    return {
      repNeed, ratingNeed, shopsNeed,
      repOk: rep >= repNeed,
      ratingOk: rating >= ratingNeed,
      shopsOk: priorLevels >= shopsNeed,
      priorLevels,
      allOk: rep >= repNeed && rating >= ratingNeed && priorLevels >= shopsNeed
    };
  }
  function serviceModeBonus(){
    let m = 1;
    if(state.serviceModes && state.serviceModes.takeaway) m += CONFIG.TAKEAWAY_INCOME_BONUS;
    if(state.serviceModes && state.serviceModes.driveThrough) m += CONFIG.DRIVETHRU_INCOME_BONUS;
    return m;
  }
  function cleaningDecayReduction(){
    // each cleaning level reduces cleanliness decay by 5%, capped at 80%
    return Math.min(0.8, (state.cleaningLevel || 0) * 0.05);
  }
  function restaurantRating(s){
    s = s || state;
    // Composite 0–100 from food quality (shop quality upgrades), stations,
    // cleanliness, layout, reputation, Michelin stars, and customer satisfaction.
    let qualityPts = 0, qualityN = 0;
    allBusinessStates(s).forEach(b => {
      if((b.level||0) > 0){ qualityPts += (b.quality||0); qualityN++; }
    });
    const food = qualityN ? Math.min(22, (qualityPts / (qualityN * 20)) * 22) : 0;
    const stations = Math.min(18, (sumLevels(s.stations) / (COOKING_STATIONS.length * 10)) * 18);
    const clean = Math.min(18, ((s.cleanliness||0) / 100) * 18);
    const layout = Math.min(14, (sumLevels(s.layout) / (LAYOUT_UPGRADES.length * 8)) * 14);
    const rep = Math.min(13, ((s.reputation||0) / 100) * 13);
    const stars = Math.min(5, (s.michelinStars||0) * (5/3));
    const sat = Math.min(10, ((s.satisfaction||CONFIG.SATISFACTION_START) / 100) * 10);
    return Math.round(Math.min(100, food + stations + clean + layout + rep + stars + sat));
  }
  function ratingIncomeBonus(){
    return 1 + restaurantRating() * CONFIG.RATING_INCOME_PER_POINT;
  }
  function globalMultiplier(){
    return prestigeMultiplier()
      * (1 + state.achievementBonus)
      * (1 + metaBonus('umami'))
      * reputationMultiplier()
      * (1 + activeRecipeBoost('income'))
      * (typeof giftBoostMultiplier === 'function' ? giftBoostMultiplier() : 1)
      * powerupMult('income')
      * stationIncomeBonus()
      * researchIncomeBonus()
      * michelinBonus()
      * chefActiveIncomeMult()
      * layoutIncomeBonus()
      * queueIncomeBonus()
      * deliveryIncomeBonus()
      * serviceModeBonus()
      * ratingIncomeBonus()
      * (1 + masteryIncomeBonus())
      * staffIncomeBonus()
      * automationBonus()
      * staffEquipBonus()
      * menuPriceMult()
      * fameMultiplier()
      * empireLevelMultiplier();
  }
  function staffIncomeBonus(){
    let mult = 1;
    if(!state.staff) return 1;
    Object.keys(state.staff).forEach(roleId => {
      const role = STAFF_ROLES.find(r => r.id === roleId);
      const st = state.staff[roleId];
      if(!role || !st) return;
      const lvl = st.level || 1;
      const happy = Math.max(0.2, (st.happiness == null ? 70 : st.happiness) / 100);
      const burnout = (st.happiness == null ? 70 : st.happiness) < CONFIG.STAFF_BURNOUT_THRESHOLD ? 0.7 : 1;
      mult += role.incomeBoost * (0.5 + lvl * 0.15) * happy * burnout;
    });
    const cook = (state.staffSkills && state.staffSkills.cooking) || 0;
    const serv = (state.staffSkills && state.staffSkills.service) || 0;
    mult += cook * 0.02 + serv * 0.015;
    return mult;
  }
  function staffOfflineBonus(){
    const del = (state.staffSkills && state.staffSkills.delivery) || 0;
    const scooters = (state.staffEquip && state.staffEquip.scooters) || 0;
    return 1 + del * 0.03 + scooters * 0.04;
  }
  function staffSalaryMult(){
    const mgmt = (state.staffSkills && state.staffSkills.management) || 0;
    return Math.max(0.4, 1 - mgmt * 0.03);
  }
  function totalStaffLevels(){
    let n = 0;
    if(!state.staff) return 0;
    Object.values(state.staff).forEach(st => { n += st.level || 1; });
    return n;
  }
  function automationBonus(){
    return 1 + (state.automationLevel || 0) * CONFIG.AUTOMATION_INCOME_BOOST;
  }
  function staffEquipBonus(){
    let m = 1;
    const eq = state.staffEquip || {};
    m += (eq.knives || 0) * 0.03;
    m += (eq.uniforms || 0) * 0.02;
    m += (eq.tools || 0) * 0.03;
    return m;
  }
  function businessCost(def, level){ return def.baseCost * Math.pow(CONFIG.COST_GROWTH, level) * researchCostBonus(); }
  function upgradeCost(def, type, level){
    const t = UPGRADE_TYPES[type];
    return def.baseCost * t.costMult * Math.pow(t.costGrowth, level) * researchCostBonus();
  }
  function businessUpgradeMult(b){
    return (1 + b.speed*UPGRADE_TYPES.speed.boost) * (1 + b.capacity*UPGRADE_TYPES.capacity.boost) * (1 + b.quality*UPGRADE_TYPES.quality.boost);
  }
  function businessIncome(def, b){
    return def.baseIncome * b.level * (1 + b.level*CONFIG.LEVEL_INCOME_SCALING) * businessUpgradeMult(b);
  }
  function managerTypeDef(b){
    if(!b || !b.managerType) return null;
    return MANAGER_TYPES.find(t => t.id === b.managerType) || null;
  }
  function businessIncomeWithManager(def, b){
    if(!b.manager) return businessIncome(def, b);
    const level = Math.max(1, b.managerLevel || 1);
    const levelBoost = 1 + (level - 1) * CONFIG.MANAGER_LEVEL_INCOME_BOOST;
    const typeDef = managerTypeDef(b);
    const typeMult = typeDef ? typeDef.incomeMult : CONFIG.MANAGER_INCOME_MULT;
    return businessIncome(def, b) * typeMult * levelBoost;
  }
  // Manager Training (Shards) discounts hiring cost, capped so a maxed line
  // can never make managers free.
  function managerCost(def){ return def.baseCost * CONFIG.MANAGER_COST_MULT * (1 - Math.min(0.8, metaBonus('manager'))) * researchCostBonus(); }
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
      * (1 + activeRecipeBoost('tap'))
      * powerupMult('tap')
      * researchTapBonus();
  }
  function potentialPrestigePoints(){
    return Math.floor(Math.sqrt(state.totalEarned / CONFIG.PRESTIGE_EARNINGS_DIVISOR));
  }
  function fmt(n){
    if(n < 1000) return '¥' + n.toFixed(n < 10 ? 1 : 0);
    const units = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd'];
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
    let research = 0;
    let diamonds = 0;
    if(streakDay % 30 === 0){ miso = 3; research = 5; diamonds = 5; }
    else if(streakDay % 7 === 0){ miso = 1; research = 2; diamonds = 3; }
    else if(streakDay % 3 === 0){ cash *= 1.5; research = 1; }
    else if(streakDay % 5 === 0) research = 1;
    return { cash, miso, research, diamonds };
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
    if(pendingDailyReward.miso > 0) text += ` + ${pendingDailyReward.miso} Miso`;
    if(pendingDailyReward.research > 0) text += ` + ${pendingDailyReward.research} 🔬`;
    if(pendingDailyReward.diamonds > 0) text += ` + ${pendingDailyReward.diamonds} 💎`;
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
    addCountryCash(state.activeCountry, pendingDailyReward.cash);
    addEarned(pendingDailyReward.cash);
    state.prestigePoints += pendingDailyReward.miso || 0;
    if(pendingDailyReward.research) state.researchPoints = (state.researchPoints || 0) + pendingDailyReward.research;
    if(pendingDailyReward.diamonds) earnDiamonds(pendingDailyReward.diamonds);
    // Legacy diamond bonuses kept for non-milestone days
    if(!pendingDailyReward.diamonds){
      if(state.daily.streak % 7 === 0) earnDiamonds(3);
      else if(state.daily.streak % 3 === 0) earnDiamonds(1);
    }
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
    addCountryCash(state.activeCountry, c.reward.cash || 0);
    addEarned(c.reward.cash || 0);
    state.prestigePoints += c.reward.miso || 0;
    if(c.reward.miso) earnDiamonds(2); else earnDiamonds(1);
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
    if(Math.random() < CONFIG.EVENT_TRIGGER_CHANCE + metaBonus('luck') + powerupLuckBonus()){
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
    if(getCountryCash(state.activeCountry) < cost) return;
    if(!spendCountryCash(state.activeCountry, cost)) return;
    adjustReputation(CONFIG.REP_REPAIR_AMOUNT);
    renderStats();
    renderKitchen();
  }

  // ---------- customer orders (GDD Part 5) ----------
  let activeOrder = null; // { typeId, endsAt, startedAt, durationMs, customerName }
  let nextOrderCheck = Date.now() + CONFIG.ORDER_CHECK_INTERVAL_MS;
  let lastReviewToast = 0;

  function patienceMultiplier(){
    // Staff service roles, queue upgrades, and cleanliness extend patience.
    let mult = 1;
    mult += sumLevels(state.queue) * (CONFIG.PATIENCE_QUEUE_BONUS || 0.08);
    const serviceStaff = ['waiter','cashier','cleaner','host'].filter(id => state.staff && state.staff[id]);
    mult += serviceStaff.length * (CONFIG.PATIENCE_STAFF_BONUS || 0.04);
    const clean = Math.max(0, Math.min(100, state.cleanliness || 0)) / 100;
    mult += clean * (CONFIG.PATIENCE_CLEAN_BONUS || 0.15);
    // Express lane slightly reduces wait pressure (more time feel) via queue id
    if(state.queue && state.queue.express) mult += 0.05 * state.queue.express;
    return Math.min(CONFIG.PATIENCE_MAX_MULT || 2.2, mult);
  }

  function loyaltyRewardMult(){
    const pts = state.loyaltyPoints || 0;
    const tier = Math.floor(pts / (CONFIG.LOYALTY_TIER_SIZE || 25));
    return 1 + tier * (CONFIG.LOYALTY_REWARD_PER_TIER || 0.01);
  }

  function satisfactionMult(){
    // High satisfaction slightly boosts order rewards; low satisfaction soft-nerfs them.
    const s = Math.max(CONFIG.SATISFACTION_MIN, Math.min(CONFIG.SATISFACTION_MAX, state.satisfaction || CONFIG.SATISFACTION_START));
    return 0.85 + (s / 100) * 0.30; // 0.85–1.15
  }

  function adjustSatisfaction(delta){
    state.satisfaction = Math.max(
      CONFIG.SATISFACTION_MIN,
      Math.min(CONFIG.SATISFACTION_MAX, (state.satisfaction || CONFIG.SATISFACTION_START) + delta)
    );
  }

  function recordCustomerStat(typeId, field){
    if(!state.customerTypeStats) state.customerTypeStats = {};
    if(!state.customerTypeStats[typeId]) state.customerTypeStats[typeId] = {served:0, missed:0};
    state.customerTypeStats[typeId][field] = (state.customerTypeStats[typeId][field] || 0) + 1;
  }

  function pickCustomerType(){
    const rep = state.reputation || CONFIG.REP_START;
    const rating = typeof restaurantRating === 'function' ? restaurantRating() : 50;
    const vipArea = (state.layout && state.layout.vip) || 0;

    // Special rare rolls first
    if(rating >= 70 && Math.random() < (CONFIG.CELEBRITY_SPAWN_CHANCE || 0.015)){
      return CUSTOMER_TYPES.find(c => c.id === 'celebrity');
    }
    const fameVip = (state.fame || 0) * (CONFIG.FAME_VIP_BONUS || 0.0004);
    if(rep >= 55 && Math.random() < (CONFIG.VIP_SPAWN_CHANCE || 0.06) * (1 + vipArea * 0.15) + fameVip){
      return CUSTOMER_TYPES.find(c => c.id === 'vip');
    }
    // High fame also slightly boosts celebrity chance
    if((state.fame || 0) >= 150 && rating >= 60 && Math.random() < 0.01 + (state.fame || 0) * 0.00005){
      return CUSTOMER_TYPES.find(c => c.id === 'celebrity');
    }
    // Occasional critic order (separate from the timed Critic income event)
    if(rep >= 65 && Math.random() < 0.04){
      return CUSTOMER_TYPES.find(c => c.id === 'critic');
    }

    // Weighted normal pool — tourists scale with reputation / unlocked countries
    const unlocked = (state.unlockedCountries || []).length;
    const pool = CUSTOMER_TYPES.filter(c => !c.special);
    let total = 0;
    const weights = pool.map(c => {
      let w = c.weight || 10;
      if(c.tourist){
        w *= 1 + Math.max(0, (rep - 50) / 50) * (CONFIG.TOURIST_REP_BONUS || 0.12) * 8;
        w *= 1 + Math.max(0, unlocked - 1) * 0.25;
      }
      // Foodies prefer high rating
      if(c.id === 'foodie') w *= 0.6 + (rating / 100) * 0.9;
      // Students more common early
      if(c.id === 'student') w *= Math.max(0.4, 1.4 - unlocked * 0.2);
      total += w;
      return w;
    });
    let roll = Math.random() * total;
    for(let i = 0; i < pool.length; i++){
      roll -= weights[i];
      if(roll <= 0) return pool[i];
    }
    return pool[0];
  }

  function maybeTriggerOrder(){
    if(activeOrder) return;
    if(activeEvent.type === 'inspector') return; // don't stack with inspector taps
    if(Date.now() < nextOrderCheck) return;
    nextOrderCheck = Date.now() + CONFIG.ORDER_CHECK_INTERVAL_MS;

    // Satisfaction, menu price, Michelin traffic, and traffic boosters affect spawn chance
    const sat = (state.satisfaction || CONFIG.SATISFACTION_START) / 100;
    const traffic = (typeof powerupTrafficMult === 'function' ? powerupTrafficMult() : 1)
      * menuPriceTrafficMult()
      * michelinTrafficBonus();
    const chance = (CONFIG.ORDER_TRIGGER_CHANCE || 0.28) * (0.75 + sat * 0.5) * traffic;
    if(Math.random() >= Math.min(0.85, chance)) return;

    const def = pickCustomerType();
    if(!def) return;
    const basePatience = def.patience || CONFIG.ORDER_DURATION_MS;
    const durationMs = Math.round(basePatience * patienceMultiplier());
    const now = Date.now();
    activeOrder = {
      typeId: def.id,
      endsAt: now + durationMs,
      startedAt: now,
      durationMs,
      special: def.special || null
    };
    renderOrderCard();
  }

  function showReviewToast(def, stars, text){
    const now = Date.now();
    if(now - lastReviewToast < 4000) return;
    lastReviewToast = now;
    const toast = document.getElementById('reviewToast');
    if(!toast) return;
    const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    document.getElementById('reviewStars').textContent = starStr;
    document.getElementById('reviewText').textContent = text;
    document.getElementById('reviewWho').textContent = def.name;
    toast.classList.add('show');
    clearTimeout(showReviewToast._t);
    showReviewToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function maybeLeaveReview(def, success, tipBonus){
    if(Math.random() > (CONFIG.REVIEW_CHANCE || 0.22)) return;
    state.reviewsTotal = (state.reviewsTotal || 0) + 1;
    const sat = state.satisfaction || CONFIG.SATISFACTION_START;
    let stars;
    if(!success){
      stars = sat > 60 ? 2 : 1;
      showReviewToast(def, stars, stars === 1 ? 'Waited forever… left hungry.' : 'Service was too slow.');
      return;
    }
    // Positive review spectrum based on satisfaction + tip
    if(sat >= 85 || tipBonus) stars = 5;
    else if(sat >= 70) stars = 4;
    else if(sat >= 50) stars = 3;
    else stars = 2;
    if(stars >= 4){
      state.reviewsPositive = (state.reviewsPositive || 0) + 1;
      adjustFame(CONFIG.FAME_PER_REVIEW || 1.5);
    }
    const lines = {
      5: ['Best ramen in town!', 'Will definitely come back!', 'Absolute perfection.', 'Tell your friends!'],
      4: ['Really solid bowl.', 'Great flavor, nice pace.', 'Happy we stopped by.'],
      3: ['Decent, nothing special.', 'Okay for the price.', 'Might try again.'],
      2: ['Expected more.', 'A bit underwhelming.']
    };
    const pool = lines[stars] || lines[3];
    showReviewToast(def, stars, pool[Math.floor(Math.random() * pool.length)]);
  }

  function fulfillOrder(){
    if(!activeOrder) return;
    const def = CUSTOMER_TYPES.find(c => c.id === activeOrder.typeId) || CUSTOMER_TYPES[0];
    const rate = Math.max(totalRatePerSec(), 0.5);
    const budget = def.budget || 1;
    const gain = (rate * CONFIG.ORDER_REWARD_SECONDS + nextTapGain() * CONFIG.ORDER_REWARD_TAP_MULT)
      * budget * loyaltyRewardMult() * satisfactionMult();

    addCountryCash(state.activeCountry, gain);
    addEarned(gain);
    state.ordersFulfilled = (state.ordersFulfilled || 0) + 1;
    recordCustomerStat(def.id, 'served');

    // Tips & diamonds
    let tipped = false;
    if(Math.random() < (def.tipChance || 0.1)){
      tipped = true;
      const tip = gain * (0.15 + Math.random() * 0.25);
      addCountryCash(state.activeCountry, tip);
      addEarned(tip);
      spawnFloatingGain(tip);
    }
    if(Math.random() < 0.08 + (def.special ? 0.12 : 0)) earnDiamonds(1);

    // Reputation / satisfaction / loyalty
    let repGain = CONFIG.REP_ORDER_GAIN;
    let satGain = CONFIG.SATISFACTION_FULFILL;
    let loyalty = CONFIG.LOYALTY_PER_FULFILL;
    if(def.special === 'vip'){
      repGain += 3;
      satGain += 3;
      loyalty += CONFIG.LOYALTY_VIP_BONUS;
      state.vipServed = (state.vipServed || 0) + 1;
    } else if(def.special === 'celebrity'){
      repGain += 8;
      satGain += 6;
      loyalty += CONFIG.LOYALTY_CELEB_BONUS;
      state.celebritiesServed = (state.celebritiesServed || 0) + 1;
      // Celebrity draws a crowd — brief income feel via floating + extra cash
      const crowd = rate * 8;
      addCountryCash(state.activeCountry, crowd);
      addEarned(crowd);
      spawnFloatingGain(crowd);
    } else if(def.special === 'critic'){
      repGain += 5;
      satGain += 4;
      state.criticEventsSeen = (state.criticEventsSeen || 0) + 1;
    } else if(def.tourist){
      repGain += 1;
      satGain += 1;
    }

    // Fast serve bonus (served with >50% patience remaining)
    const remainFrac = Math.max(0, (activeOrder.endsAt - Date.now()) / activeOrder.durationMs);
    if(remainFrac > 0.5){
      satGain += 1.5;
      repGain += 1;
    }

    adjustReputation(repGain);
    adjustSatisfaction(satGain);
    state.loyaltyPoints = (state.loyaltyPoints || 0) + loyalty;

    // Fame (GDD Part 7)
    let fameGain = CONFIG.FAME_PER_ORDER || 0.4;
    if(def.special === 'vip') fameGain += CONFIG.FAME_PER_VIP || 3;
    if(def.special === 'celebrity') fameGain += CONFIG.FAME_PER_CELEB || 12;
    if(tipped) fameGain += 0.5;
    adjustFame(fameGain);
    // Event tokens (GDD Part 8)
    earnEventTokens(CONFIG.EVENT_TOKEN_PER_ORDER || 0.15);

    spawnFloatingGain(gain);
    fireTapFeedback(false);
    maybeLeaveReview(def, true, tipped);

    activeOrder = null;
    renderOrderCard();
    renderStats();
    if(typeof renderKitchen === 'function') renderKitchen();
    checkAchievements();
  }

  function missOrder(){
    if(!activeOrder) return;
    const def = CUSTOMER_TYPES.find(c => c.id === activeOrder.typeId) || CUSTOMER_TYPES[0];
    playOrderMissSfx();
    let repLoss = CONFIG.REP_ORDER_MISS;
    let satLoss = CONFIG.SATISFACTION_MISS;
    if(def.special === 'vip'){ repLoss += 4; satLoss += 5; }
    else if(def.special === 'celebrity'){ repLoss += 10; satLoss += 12; }
    else if(def.special === 'critic'){ repLoss += 6; satLoss += 8; }
    adjustReputation(-repLoss);
    adjustSatisfaction(-satLoss);
    recordCustomerStat(def.id, 'missed');
    maybeLeaveReview(def, false, false);
    activeOrder = null;
    renderOrderCard();
    renderStats();
    if(typeof renderKitchen === 'function') renderKitchen();
  }

  function renderOrderCard(){
    const el = document.getElementById('orderCard');
    if(!el) return;
    if(!activeOrder){
      el.classList.remove('show', 'order-vip', 'order-celebrity', 'order-critic');
      return;
    }
    const def = CUSTOMER_TYPES.find(c => c.id === activeOrder.typeId) || CUSTOMER_TYPES[0];
    el.classList.add('show');
    el.classList.toggle('order-vip', def.special === 'vip');
    el.classList.toggle('order-celebrity', def.special === 'celebrity');
    el.classList.toggle('order-critic', def.special === 'critic');
    document.getElementById('orderIcon').textContent = def.icon;
    document.getElementById('orderLabel').textContent = def.label;
    const whoEl = document.getElementById('orderWho');
    if(whoEl) whoEl.textContent = def.name;
    document.getElementById('orderFlavor').textContent = def.flavor;
    // Reset patience bar
    const fill = document.getElementById('patienceFill');
    if(fill) fill.style.width = '100%';
  }

  function tickOrder(){
    if(!activeOrder) return;
    const remain = Math.max(0, activeOrder.endsAt - Date.now());
    const timeEl = document.getElementById('orderTime');
    if(timeEl) timeEl.textContent = Math.ceil(remain/1000) + 's';
    const fill = document.getElementById('patienceFill');
    if(fill && activeOrder.durationMs){
      const pct = Math.max(0, Math.min(100, (remain / activeOrder.durationMs) * 100));
      fill.style.width = pct + '%';
      fill.classList.toggle('patience-low', pct < 30);
      fill.classList.toggle('patience-mid', pct >= 30 && pct < 55);
    }
    if(remain <= 0) missOrder();
  }

  // ---------- GDD Part 6: Lucky Wheel + Dynamic Pricing + Economy panel ----------
  function wheelFreeAvailable(){
    return state.wheelLastFreeDate !== todayKey();
  }
  function wheelSpinsLeft(){
    let n = 0;
    if(wheelFreeAvailable()) n += CONFIG.WHEEL_FREE_SPINS_PER_DAY || 1;
    n += state.wheelExtraSpins || 0;
    return n;
  }
  function pickWheelPrize(){
    const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let roll = Math.random() * total;
    for(const p of WHEEL_PRIZES){
      roll -= p.weight;
      if(roll <= 0) return p;
    }
    return WHEEL_PRIZES[0];
  }
  function grantWheelPrize(prize){
    const rate = Math.max(totalRatePerSec(), 1);
    let msg = prize.label;
    if(prize.kind === 'cashSec'){
      const gain = rate * prize.amount;
      addCountryCash(state.activeCountry, gain);
      addEarned(gain);
      spawnFloatingGain(gain);
      msg = `+${fmt(gain)} cash`;
    } else if(prize.kind === 'diamonds'){
      earnDiamonds(prize.amount);
      msg = `+${prize.amount} 💎`;
    } else if(prize.kind === 'research'){
      state.researchPoints = (state.researchPoints || 0) + prize.amount;
      msg = `+${prize.amount} 🔬 Research`;
    } else if(prize.kind === 'ingredient'){
      const ids = Object.keys(typeof INGREDIENTS !== 'undefined' ? INGREDIENTS : {}).length
        ? Object.keys(INGREDIENTS)
        : ['noodles','broth','egg','nori','spice'];
      // Prefer common ingredient ids used in the game
      const pool = ['noodles','broth','egg','nori','spice','mushroom','basil','seafood'].filter(id => true);
      for(let i = 0; i < prize.amount; i++){
        const id = pool[Math.floor(Math.random() * pool.length)];
        if(typeof addIngredient === 'function') addIngredient(id, 1);
      }
      msg = `+${prize.amount} ingredients`;
    } else if(prize.kind === 'booster'){
      // Grant a short free double-income boost
      if(!state.activePowerups) state.activePowerups = {};
      const ends = Date.now() + 5 * 60 * 1000;
      state.activePowerups.double_income = Math.max(state.activePowerups.double_income || 0, ends);
      msg = 'Free 5 min Double Income!';
    } else if(prize.kind === 'loyalty'){
      state.loyaltyPoints = (state.loyaltyPoints || 0) + prize.amount;
      msg = `+${prize.amount} ❤️ Loyalty`;
    }
    return msg;
  }
  function spinLuckyWheel(paid){
    if(paid){
      const cost = CONFIG.WHEEL_EXTRA_SPIN_DIAMOND_COST || 8;
      if((state.diamonds || 0) < cost){ playErrorSfx(); return null; }
      state.diamonds -= cost;
    } else {
      if(!wheelFreeAvailable() && !(state.wheelExtraSpins > 0)){ playErrorSfx(); return null; }
      if(wheelFreeAvailable()){
        state.wheelLastFreeDate = todayKey();
      } else {
        state.wheelExtraSpins = Math.max(0, (state.wheelExtraSpins || 0) - 1);
      }
    }
    const prize = pickWheelPrize();
    const msg = grantWheelPrize(prize);
    state.wheelSpins = (state.wheelSpins || 0) + 1;
    playBuySfx();
    save();
    renderStats();
    renderEconomy();
    renderPowerups();
    checkAchievements();
    return { prize, msg };
  }
  function setMenuPrice(val){
    const step = CONFIG.MENU_PRICE_STEP || 0.1;
    const min = CONFIG.MENU_PRICE_MIN || 0.6;
    const max = CONFIG.MENU_PRICE_MAX || 1.8;
    let p = Math.round(val / step) * step;
    p = Math.max(min, Math.min(max, p));
    state.menuPrice = Math.round(p * 10) / 10;
    // Soft satisfaction nudge when changing price
    if(state.menuPrice >= 1.4) adjustSatisfaction(-0.5);
    else if(state.menuPrice <= 0.8) adjustSatisfaction(0.3);
    save();
    renderStats();
    renderEconomy();
    checkAchievements();
  }
  function renderEconomy(){
    const panel = document.getElementById('economyPanel');
    if(!panel || !panel.classList.contains('active')) return;
    const price = menuPriceMult();
    const traffic = menuPriceTrafficMult();
    const trafficBoost = typeof powerupTrafficMult === 'function' ? powerupTrafficMult() : 1;
    let html = '';

    // Currencies overview
    html += `<div class="chal-section-label">Currencies</div>`;
    html += `<div class="rep-panel-card">
      <div style="display:flex; flex-wrap:wrap; gap:10px 16px; font-size:12.5px;">
        <span>💴 Cash <b>${fmt(getCountryCash(state.activeCountry))}</b></span>
        <span>💎 Diamonds <b>${Math.floor(state.diamonds||0)}</b></span>
        <span>🔬 Research <b>${Math.floor(state.researchPoints||0)}</b></span>
        <span>⭐ Miso <b>${Math.floor(state.prestigePoints||0)}</b></span>
        <span>❤️ Loyalty <b>${Math.floor(state.loyaltyPoints||0)}</b></span>
      </div>
      <p class="rep-hint">Cash upgrades shops. Diamonds buy boosters. Research unlocks permanent tree. Miso is prestige. Loyalty boosts order rewards.</p>
    </div>`;

    // Dynamic pricing
    html += `<div class="chal-section-label" style="margin-top:16px;">Menu Pricing</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-panel-top">
        <span class="rep-panel-score">${price.toFixed(1)}×</span>
        <span class="rep-panel-mult">Income ×${price.toFixed(2)} · Traffic ×${traffic.toFixed(2)}</span>
      </div>
      <input type="range" id="menuPriceSlider" min="${CONFIG.MENU_PRICE_MIN}" max="${CONFIG.MENU_PRICE_MAX}" step="${CONFIG.MENU_PRICE_STEP}" value="${price}"
        style="width:100%; margin:10px 0 6px; accent-color:var(--gold);">
      <div style="display:flex; justify-content:space-between; font-size:10.5px; opacity:0.7;">
        <span>Budget (busy)</span><span>Balanced</span><span>Premium (rich)</span>
      </div>
      <p class="rep-hint">Higher prices earn more per bowl but fewer customers visit. Lower prices pack the house.</p>
    </div>`;

    // Lucky Wheel
    const free = wheelFreeAvailable();
    const left = wheelSpinsLeft();
    const spinCost = CONFIG.WHEEL_EXTRA_SPIN_DIAMOND_COST || 8;
    html += `<div class="chal-section-label" style="margin-top:16px;">Lucky Wheel</div>`;
    html += `<div class="rep-panel-card wheel-card">
      <div class="wheel-visual" id="wheelVisual" aria-hidden="true">🎡</div>
      <div class="wheel-result" id="wheelResult">${left ? 'Spin for a prize!' : 'Come back tomorrow for a free spin'}</div>
      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="modal-btn" id="wheelSpinBtn" ${left ? '' : 'disabled'}>${free ? 'Free Spin' : (state.wheelExtraSpins > 0 ? 'Spin' : 'No spins left')}</button>
        <button class="modal-btn secondary" id="wheelBuySpinBtn" ${(state.diamonds||0) >= spinCost ? '' : 'disabled'}>+1 Spin · 💎${spinCost}</button>
      </div>
      <p class="rep-hint">Lifetime daily spin. Extra spins cost diamonds. Prizes: cash, gems, research, ingredients, boosters, loyalty. Spins: ${state.wheelSpins||0}</p>
    </div>`;

    // Boosters (mirror of prestige panel, quick access)
    html += `<div class="chal-section-label" style="margin-top:16px;">Boosters</div>`;
    html += `<div id="economyPowerupsList"></div>`;
    html += `<p class="rep-hint" style="margin-top:6px;">Traffic boost +${Math.round((trafficBoost-1)*100)}% customer orders while active.</p>`;

    panel.innerHTML = html;

    // Wire slider
    const slider = document.getElementById('menuPriceSlider');
    if(slider){
      slider.addEventListener('input', () => {
        // Live preview only
        const v = parseFloat(slider.value);
        const multEl = slider.parentElement.querySelector('.rep-panel-score');
        if(multEl) multEl.textContent = v.toFixed(1) + '×';
      });
      slider.addEventListener('change', () => setMenuPrice(parseFloat(slider.value)));
    }
    const spinBtn = document.getElementById('wheelSpinBtn');
    if(spinBtn) spinBtn.addEventListener('click', () => {
      const res = spinLuckyWheel(false);
      if(res){
        const el = document.getElementById('wheelResult');
        if(el) el.textContent = res.prize.icon + ' ' + res.msg;
        const vis = document.getElementById('wheelVisual');
        if(vis){ vis.classList.remove('spinning'); void vis.offsetWidth; vis.classList.add('spinning'); }
      }
    });
    const buyBtn = document.getElementById('wheelBuySpinBtn');
    if(buyBtn) buyBtn.addEventListener('click', () => {
      const cost = CONFIG.WHEEL_EXTRA_SPIN_DIAMOND_COST || 8;
      if((state.diamonds || 0) < cost){ playErrorSfx(); return; }
      state.diamonds -= cost;
      state.wheelExtraSpins = (state.wheelExtraSpins || 0) + 1;
      playBuySfx();
      save();
      renderEconomy();
      renderStats();
    });

    // Render powerups into economy list
    const list = document.getElementById('economyPowerupsList');
    if(list){
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
            <div class="ach-reward">${active ? 'Active · ' + remain + 's left' : '💎 ' + def.cost}</div>
          </div>
          <button class="claim-btn" data-action="buy-powerup" data-id="${def.id}" ${canBuy ? '' : 'disabled'}>${active ? 'Active' : 'Buy'}</button>`;
        list.appendChild(card);
      });
    }
  }

  // ---------- crafting / ingredients ----------
  function ingredientCount(id){ return (state.ingredients && state.ingredients[id]) || 0; }
  function storageCapacity(){
    return CONFIG.STORAGE_BASE + (state.storageLevel || 0) * CONFIG.STORAGE_PER_LEVEL;
  }
  function addIngredient(id, n){
    if(!state.ingredients) state.ingredients = {};
    const cap = storageCapacity();
    const cur = state.ingredients[id] || 0;
    const add = Math.min(n || 1, Math.max(0, cap - cur));
    if(add <= 0) return 0;
    state.ingredients[id] = cur + add;
    // Quality roll
    if(Math.random() < CONFIG.INGREDIENT_QUALITY_CHANCE){
      const qIdx = Math.min(INGREDIENT_QUALITIES.length - 1, 1 + Math.floor(Math.random() * 3));
      if(!state.ingredientQuality) state.ingredientQuality = {};
      state.ingredientQuality[id] = Math.max(state.ingredientQuality[id] || 0, qIdx);
    }
    return add;
  }
  function tryDropIngredient(countryId){
    if(Math.random() > CONFIG.INGREDIENT_DROP_CHANCE) return null;
    const pool = INGREDIENTS.filter(ing => {
      if(ing.rare) return false;
      return ing.country === countryId && isUnlocked(ing.country);
    });
    if(!pool.length) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if(addIngredient(pick.id, 1) > 0) return pick;
    return null;
  }
  function recipeUnlocked(recipe){
    if(!recipe) return false;
    const u = recipe.unlock || {};
    if(u.country && !isUnlocked(u.country)) return false;
    if(u.prestige && (state.prestigeCount || 0) < u.prestige) return false;
    if(u.michelin && (state.michelinStars || 0) < u.michelin) return false;
    if(u.secret){
      // Secret recipes unlock after enough prestige + having crafted 5+ normal recipes
      if((state.prestigeCount || 0) < (u.prestige || 4)) return false;
      if((state.recipesCrafted || 0) < 5) return false;
    }
    if(u.seasonal){
      // Seasonal recipes available if player has unlocked that seasonal skin or always during "season"
      // For simplicity: unlock once any seasonal skin is owned, or always show as locked with label
      const hasSeasonal = state.seasonal && state.seasonal.skinUnlocked && Object.keys(state.seasonal.skinUnlocked).length > 0;
      if(!hasSeasonal && (state.prestigeCount || 0) < 1) return false;
    }
    return true;
  }
  function masteryTier(recipeId){
    const count = (state.recipeMastery && state.recipeMastery[recipeId]) || 0;
    const thresholds = CONFIG.RECIPE_MASTERY_THRESHOLDS;
    let tier = 0;
    for(let i = 0; i < thresholds.length; i++){
      if(count >= thresholds[i]) tier = i;
    }
    return tier;
  }
  function masteryIncomeBonus(){
    let bonus = 0;
    RECIPES.forEach(r => {
      const tier = masteryTier(r.id);
      bonus += CONFIG.RECIPE_MASTERY_INCOME[tier] || 0;
    });
    return bonus;
  }
  function recipeDurationMs(recipe){
    const up = (state.recipeUpgrades && state.recipeUpgrades[recipe.id]) || {};
    const speedLv = up.speed || 0;
    // Each speed upgrade shortens duration by 5%, min 40% of base
    return CONFIG.RECIPE_DURATION_MS * Math.max(0.4, 1 - speedLv * 0.05);
  }
  function recipeBoostMult(recipe){
    const up = (state.recipeUpgrades && state.recipeUpgrades[recipe.id]) || {};
    const priceLv = up.price || 0;
    const popLv = up.popularity || 0;
    const qualityBonus = 1; // reserved for quality ingredient bonus
    return (1 + priceLv * 0.05 + popLv * 0.03) * qualityBonus;
  }
  function canCraft(recipe){
    if(!recipeUnlocked(recipe)) return false;
    return Object.keys(recipe.cost).every(id => ingredientCount(id) >= recipe.cost[id]);
  }
  function craftRecipe(recipeId){
    const recipe = RECIPES.find(r => r.id === recipeId);
    if(!recipe || !canCraft(recipe)) return;
    if(state.activeRecipe && state.activeRecipe.endsAt > Date.now()) return; // one at a time
    Object.keys(recipe.cost).forEach(id => {
      state.ingredients[id] -= recipe.cost[id];
    });
    const duration = recipeDurationMs(recipe);
    const mult = recipeBoostMult(recipe);
    state.activeRecipe = { id: recipe.id, endsAt: Date.now() + duration, mult };
    state.recipesCrafted = (state.recipesCrafted || 0) + 1;
    if(!state.recipeMastery) state.recipeMastery = {};
    state.recipeMastery[recipe.id] = (state.recipeMastery[recipe.id] || 0) + CONFIG.RECIPE_MASTERY_PER_CRAFT;
    if(recipe.rarity === 'secret'){
      if(!state.secretsCrafted) state.secretsCrafted = {};
      state.secretsCrafted[recipe.id] = true;
    }
    if(recipe.boost.rep) adjustReputation(Math.round(recipe.boost.rep * mult));
    playBuySfx && playBuySfx();
    renderKitchen();
    renderStats();
    checkAchievements();
  }
  function upgradeRecipeStat(recipeId, stat){
    const recipe = RECIPES.find(r => r.id === recipeId);
    if(!recipe || !recipeUnlocked(recipe)) return;
    if(!state.recipeUpgrades) state.recipeUpgrades = {};
    if(!state.recipeUpgrades[recipeId]) state.recipeUpgrades[recipeId] = {price:0, speed:0, popularity:0};
    const cur = state.recipeUpgrades[recipeId][stat] || 0;
    if(cur >= CONFIG.RECIPE_UPGRADE_MAX) return;
    // Cost: spend first required ingredient
    const ingId = Object.keys(recipe.cost)[0];
    const need = CONFIG.RECIPE_UPGRADE_COST_BASE + cur;
    if(ingredientCount(ingId) < need){ playErrorSfx(); return; }
    state.ingredients[ingId] -= need;
    state.recipeUpgrades[recipeId][stat] = cur + 1;
    playBuySfx();
    save();
    renderKitchen();
    checkAchievements();
  }
  function upgradeStorage(){
    const lvl = state.storageLevel || 0;
    if(lvl >= CONFIG.STORAGE_MAX_LEVEL) return;
    const cost = CONFIG.STORAGE_UPGRADE_COST * Math.pow(CONFIG.STORAGE_COST_GROWTH, lvl) * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.storageLevel = lvl + 1;
    save();
    renderKitchen();
    checkAchievements();
  }
  function orderFromSupplier(supplierId){
    const sup = SUPPLIERS.find(s => s.id === supplierId);
    if(!sup) return;
    if((state.unlockedCountries || []).length < sup.unlockCountries){ playErrorSfx(); return; }
    if(state.supplierCooldownUntil && state.supplierCooldownUntil > Date.now()){ playErrorSfx(); return; }
    // Pick ingredients
    let pool = INGREDIENTS.filter(ing => {
      if(sup.rareOnly) return !!ing.rare;
      if(ing.rare) return false;
      if(sup.country) return ing.country === sup.country;
      return isUnlocked(ing.country);
    });
    if(!pool.length) pool = INGREDIENTS.filter(ing => !ing.rare && isUnlocked(ing.country));
    if(!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const unitPrice = 50 * Math.pow(1.15, state.prestigeCount || 0);
    const totalCost = unitPrice * sup.qty * sup.priceMult * researchCostBonus();
    if(getCountryCash(state.activeCountry) < totalCost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, totalCost)){ playErrorSfx(); return; }
    const added = addIngredient(pick.id, sup.qty);
    state.supplierCooldownUntil = Date.now() + CONFIG.SUPPLIER_ORDER_COOLDOWN_MS;
    state.supplierOrders = (state.supplierOrders || 0) + 1;
    if(sup.rareOnly && pick.rare){
      if(!state.ingredientQuality) state.ingredientQuality = {};
      state.ingredientQuality[pick.id] = Math.max(state.ingredientQuality[pick.id] || 0, 3);
    }
    playBuySfx();
    save();
    renderKitchen();
    renderStats();
    checkAchievements();
    return {pick, added, totalCost};
  }
  function tickRecipe(){
    if(state.activeRecipe && state.activeRecipe.endsAt <= Date.now()){
      state.activeRecipe = null;
      renderKitchen();
      renderStats();
    }
  }
  // Kitchen panel now has 6 sub-sections instead of one long scroll —
  // pick a default and remember the user's last choice between renders.
  // Kitchen features now live as separate entries in the More sheet
  // (Overview / Ingredients / Recipes / Stations / Staff / Facility)
  // instead of being crammed inside one Kitchen tab.
  function renderKitchen(){
    renderKitchenOverview();
    renderKitchenIngredients();
    renderKitchenRecipes();
    renderKitchenStations();
    renderKitchenStaff();
    renderKitchenFacility();
  }

  function renderKitchenOverview(){
    const panel = document.getElementById('kitchenOverviewPanel');
    if(!panel || !panel.classList.contains('active')) return;
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
        <button class="modal-btn" id="repairRepBtn" ${rep >= CONFIG.REP_MAX || getCountryCash(state.activeCountry) < repairCost ? 'disabled' : ''}>
          Polish Reputation · ${fmt(repairCost)}
        </button>
      </div>`;

    // ---- Restaurant Rating (GDD Part 2) ----
    const rating = restaurantRating();
    html += `<div class="chal-section-label" style="margin-top:16px;">Restaurant Rating · ${rating}/100</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-track big"><div class="rep-fill" style="width:${rating}%"></div></div>
      <p class="rep-hint">Food quality, stations, cleanliness, layout, reputation & Michelin stars. +${(rating * CONFIG.RATING_INCOME_PER_POINT * 100).toFixed(1)}% income.</p>
    </div>`;

    // ---- Progression (GDD Part 7) ----
    const stage = currentJourneyStage();
    const elvl = empireLevel();
    const fame = Math.floor(state.fame || 0);
    const famePct = Math.min(100, (fame / (CONFIG.FAME_MAX || 1000)) * 100);
    html += `<div class="chal-section-label" style="margin-top:16px;">Progression</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-panel-top">
        <span class="rep-panel-score">${stage.icon} ${stage.name}</span>
        <span class="rep-panel-mult">Empire Lv ${elvl} · +${Math.round((empireLevelMultiplier()-1)*100)}% income</span>
      </div>
      <div class="rep-panel-top" style="margin-top:8px;">
        <span>📣 Fame ${fame}/${CONFIG.FAME_MAX || 1000}</span>
        <span class="rep-panel-mult">+${Math.round((fameMultiplier()-1)*100)}% income</span>
      </div>
      <div class="rep-track big"><div class="rep-fill" style="width:${famePct}%; background:linear-gradient(90deg,#7c5cbf,#c4b5fd);"></div></div>
      <p class="rep-hint">Fame rises from orders, VIPs, celebs, reviews, Michelin stars & city unlocks. Higher fame attracts more VIP/celebrity guests. Empire Level grows with total shop levels.</p>
    </div>`;

    // ---- Customer System (GDD Part 5) ----
    const sat = Math.round(state.satisfaction || CONFIG.SATISFACTION_START);
    const loyalty = state.loyaltyPoints || 0;
    const loyaltyTier = Math.floor(loyalty / (CONFIG.LOYALTY_TIER_SIZE || 25));
    const loyaltyBonusPct = Math.round(loyaltyTier * (CONFIG.LOYALTY_REWARD_PER_TIER || 0.01) * 100);
    const reviewsPos = state.reviewsPositive || 0;
    const reviewsTot = state.reviewsTotal || 0;
    const vipN = state.vipServed || 0;
    const celebN = state.celebritiesServed || 0;
    html += `<div class="chal-section-label" style="margin-top:16px;">Customers</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-panel-top">
        <span class="rep-panel-score">😊 ${sat}/100</span>
        <span class="rep-panel-mult">Satisfaction</span>
      </div>
      <div class="rep-track big"><div class="rep-fill" style="width:${Math.max(0,Math.min(100,sat))}%; background:linear-gradient(90deg,#5ecf8a,#c9e265);"></div></div>
      <div style="display:flex; flex-wrap:wrap; gap:8px 14px; margin-top:10px; font-size:11.5px;">
        <span>❤️ Loyalty <b>${loyalty}</b> (Tier ${loyaltyTier}${loyaltyBonusPct ? ` · +${loyaltyBonusPct}% orders` : ''})</span>
        <span>⭐ Reviews <b>${reviewsPos}</b>/${reviewsTot}</span>
        <span>💎 VIP <b>${vipN}</b></span>
        <span>🌟 Celebs <b>${celebN}</b></span>
      </div>
      <p class="rep-hint">Serve quickly to raise satisfaction. VIPs, tourists & celebrities pay more. Queue upgrades & staff extend patience. Loyalty tiers boost order rewards.</p>
    </div>`;

    // ---- Michelin Challenge (GDD) ----
    html += `<div class="chal-section-label" style="margin-top:16px;">Michelin Stars · ${'⭐'.repeat(state.michelinStars||0)}${'☆'.repeat(Math.max(0, CONFIG.MICHELIN_MAX_STARS - (state.michelinStars||0)))}</div>`;
    if((state.michelinStars||0) >= CONFIG.MICHELIN_MAX_STARS){
      html += `<p class="rep-hint">Three-star empire! +${Math.round(CONFIG.MICHELIN_INCOME_PER_STAR*CONFIG.MICHELIN_MAX_STARS*100)}% permanent income.</p>`;
    } else if(state.michelinChallenge){
      const ch = state.michelinChallenge;
      const pct = Math.min(100, Math.floor((ch.earned / ch.targetCash) * 100));
      const left = Math.max(0, Math.ceil((ch.durationMs - (Date.now() - ch.startedAt)) / 1000));
      html += `<div class="rep-panel-card"><div class="rep-panel-top"><span>Challenge in progress</span><span>${pct}% · ${left}s</span></div>
        <div class="rep-track big"><div class="rep-fill" style="width:${pct}%"></div></div>
        <p class="rep-hint">Earn ${fmt(ch.targetCash)} before time runs out.</p></div>`;
    } else {
      const canStart = (state.reputation||0) >= CONFIG.MICHELIN_REP_REQ;
      html += `<p class="rep-hint">Need ${CONFIG.MICHELIN_REP_REQ}+ reputation. Earn a huge cash burst in 2 minutes for a permanent star (+${Math.round(CONFIG.MICHELIN_INCOME_PER_STAR*100)}% income each).</p>
        <button class="modal-btn" data-action="michelin-start" ${canStart ? '' : 'disabled'}>Begin Michelin Challenge</button>`;
    }

    // ---- Legendary Chefs (GDD) ----
    unlockAvailableChefs();
    html += `<div class="chal-section-label" style="margin-top:16px;">Legendary Chefs</div>`;
    LEGENDARY_CHEFS.forEach(c => {
      const owned = !!(state.chefsOwned && state.chefsOwned[c.id]);
      const equipped = state.equippedChef === c.id;
      const locked = !owned && (state.prestigeCount||0) < c.unlockPrestige;
      let action = '';
      if(locked) action = `<button class="claim-btn" disabled>Prestige ${c.unlockPrestige}</button>`;
      else if(!owned) action = `<button class="claim-btn" disabled>Locked</button>`;
      else if(!equipped) action = `<button class="claim-btn" data-action="equip-chef" data-id="${c.id}">Equip</button>`;
      else {
        const now = Date.now();
        const onCd = state.chefSkillCooldownUntil > now;
        const active = state.chefSkillEndsAt > now;
        if(active) action = `<button class="claim-btn" disabled>Active…</button>`;
        else if(onCd) action = `<button class="claim-btn" disabled>Cooldown</button>`;
        else action = `<button class="claim-btn" data-action="chef-skill">Use Skill</button>`;
      }
      html += `<div class="recipe-card${locked ? ' dim' : ''}">
        <div class="recipe-icon">${c.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${c.name}${equipped ? ' ★' : ''}</div>
          <div class="recipe-desc">${c.desc} · ${c.skillLabel}</div>
        </div>
        ${action}
      </div>`;
    });

    
    panel.innerHTML = html;
    const repairBtn = document.getElementById('repairRepBtn');
    if(repairBtn) repairBtn.addEventListener('click', repairReputation);
  }

  function renderKitchenIngredients(){
    const panel = document.getElementById('kitchenIngredientsPanel');
    if(!panel || !panel.classList.contains('active')) return;
    let html = '';
    const cap = storageCapacity();
    const storCost = CONFIG.STORAGE_UPGRADE_COST * Math.pow(CONFIG.STORAGE_COST_GROWTH, state.storageLevel || 0) * researchCostBonus();
    html += `<div class="chal-section-label">Ingredients · cap ${cap}/stack · storage Lv${state.storageLevel||0}</div>`;
    html += `<button class="modal-btn" data-action="upgrade-storage" style="margin-bottom:8px;" ${(state.storageLevel||0) >= CONFIG.STORAGE_MAX_LEVEL || getCountryCash(state.activeCountry) < storCost ? 'disabled' : ''}>Expand Storage · ${(state.storageLevel||0) >= CONFIG.STORAGE_MAX_LEVEL ? 'MAX' : fmt(storCost)}</button>`;
    html += `<div class="ing-grid">`;
    INGREDIENTS.forEach(ing => {
      const locked = !isUnlocked(ing.country);
      const count = ingredientCount(ing.id);
      const qIdx = (state.ingredientQuality && state.ingredientQuality[ing.id]) || 0;
      const q = INGREDIENT_QUALITIES[qIdx];
      html += `<div class="ing-chip${locked ? ' locked' : ''}${count ? ' has' : ''}" title="${ing.name}${ing.rare ? ' (rare)' : ''} · ${q.name}">
        <span class="ing-icon">${ing.icon}</span>
        <span class="ing-count">${locked ? '🔒' : count}</span>
        <span class="ing-name">${q.icon} ${ing.name}</span>
      </div>`;
    });
    html += `</div>`;

    // ---- Supply chain ----
    html += `<div class="chal-section-label" style="margin-top:14px;">Supply Chain</div>`;
    html += `<p class="rep-hint">Order bulk ingredients from world suppliers (60s cooldown).</p>`;
    const onCd = state.supplierCooldownUntil && state.supplierCooldownUntil > Date.now();
    SUPPLIERS.forEach(sup => {
      const unlocked = (state.unlockedCountries || []).length >= sup.unlockCountries;
      const unitPrice = 50 * Math.pow(1.15, state.prestigeCount || 0);
      const totalCost = unitPrice * sup.qty * sup.priceMult;
      html += `<div class="recipe-card${!unlocked || onCd ? ' dim' : ''}">
        <div class="recipe-icon">${sup.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${sup.name}</div>
          <div class="recipe-desc">${sup.qty}× ingredients · ${Math.round(sup.priceMult*100)}% market price${sup.rareOnly ? ' · rare only' : ''}</div>
        </div>
        <button class="claim-btn" data-action="supplier" data-id="${sup.id}" ${!unlocked || onCd || getCountryCash(state.activeCountry) < totalCost ? 'disabled' : ''}>${onCd ? 'Cooldown' : !unlocked ? 'Locked' : fmt(totalCost)}</button>
      </div>`;
    });

    
    panel.innerHTML = html;
  }

  function renderKitchenRecipes(){
    const panel = document.getElementById('kitchenRecipesPanel');
    if(!panel || !panel.classList.contains('active')) return;
    let html = '';
    html += `<div class="chal-section-label">Signature Ramen</div>`;
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

    html += `<div class="chal-section-label" style="margin-top:14px;">Recipes & Mastery</div>`;
    html += `<p class="rep-hint">Craft for temporary boosts. Mastery grants permanent income. Upgrade price/speed/popularity with ingredients.</p>`;
    RECIPES.forEach(recipe => {
      const unlocked = recipeUnlocked(recipe);
      const ok = canCraft(recipe);
      const busy = state.activeRecipe && state.activeRecipe.endsAt > Date.now();
      const tier = masteryTier(recipe.id);
      const crafts = (state.recipeMastery && state.recipeMastery[recipe.id]) || 0;
      const up = (state.recipeUpgrades && state.recipeUpgrades[recipe.id]) || {price:0, speed:0, popularity:0};
      const costParts = Object.keys(recipe.cost).map(id => {
        const ing = INGREDIENTS.find(i => i.id === id);
        const have = ingredientCount(id);
        const need = recipe.cost[id];
        return `<span class="${have >= need ? 'have' : 'need'}">${ing ? ing.icon : '?'} ${have}/${need}</span>`;
      }).join(' ');
      let lockHint = '';
      if(!unlocked){
        const u = recipe.unlock || {};
        if(u.country && !isUnlocked(u.country)) lockHint = `Unlock ${u.country}`;
        else if(u.michelin) lockHint = `Need ${u.michelin}★ Michelin`;
        else if(u.secret) lockHint = `Secret · Prestige ${u.prestige||4}`;
        else if(u.seasonal) lockHint = `Seasonal · ${u.seasonal}`;
        else if(u.prestige) lockHint = `Prestige ${u.prestige}`;
        else lockHint = 'Locked';
      }
      html += `<div class="recipe-card${!unlocked || !ok || busy ? ' dim' : ''}">
        <div class="recipe-icon" aria-hidden="true">${recipe.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${recipe.name} <small>(${recipe.rarity||'common'})</small></div>
          <div class="recipe-desc">${recipe.desc}</div>
          <div class="recipe-cost">${costParts}</div>
          <div class="recipe-desc">Mastery: ${RECIPE_MASTERY_NAMES[tier]} (${crafts}) · Upgrades P${up.price||0}/S${up.speed||0}/Pop${up.popularity||0}</div>
        </div>
        ${unlocked
          ? `<button class="claim-btn" data-action="craft" data-id="${recipe.id}" ${!ok || busy ? 'disabled' : ''}>Craft</button>`
          : `<button class="claim-btn" disabled>${lockHint}</button>`}
      </div>`;
      if(unlocked){
        const ingId = Object.keys(recipe.cost)[0];
        ['price','speed','popularity'].forEach(stat => {
          const cur = up[stat] || 0;
          const need = CONFIG.RECIPE_UPGRADE_COST_BASE + cur;
          const maxed = cur >= CONFIG.RECIPE_UPGRADE_MAX;
          html += `<div style="display:flex;gap:6px;margin:2px 0 6px 48px;align-items:center;font-size:12px;">
            <span style="min-width:70px;text-transform:capitalize;">${stat}</span>
            <button class="claim-btn" data-action="recipe-upgrade" data-id="${recipe.id}" data-stat="${stat}" ${maxed || ingredientCount(ingId) < need ? 'disabled' : ''} style="padding:4px 8px;">
              ${maxed ? 'MAX' : `+1 (${need}×)`}
            </button>
          </div>`;
        });
      }
    });

    
    panel.innerHTML = html;
  }

  function renderKitchenStations(){
    const panel = document.getElementById('kitchenStationsPanel');
    if(!panel || !panel.classList.contains('active')) return;
    let html = '';
    html += `<div class="chal-section-label">Cooking Stations</div>`;
    html += `<p class="rep-hint">Upgrade production lines for permanent empire-wide income (+${Math.round(CONFIG.STATION_INCOME_BOOST*100)}% per level).</p>`;
    COOKING_STATIONS.forEach(st => {
      const lvl = (state.stations && state.stations[st.id]) || 0;
      const cost = stationCost(st.id);
      const maxed = lvl >= CONFIG.STATION_MAX_LEVEL;
      html += `<div class="recipe-card">
        <div class="recipe-icon">${st.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${st.name} · Lv${lvl}</div>
          <div class="recipe-desc">${st.desc}</div>
        </div>
        <button class="claim-btn" data-action="station" data-id="${st.id}" ${maxed || getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>${maxed ? 'MAX' : fmt(cost)}</button>
      </div>`;
    });

    html += `<div class="chal-section-label" style="margin-top:16px;">Research · ${state.researchPoints||0} pts</div>`;
    html += `<p class="rep-hint">Earn research points from Prestige and milestones. Permanent empire bonuses.</p>`;
    RESEARCH_BRANCHES.forEach(br => {
      const lvl = researchLevel(br.id);
      const cost = researchUpgradeCost(br.id);
      const maxed = lvl >= CONFIG.RESEARCH_MAX_LEVEL;
      html += `<div class="recipe-card">
        <div class="recipe-icon">${br.icon}</div>
        <div class="recipe-info">
          <div class="recipe-name">${br.name} · Lv${lvl}</div>
          <div class="recipe-desc">${br.desc}</div>
        </div>
        <button class="claim-btn" data-action="research" data-id="${br.id}" ${maxed || (state.researchPoints||0) < cost ? 'disabled' : ''}>${maxed ? 'MAX' : cost + ' pts'}</button>
      </div>`;
    });

    html += `<div class="chal-section-label" style="margin-top:16px;">Kitchen Workflow</div>`;
    html += `<p class="rep-hint">Order → Noodles → Broth → Toppings → Quality → Serve. Upgrade Cooking Stations above to speed each stage.</p>`;
    html += `<div class="ing-grid">`;
    WORKFLOW_STAGES.forEach(w => {
      html += `<div class="ing-chip has" title="${w.name}"><span class="ing-icon">${w.icon}</span><span class="ing-name">${w.name}</span></div>`;
    });
    html += `</div>`;

    const autoLv = state.automationLevel || 0;
    const autoCost = CONFIG.AUTOMATION_BASE_COST * Math.pow(CONFIG.AUTOMATION_COST_GROWTH, autoLv);
    html += `<div class="chal-section-label" style="margin-top:16px;">Automation · Lv${autoLv}</div>`;
    html += `<p class="rep-hint">AI managers handle routine work. +${Math.round(CONFIG.AUTOMATION_INCOME_BOOST*100)}% income/level and less burnout.</p>`;
    html += `<button class="modal-btn" data-action="automation" ${autoLv >= CONFIG.AUTOMATION_MAX_LEVEL || getCountryCash(state.activeCountry) < autoCost ? 'disabled' : ''}>${autoLv >= CONFIG.AUTOMATION_MAX_LEVEL ? 'MAX Automation' : 'Upgrade Automation · '+fmt(autoCost)}</button>`;

    
    panel.innerHTML = html;
  }

  function renderKitchenStaff(){
    const panel = document.getElementById('kitchenStaffPanel');
    if(!panel || !panel.classList.contains('active')) return;
    let html = '';
    html += `<div class="chal-section-label">Staff Roster</div>`;
    html += `<p class="rep-hint">Hire empire staff. Happy workers earn more; burnout hurts. Salaries scale with levels.</p>`;
    STAFF_ROLES.forEach(role => {
      const hired = state.staff && state.staff[role.id];
      if(!hired){
        const cost = role.hireCost * researchCostBonus();
        html += `<div class="recipe-card"><div class="recipe-icon">${role.icon}</div><div class="recipe-info"><div class="recipe-name">${role.name}</div><div class="recipe-desc">${role.desc} · +${Math.round(role.incomeBoost*100)}%/lvl</div></div>
          <button class="claim-btn" data-action="hire-staff" data-id="${role.id}" ${getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>Hire · ${fmt(cost)}</button></div>`;
      } else {
        const happy = Math.round(hired.happiness == null ? 70 : hired.happiness);
        const burned = happy < CONFIG.STAFF_BURNOUT_THRESHOLD;
        const trainCost = CONFIG.STAFF_TRAIN_COST_BASE * Math.pow(CONFIG.STAFF_TRAIN_COST_GROWTH, hired.level || 1);
        const maxed = (hired.level || 1) >= CONFIG.STAFF_MAX_LEVEL;
        html += `<div class="recipe-card"><div class="recipe-icon">${role.icon}</div><div class="recipe-info">
          <div class="recipe-name">${role.name} · Lv${hired.level||1}${hired.promoted ? ' ★'+hired.promoted : ''}</div>
          <div class="recipe-desc">😊 ${happy}%${burned ? ' · BURNOUT' : ''} · ${role.desc}</div>
        </div>
          <button class="claim-btn" data-action="train-staff" data-id="${role.id}" ${maxed || getCountryCash(state.activeCountry) < trainCost ? 'disabled' : ''}>${maxed ? 'MAX' : 'Train · '+fmt(trainCost)}</button></div>`;
      }
    });
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
      <button class="modal-btn" data-action="reward-staff" ${!state.staff || !Object.keys(state.staff).length ? 'disabled' : ''}>🎉 Reward Staff</button>
      <button class="modal-btn secondary" data-action="break-room">☕ Break Room · Lv${state.breakRoomLevel||0}</button>
    </div>`;

    html += `<div class="chal-section-label" style="margin-top:16px;">Culinary Academy</div>`;
    html += `<p class="rep-hint">Train global skills that boost the whole team.</p>`;
    STAFF_SKILLS.forEach(sk => {
      const lvl = (state.staffSkills && state.staffSkills[sk.id]) || 0;
      const cost = CONFIG.STAFF_TRAIN_COST_BASE * Math.pow(CONFIG.STAFF_TRAIN_COST_GROWTH, lvl) * 2;
      html += `<div class="recipe-card"><div class="recipe-icon">${sk.icon}</div><div class="recipe-info"><div class="recipe-name">${sk.name} · Lv${lvl}</div><div class="recipe-desc">${sk.desc}</div></div>
        <button class="claim-btn" data-action="academy" data-id="${sk.id}" ${lvl >= 15 || getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>${lvl >= 15 ? 'MAX' : fmt(cost)}</button></div>`;
    });

    html += `<div class="chal-section-label" style="margin-top:16px;">Staff Equipment</div>`;
    STAFF_EQUIPMENT.forEach(eq => {
      const lvl = (state.staffEquip && state.staffEquip[eq.id]) || 0;
      const cost = CONFIG.STAFF_EQUIP_COST_BASE * Math.pow(CONFIG.STAFF_EQUIP_COST_GROWTH, lvl);
      html += `<div class="recipe-card"><div class="recipe-icon">${eq.icon}</div><div class="recipe-info"><div class="recipe-name">${eq.name} · Lv${lvl}</div><div class="recipe-desc">${eq.desc}</div></div>
        <button class="claim-btn" data-action="staff-equip" data-id="${eq.id}" ${lvl >= CONFIG.STAFF_EQUIP_MAX || getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>${lvl >= CONFIG.STAFF_EQUIP_MAX ? 'MAX' : fmt(cost)}</button></div>`;
    });

    
    panel.innerHTML = html;
  }

  function renderKitchenFacility(){
    const panel = document.getElementById('kitchenFacilityPanel');
    if(!panel || !panel.classList.contains('active')) return;
    let html = '';
    html += `<div class="chal-section-label">Restaurant Layout</div>`;
    html += `<p class="rep-hint">Seating, kitchen size, VIP area & serving lanes. +${Math.round(CONFIG.LAYOUT_INCOME_BOOST*100)}% income per level.</p>`;
    LAYOUT_UPGRADES.forEach(u => {
      const lvl = (state.layout && state.layout[u.id]) || 0;
      const cost = scaledUpgradeCost(CONFIG.LAYOUT_BASE_COST, CONFIG.LAYOUT_COST_GROWTH, lvl);
      const maxed = lvl >= CONFIG.LAYOUT_MAX_LEVEL;
      html += `<div class="recipe-card"><div class="recipe-icon">${u.icon}</div><div class="recipe-info"><div class="recipe-name">${u.name} · Lv${lvl}</div><div class="recipe-desc">${u.desc}</div></div>
        <button class="claim-btn" data-action="layout" data-id="${u.id}" ${maxed || getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>${maxed ? 'MAX' : fmt(cost)}</button></div>`;
    });

    html += `<div class="chal-section-label" style="margin-top:16px;">Customer Queue</div>`;
    html += `<p class="rep-hint">Reduce wait times and walk-aways. +${Math.round(CONFIG.QUEUE_INCOME_BOOST*100)}% income per level.</p>`;
    QUEUE_UPGRADES.forEach(u => {
      const lvl = (state.queue && state.queue[u.id]) || 0;
      const cost = scaledUpgradeCost(CONFIG.QUEUE_BASE_COST, CONFIG.QUEUE_COST_GROWTH, lvl);
      const maxed = lvl >= CONFIG.QUEUE_MAX_LEVEL;
      html += `<div class="recipe-card"><div class="recipe-icon">${u.icon}</div><div class="recipe-info"><div class="recipe-name">${u.name} · Lv${lvl}</div><div class="recipe-desc">${u.desc}</div></div>
        <button class="claim-btn" data-action="queue" data-id="${u.id}" ${maxed || getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>${maxed ? 'MAX' : fmt(cost)}</button></div>`;
    });

    html += `<div class="chal-section-label" style="margin-top:16px;">Delivery Fleet</div>`;
    html += `<p class="rep-hint">Passive delivery income. +${Math.round(CONFIG.DELIVERY_INCOME_PER_LEVEL*100)}% per vehicle level.</p>`;
    DELIVERY_FLEET.forEach(u => {
      const lvl = (state.delivery && state.delivery[u.id]) || 0;
      const cost = scaledUpgradeCost(CONFIG.DELIVERY_BASE_COST, CONFIG.DELIVERY_COST_GROWTH, lvl);
      const maxed = lvl >= CONFIG.DELIVERY_MAX_LEVEL;
      html += `<div class="recipe-card"><div class="recipe-icon">${u.icon}</div><div class="recipe-info"><div class="recipe-name">${u.name} · Lv${lvl}</div><div class="recipe-desc">${u.desc}</div></div>
        <button class="claim-btn" data-action="delivery" data-id="${u.id}" ${maxed || getCountryCash(state.activeCountry) < cost ? 'disabled' : ''}>${maxed ? 'MAX' : fmt(cost)}</button></div>`;
    });

    html += `<div class="chal-section-label" style="margin-top:16px;">Service Modes</div>`;
    const hasTakeaway = !!(state.serviceModes && state.serviceModes.takeaway);
    const hasDrive = !!(state.serviceModes && state.serviceModes.driveThrough);
    html += `<div class="recipe-card"><div class="recipe-icon">🥡</div><div class="recipe-info"><div class="recipe-name">Takeaway Orders</div><div class="recipe-desc">+${Math.round(CONFIG.TAKEAWAY_INCOME_BONUS*100)}% income · no seating needed</div></div>
      <button class="claim-btn" data-action="unlock-takeaway" ${hasTakeaway || getCountryCash(state.activeCountry) < CONFIG.TAKEAWAY_UNLOCK_COST * researchCostBonus() ? 'disabled' : ''}>${hasTakeaway ? 'Unlocked' : fmt(CONFIG.TAKEAWAY_UNLOCK_COST)}</button></div>`;
    html += `<div class="recipe-card"><div class="recipe-icon">🚗</div><div class="recipe-info"><div class="recipe-name">Drive-Through</div><div class="recipe-desc">+${Math.round(CONFIG.DRIVETHRU_INCOME_BONUS*100)}% income · requires takeaway</div></div>
      <button class="claim-btn" data-action="unlock-drivethru" ${hasDrive || !hasTakeaway || getCountryCash(state.activeCountry) < CONFIG.DRIVETHRU_UNLOCK_COST * researchCostBonus() ? 'disabled' : ''}>${hasDrive ? 'Unlocked' : fmt(CONFIG.DRIVETHRU_UNLOCK_COST)}</button></div>`;

    const clean = Math.round(state.cleanliness || 0);
    const cLvl = state.cleaningLevel || 0;
    const cCost = scaledUpgradeCost(CONFIG.CLEANING_BASE_COST, CONFIG.CLEANING_COST_GROWTH, cLvl);
    const polishCost = Math.max(50, totalRatePerSec() * CONFIG.CLEANLINESS_REPAIR_COST_MULT * ((100 - clean) / 100));
    html += `<div class="chal-section-label" style="margin-top:16px;">Cleaning · ${clean}/100</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-track big"><div class="rep-fill" style="width:${clean}%"></div></div>
      <p class="rep-hint">Dirty shops hurt rating. Cleaning staff level ${cLvl} slows decay by ${Math.round(cleaningDecayReduction()*100)}%.</p>
      <button class="modal-btn" data-action="upgrade-cleaning" ${cLvl >= CONFIG.CLEANING_MAX_LEVEL || getCountryCash(state.activeCountry) < cCost ? 'disabled' : ''}>Hire Cleaning Staff · ${cLvl >= CONFIG.CLEANING_MAX_LEVEL ? 'MAX' : fmt(cCost)}</button>
      <button class="modal-btn secondary" data-action="polish-clean" style="margin-top:8px;" ${clean >= 100 || getCountryCash(state.activeCountry) < polishCost ? 'disabled' : ''}>Deep Clean · ${fmt(polishCost)}</button>
    </div>`;

    
    panel.innerHTML = html;
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
    document.getElementById('countryBarName').textContent = country.name + ' · ' + fmt(getCountryCash(country.id));
    bizPanel.innerHTML = '';
    bizElCache = {};
    country.businesses.forEach((def, idx) => {
      const b = bizState[def.id];
      const prevDef = country.businesses[idx-1];
      const locked = idx > 0 && b.level === 0 && (!prevDef || bizState[prevDef.id].level < def.unlockAt) && def.unlockAt > 0;
      const cost = businessCost(def, b.level);
      const canAfford = getCountryCash(state.activeCountry) >= cost;
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
          const canBuy = getCountryCash(state.activeCountry) >= uc && !maxed;
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
      const mType = managerTypeDef(b);
      const mBadge = b.manager
        ? `<span class="manager-badge">${mType ? mType.icon + ' ' + mType.name : MANAGER_BONUS_LABEL} · Lv${mLvl}</span>`
        : '';
      let staffBtn = '';
      if(!b.manager && b.level >= CONFIG.MANAGER_UNLOCK_LEVEL){
        staffBtn = `<button class="buy-btn manager-btn" data-action="manager" data-id="${def.id}" aria-label="Hire manager for ${def.name}, cost ${fmt(mCost)}" ${getCountryCash(state.activeCountry) < mCost ? 'disabled' : ''}>Hire<small>${fmt(mCost)}</small></button>`;
      } else if(b.manager && mLvl < CONFIG.MANAGER_MAX_LEVEL){
        const tCost = managerTrainCost(def, mLvl);
        staffBtn = `<button class="buy-btn manager-btn train-btn" data-action="train" data-id="${def.id}" aria-label="Train manager for ${def.name} to level ${mLvl+1}, cost ${fmt(tCost)}" ${getCountryCash(state.activeCountry) < tCost ? 'disabled' : ''}>Train Lv${mLvl+1}<small>${fmt(tCost)}</small></button>`;
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
      if(cache.buyBtn) cache.buyBtn.disabled = getCountryCash(state.activeCountry) < cost || locked;
      if(cache.managerBtn){
        if(b.manager){
          const ml = b.managerLevel || 1;
          if(ml >= CONFIG.MANAGER_MAX_LEVEL) cache.managerBtn.disabled = true;
          else cache.managerBtn.disabled = getCountryCash(state.activeCountry) < managerTrainCost(def, ml);
        } else {
          cache.managerBtn.disabled = getCountryCash(state.activeCountry) < managerCost(def);
        }
      }
      if(b.level > 0){
        Object.keys(UPGRADE_TYPES).forEach(type => {
          const chip = cache.upgradeChips[type];
          if(!chip) return;
          const t = UPGRADE_TYPES[type];
          const lvl = b[type];
          const maxed = lvl >= t.max;
          chip.disabled = maxed || getCountryCash(state.activeCountry) < upgradeCost(def, type, lvl);
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
    addCountryCash(state.activeCountry, cash);
    addEarned(cash);
    earnDiamonds(1);
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
    addCountryCash(state.activeCountry, cash);
    addEarned(cash);
    earnDiamonds(2);
    earnEventTokens(CONFIG.EVENT_TOKEN_SEASONAL_CLAIM || 12);
    save();
    renderAchievements();
    renderStats();
    checkCollectionNotif();
    if(typeof renderEvents === 'function') renderEvents();
  }

  // ---------- GDD Part 8: Event Tokens, Weekly Festival, Pass, Shop, Championship ----------
  function earnEventTokens(n){
    if(n <= 0) return;
    const fest = getWeeklyFestival();
    const mult = fest ? (fest.tokenBonus || 1) : 1;
    const gained = Math.max(0, Math.round(n * mult * 10) / 10);
    state.eventTokens = (state.eventTokens || 0) + gained;
    state.eventTokensEarned = (state.eventTokensEarned || 0) + gained;
  }
  function getWeeklyFestival(){
    // ISO week number → rotate festivals
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return WEEKLY_FESTIVALS[week % WEEKLY_FESTIVALS.length];
  }
  function isoWeekId(){
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return now.getFullYear() + '-W' + week;
  }
  function ensureEventPassWeek(){
    const wid = isoWeekId();
    if(state.eventPassWeekId !== wid){
      state.eventPassWeekId = wid;
      state.eventPassClaimed = {};
    }
  }
  function eventPassProgressTokens(){
    // Tokens earned this "pass window" approximated by total tokens earned (simple)
    // Better: track passPoints — use eventTokensEarned mod for display; claim uses cumulative spent tiers
    return state.eventTokensEarned || 0;
  }
  function claimEventPassTier(tierId){
    ensureEventPassWeek();
    const tier = EVENT_PASS_TIERS.find(t => t.id === tierId);
    if(!tier) return;
    if(state.eventPassClaimed[tierId]) return;
    // Must claim previous tiers first
    const idx = EVENT_PASS_TIERS.findIndex(t => t.id === tierId);
    for(let i = 0; i < idx; i++){
      if(!state.eventPassClaimed[EVENT_PASS_TIERS[i].id]){ playErrorSfx(); return; }
    }
    if((state.eventTokensEarned || 0) < tier.cost){ playErrorSfx(); return; }
    state.eventPassClaimed[tierId] = true;
    grantEventReward(tier.reward);
    if(idx === EVENT_PASS_TIERS.length - 1) state.eventPassCompletes = (state.eventPassCompletes || 0) + 1;
    playBuySfx();
    save();
    renderEvents();
    renderStats();
    checkAchievements();
  }
  function grantEventReward(reward){
    if(!reward) return;
    const rate = Math.max(totalRatePerSec(), 1);
    if(reward.cashSec){
      const g = rate * reward.cashSec;
      addCountryCash(state.activeCountry, g);
      addEarned(g);
      spawnFloatingGain(g);
    }
    if(reward.tokens) earnEventTokens(reward.tokens);
    if(reward.diamonds) earnDiamonds(reward.diamonds);
    if(reward.research) state.researchPoints = (state.researchPoints || 0) + reward.research;
    if(reward.loyalty) state.loyaltyPoints = (state.loyaltyPoints || 0) + reward.loyalty;
    if(reward.fame) adjustFame(reward.fame);
    if(reward.booster){
      if(!state.activePowerups) state.activePowerups = {};
      state.activePowerups.rush_hour = Math.max(state.activePowerups.rush_hour || 0, Date.now() + 8 * 60 * 1000);
    }
    if(reward.ingredient){
      const pool = ['noodles','broth','egg','nori','spice','mushroom','basil','seafood'];
      for(let i = 0; i < reward.ingredient; i++){
        if(typeof addIngredient === 'function') addIngredient(pool[Math.floor(Math.random()*pool.length)], 1);
      }
    }
  }
  function buyEventShopItem(id){
    const item = EVENT_SHOP.find(x => x.id === id);
    if(!item) return;
    if((state.eventTokens || 0) < item.cost){ playErrorSfx(); return; }
    state.eventTokens -= item.cost;
    const reward = {};
    reward[item.kind === 'cashSec' ? 'cashSec' : item.kind] = item.amount;
    if(item.kind === 'booster') reward.booster = true;
    grantEventReward(reward);
    playBuySfx();
    save();
    renderEvents();
    renderStats();
  }

  // Championship
  function startChampionship(){
    if(state.championshipRace) return;
    if(Date.now() < (state.championshipCooldownUntil || 0)){ playErrorSfx(); return; }
    const duration = CONFIG.CHAMPIONSHIP_DURATION_MS || 90000;
    const playerRate = Math.max(totalRatePerSec(), 1);
    const rivals = CHAMPIONSHIP_RIVALS.map(r => ({
      id: r.id, icon: r.icon, name: r.name,
      score: 0,
      rate: playerRate * r.skill * (0.9 + Math.random() * 0.2)
    }));
    state.championshipRace = {
      endsAt: Date.now() + duration,
      playerScore: 0,
      rivals,
      startedAt: Date.now()
    };
    playBuySfx();
    save();
    renderEvents();
  }
  function tickChampionship(dtSec){
    const race = state.championshipRace;
    if(!race) return;
    // Player score accrues from actual earnings tracked separately via addChampionshipScore
    race.rivals.forEach(r => { r.score += r.rate * dtSec; });
    if(Date.now() >= race.endsAt){
      finishChampionship();
    }
  }
  function addChampionshipScore(amount){
    if(!state.championshipRace) return;
    state.championshipRace.playerScore = (state.championshipRace.playerScore || 0) + amount;
  }
  function finishChampionship(){
    const race = state.championshipRace;
    if(!race) return;
    const scores = [{id:'you', name:'You', score: race.playerScore || 0},
      ...race.rivals.map(r => ({id:r.id, name:r.name, score:r.score}))];
    scores.sort((a,b) => b.score - a.score);
    const place = scores.findIndex(s => s.id === 'you') + 1;
    state.championshipRace = null;
    state.championshipCooldownUntil = Date.now() + (CONFIG.CHAMPIONSHIP_COOLDOWN_MS || 1800000);
    if(place === 1){
      state.championshipWins = (state.championshipWins || 0) + 1;
      earnEventTokens(20);
      earnDiamonds(5);
      adjustFame(20);
    } else if(place === 2){
      earnEventTokens(12);
      earnDiamonds(2);
    } else if(place === 3){
      earnEventTokens(8);
      earnDiamonds(1);
    } else {
      earnEventTokens(4);
    }
    state._lastChampPlace = place;
    save();
    renderEvents();
    renderStats();
    checkAchievements();
  }

  // Community goals — simulated global progress based on local contribution + time
  function communityProgress(goal){
    // Pseudo-global: scale with week time + local contribution stored
    const weekFrac = (Date.now() % (7 * 86400000)) / (7 * 86400000);
    const local = (state.communityLocal && state.communityLocal[goal.id]) || 0;
    // Simulate other players filling most of the bar over the week
    const simulated = goal.target * Math.min(0.95, weekFrac * 0.85 + local / goal.target);
    return Math.min(goal.target, simulated + local);
  }
  function contributeCommunity(goalId, amount){
    if(!state.communityLocal) state.communityLocal = {};
    state.communityLocal[goalId] = (state.communityLocal[goalId] || 0) + amount;
  }
  function claimCommunity(goalId){
    const goal = COMMUNITY_GOALS.find(g => g.id === goalId);
    if(!goal) return;
    const key = goalId + '_' + isoWeekId();
    if(state.communityClaimed[key]) return;
    if(communityProgress(goal) < goal.target){ playErrorSfx(); return; }
    state.communityClaimed[key] = true;
    earnEventTokens(goal.rewardTokens || 10);
    earnDiamonds(goal.rewardDiamonds || 1);
    playBuySfx();
    save();
    renderEvents();
    renderStats();
  }

  function renderEvents(){
    const panel = document.getElementById('eventsPanel');
    if(!panel || !panel.classList.contains('active')) return;
    ensureEventPassWeek();
    const fest = getWeeklyFestival();
    const seasonal = ensureSeasonalState();
    let html = '';

    // Tokens header
    html += `<div class="chal-section-label">Event Currency</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-panel-top">
        <span class="rep-panel-score">🎫 ${Math.floor(state.eventTokens||0)}</span>
        <span class="rep-panel-mult">Lifetime ${Math.floor(state.eventTokensEarned||0)}</span>
      </div>
      <p class="rep-hint">Earn tokens from orders, seasonal claims, championships & the event pass. Spend them in the Event Shop.</p>
    </div>`;

    // Weekly festival
    html += `<div class="chal-section-label" style="margin-top:14px;">Weekly Festival</div>`;
    html += `<div class="rep-panel-card">
      <div class="rep-panel-top"><span class="rep-panel-score">${fest.icon} ${fest.name}</span><span class="rep-panel-mult">×${fest.tokenBonus} tokens</span></div>
      <p class="rep-hint">${fest.blurb} Token gains are boosted this week.</p>
    </div>`;

    // Seasonal (reuse)
    if(seasonal){
      html += renderSeasonalSection();
    } else {
      html += `<div class="chal-section-label" style="margin-top:14px;">Seasonal Event</div>
        <div class="rep-panel-card"><p class="rep-hint">No calendar event right now. Weekly festival and championship still run.</p></div>`;
    }

    // Event Pass
    html += `<div class="chal-section-label" style="margin-top:14px;">Event Pass</div>`;
    html += `<div class="rep-panel-card">`;
    EVENT_PASS_TIERS.forEach((t, i) => {
      const claimed = !!state.eventPassClaimed[t.id];
      const prevOk = i === 0 || !!state.eventPassClaimed[EVENT_PASS_TIERS[i-1].id];
      const ready = prevOk && (state.eventTokensEarned || 0) >= t.cost && !claimed;
      const rewardBits = [];
      if(t.reward.cashSec) rewardBits.push('cash');
      if(t.reward.tokens) rewardBits.push(t.reward.tokens + '🎫');
      if(t.reward.diamonds) rewardBits.push(t.reward.diamonds + '💎');
      if(t.reward.research) rewardBits.push(t.reward.research + '🔬');
      if(t.reward.booster) rewardBits.push('booster');
      html += `<div class="ach-card${claimed?' claimed':''}" style="margin-bottom:6px;">
        <div class="ach-icon${claimed?' done':''}">${t.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${t.label}</div>
          <div class="ach-desc">Need ${t.cost} lifetime tokens · ${rewardBits.join(', ')}</div>
        </div>
        <button class="claim-btn" data-action="claim-pass" data-id="${t.id}" ${ready?'':'disabled'}>${claimed?'✓':'Claim'}</button>
      </div>`;
    });
    html += `</div>`;

    // Championship
    html += `<div class="chal-section-label" style="margin-top:14px;">World Food Championship</div>`;
    const race = state.championshipRace;
    const cdLeft = Math.max(0, (state.championshipCooldownUntil || 0) - Date.now());
    if(race){
      const left = Math.max(0, Math.ceil((race.endsAt - Date.now()) / 1000));
      const board = [{name:'You', icon:'🍜', score:race.playerScore||0},
        ...race.rivals.map(r => ({name:r.name, icon:r.icon, score:r.score}))];
      board.sort((a,b) => b.score - a.score);
      html += `<div class="rep-panel-card"><div class="rep-panel-top"><span>Racing…</span><span class="rep-panel-mult">${left}s left</span></div>`;
      board.forEach((b,i) => {
        html += `<div style="display:flex; justify-content:space-between; font-size:12px; margin:4px 0;">
          <span>${i+1}. ${b.icon} ${b.name}</span><strong>${fmt(b.score)}</strong></div>`;
      });
      html += `<p class="rep-hint">Earn cash during the race to climb the board. 1st place wins big tokens & gems.</p></div>`;
    } else {
      const canStart = cdLeft <= 0;
      html += `<div class="rep-panel-card">
        <p class="rep-hint">90-second race vs AI restaurants. Your cash earned during the race is your score. Wins: ${state.championshipWins||0}</p>
        <button class="modal-btn" data-action="start-champ" ${canStart?'':'disabled'}>${canStart?'Start Championship':('Cooldown '+Math.ceil(cdLeft/60000)+'m')}</button>
        ${state._lastChampPlace ? `<p class="rep-hint">Last place: #${state._lastChampPlace}</p>` : ''}
      </div>`;
    }

    // Community
    html += `<div class="chal-section-label" style="margin-top:14px;">Community Challenges</div>`;
    COMMUNITY_GOALS.forEach(g => {
      const prog = communityProgress(g);
      const pct = Math.min(100, Math.round((prog / g.target) * 100));
      const key = g.id + '_' + isoWeekId();
      const claimed = !!state.communityClaimed[key];
      const ready = prog >= g.target && !claimed;
      html += `<div class="rep-panel-card" style="margin-bottom:8px;">
        <div class="rep-panel-top"><span>${g.icon} ${g.name}</span><span class="rep-panel-mult">${pct}%</span></div>
        <div class="chal-progress"><div class="chal-progress-fill" style="width:${pct}%"></div></div>
        <p class="rep-hint">${fmt(prog)} / ${fmt(g.target)} · Reward ${g.rewardTokens}🎫 + ${g.rewardDiamonds}💎</p>
        <button class="claim-btn" data-action="claim-community" data-id="${g.id}" ${ready?'':'disabled'}>${claimed?'✓ Claimed':(ready?'Claim':'In Progress')}</button>
      </div>`;
    });

    // Event Shop
    html += `<div class="chal-section-label" style="margin-top:14px;">Event Shop</div>`;
    EVENT_SHOP.forEach(item => {
      const can = (state.eventTokens || 0) >= item.cost;
      html += `<div class="ach-card" style="margin-bottom:6px;">
        <div class="ach-icon">${item.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${item.name}</div>
          <div class="ach-desc">🎫 ${item.cost}</div>
        </div>
        <button class="claim-btn" data-action="buy-event" data-id="${item.id}" ${can?'':'disabled'}>Buy</button>
      </div>`;
    });

    panel.innerHTML = html;
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
    // Progression header
    const stage = currentJourneyStage();
    const elvl = empireLevel();
    const fame = Math.floor(state.fame || 0);
    const header = document.createElement('div');
    header.className = 'rep-panel-card';
    header.style.marginBottom = '12px';
    header.innerHTML = `
      <div class="rep-panel-top">
        <span class="rep-panel-score">${stage.icon} ${stage.name}</span>
        <span class="rep-panel-mult">Empire Lv ${elvl}</span>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:8px 14px; margin-top:8px; font-size:11.5px;">
        <span>📣 Fame <b>${fame}</b>/${CONFIG.FAME_MAX || 1000}</span>
        <span>⭐ Michelin ${'★'.repeat(state.michelinStars||0)}${'☆'.repeat(Math.max(0,(CONFIG.MICHELIN_MAX_STARS||3)-(state.michelinStars||0)))}</span>
        <span>🌍 Cities <b>${(state.unlockedCountries||[]).length}</b>/${COUNTRIES.length}</span>
      </div>
      <p class="rep-hint">${stage.desc} Prior cities keep earning while you expand.</p>
    `;
    panel.appendChild(header);

    COUNTRIES.forEach(country => {
      const unlocked = isUnlocked(country.id);
      const active = state.activeCountry === country.id;
      const rate = unlocked ? countryRatePerSec(country) * globalMultiplier() : 0;
      const card = document.createElement('div');
      card.className = 'world-card' + (unlocked ? '' : ' locked') + (active ? ' active' : '');
      let btn, extra = '';
      if(unlocked){
        btn = `<button class="world-btn${active ? ' active-btn' : ''}" data-action="select" data-id="${country.id}" aria-label="${active ? country.name + ' is currently active' : 'Manage ' + country.name}" ${active ? 'disabled' : ''}>${active ? 'ACTIVE' : 'MANAGE'}</button>`;
      } else {
        const req = cityUnlockRequirements(country.id);
        const canCash = canAffordUnlock(country.unlockCost);
        const can = canCash && req.allOk;
        btn = `<button class="world-btn" data-action="unlock" data-id="${country.id}" aria-label="Unlock ${country.name}" ${can ? '' : 'disabled'}>UNLOCK<small>${fmt(country.unlockCost)}</small></button>`;
        extra = `<div class="world-reqs" style="font-size:10.5px; opacity:0.85; margin-top:4px; line-height:1.45;">
          <span style="color:${req.repOk?'var(--jade-light)':'#e08070'}">⭐ Rep ${Math.round(state.reputation||0)}/${req.repNeed}</span> ·
          <span style="color:${req.ratingOk?'var(--jade-light)':'#e08070'}">📊 Rating ${restaurantRating()}/${req.ratingNeed}</span> ·
          <span style="color:${req.shopsOk?'var(--jade-light)':'#e08070'}">🏪 Shops ${req.priorLevels}/${req.shopsNeed}</span>
        </div>`;
      }
      card.innerHTML = `
        <div class="world-flag" aria-hidden="true">${country.icon}</div>
        <div class="world-info">
          <div class="world-name">${country.name}${active ? '<span class="active-tag">ACTIVE</span>' : ''}</div>
          <div class="world-tagline">${country.tagline}</div>
          <div class="world-income">${unlocked ? fmt(rate) + '/s · ' + fmt(getCountryCash(country.id)) + ' cash' : 'Locked · ' + fmt(country.unlockCost)}</div>
          ${extra}
        </div>
        ${btn}
      `;
      panel.appendChild(card);
    });
  }
  function unlockCountry(id){
    const country = getCountry(id);
    if(!country || isUnlocked(id) || !canAffordUnlock(country.unlockCost)) return;
    // GDD Part 7: also require reputation, rating, and prior franchise levels
    const req = cityUnlockRequirements(id);
    if(!req.allOk){ playErrorSfx(); return; }
    if(!spendFromRichest(country.unlockCost)) return;
    state.unlockedCountries.push(id);
    state.activeCountry = id;
    adjustFame(CONFIG.FAME_PER_COUNTRY || 25);
    // Seed a tiny starter pot so the new market isn't dead on arrival
    addCountryCash(id, Math.min(50, country.unlockCost * 0.00001 + 10));
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
    renderPowerups();
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
    const metaBtn = e.target.closest('[data-action="buy-meta"]');
    if(metaBtn) buyMetaUpgrade(metaBtn.dataset.id);
    const puBtn = e.target.closest('[data-action="buy-powerup"]');
    if(puBtn) buyPowerup(puBtn.dataset.id);
  });
  // Economy panel (boosters + wheel buy buttons use same data-action)
  const economyPanelEl = document.getElementById('economyPanel');
  if(economyPanelEl){
    economyPanelEl.addEventListener('click', e => {
      const puBtn = e.target.closest('[data-action="buy-powerup"]');
      if(puBtn) buyPowerup(puBtn.dataset.id);
    });
  }
  // Events panel
  const eventsPanelEl = document.getElementById('eventsPanel');
  if(eventsPanelEl){
    eventsPanelEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if(!btn) return;
      const act = btn.dataset.action;
      if(act === 'claim-pass') claimEventPassTier(btn.dataset.id);
      else if(act === 'buy-event') buyEventShopItem(btn.dataset.id);
      else if(act === 'start-champ') startChampionship();
      else if(act === 'claim-community') claimCommunity(btn.dataset.id);
      else if(act === 'claim-seasonal') claimSeasonal();
    });
  }

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
    const activeCash = getCountryCash(state.activeCountry);
    document.getElementById('cashDisplay').textContent = fmt(activeCash);
    document.getElementById('rateDisplay').textContent = fmt(totalRatePerSec()) + '/s';
    const diaEl = document.getElementById('diamondDisplay');
    if(diaEl) diaEl.textContent = Math.floor(state.diamonds || 0);
    const cashCorner = document.getElementById('cashCorner');
    if(cashCorner){
      const c = activeCountryDef();
      cashCorner.setAttribute('aria-label', (c ? c.name + ' cash' : 'Cash') + ' and income rate');
    }
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
        return { icon: def.icon, name: def.name, detail: `Save up ${fmt(cost)}`, progress: getCountryCash(country.id) / cost };
      }
    }
    const nextCountry = COUNTRIES.find(c => !isUnlocked(c.id));
    if(nextCountry){
      return {
        icon: nextCountry.icon, name: nextCountry.name,
        detail: `Unlock for ${fmt(nextCountry.unlockCost)}`, progress: totalCash() / nextCountry.unlockCost
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
    if(getCountryCash(country.id) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(country.id, cost)){ playErrorSfx(); return; }
    playBuySfx();
    b.level++;
    addChallengeProgress('buy', 1);
    // Small diamond chance on level-up (rarer at high levels)
    if(Math.random() < 0.04){ earnDiamonds(1); }
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
  function hireManager(id, typeId){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    if(b.manager) return;
    const cost = managerCost(def);
    if(getCountryCash(country.id) < cost){ playErrorSfx(); return; }
    const type = MANAGER_TYPES.find(t => t.id === typeId) || MANAGER_TYPES[0];
    if(!spendCountryCash(country.id, cost)){ playErrorSfx(); return; }
    playBuySfx();
    b.manager = true;
    b.managerLevel = 1;
    b.managerType = type.id;
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function showManagerTypePicker(bizId){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === bizId);
    if(!def) return;
    const cost = managerCost(def);
    const choices = MANAGER_TYPES.map(t =>
      `${t.icon} ${t.name} — ${t.desc}`
    ).join('\n');
    const pick = prompt(
      `Hire a manager for ${def.name} (${fmt(cost)})\n\nEnter number:\n` +
      MANAGER_TYPES.map((t,i) => `${i+1}) ${t.icon} ${t.name} — ${t.desc}`).join('\n')
    );
    const idx = parseInt(pick, 10) - 1;
    if(isNaN(idx) || idx < 0 || idx >= MANAGER_TYPES.length) return;
    hireManager(bizId, MANAGER_TYPES[idx].id);
  }
  function stationCost(id){
    const lvl = (state.stations && state.stations[id]) || 0;
    return CONFIG.STATION_BASE_COST * Math.pow(CONFIG.STATION_COST_GROWTH, lvl) * researchCostBonus();
  }
  function upgradeStation(id){
    const st = COOKING_STATIONS.find(s => s.id === id);
    if(!st) return;
    const lvl = (state.stations && state.stations[id]) || 0;
    if(lvl >= CONFIG.STATION_MAX_LEVEL) return;
    const cost = stationCost(id);
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    if(!state.stations) state.stations = {};
    state.stations[id] = lvl + 1;
    save();
    renderKitchen(); renderStats(); checkAchievements();
  }
  function researchUpgradeCost(id){
    const lvl = researchLevel(id);
    return 1 + lvl; // research points cost = level+1
  }
  function buyResearch(id){
    const br = RESEARCH_BRANCHES.find(b => b.id === id);
    if(!br) return;
    const lvl = researchLevel(id);
    if(lvl >= CONFIG.RESEARCH_MAX_LEVEL) return;
    const cost = researchUpgradeCost(id);
    if((state.researchPoints || 0) < cost){ playErrorSfx(); return; }
    state.researchPoints -= cost;
    if(!state.research) state.research = {};
    state.research[id] = lvl + 1;
    // Satisfaction branch raises starting/current rep a bit
    if(br.kind === 'rep'){
      state.reputation = Math.min(CONFIG.REP_MAX, (state.reputation || 0) + br.boost);
    }
    playBuySfx();
    save();
    renderKitchen(); renderStats(); checkAchievements();
  }
  function unlockAvailableChefs(){
    let changed = false;
    LEGENDARY_CHEFS.forEach(c => {
      if((state.prestigeCount || 0) >= c.unlockPrestige && !state.chefsOwned[c.id]){
        state.chefsOwned[c.id] = true;
        changed = true;
      }
    });
    if(changed){ save(); checkAchievements(); }
  }
  function equipChef(id){
    if(!state.chefsOwned || !state.chefsOwned[id]) return;
    state.equippedChef = id;
    save();
    renderKitchen();
  }
  function activateChefSkill(){
    const id = state.equippedChef;
    if(!id || !state.chefsOwned[id]) return;
    const now = Date.now();
    if(state.chefSkillCooldownUntil && state.chefSkillCooldownUntil > now){
      playErrorSfx();
      return;
    }
    const chef = LEGENDARY_CHEFS.find(c => c.id === id);
    if(!chef) return;
    playBuySfx();
    state.chefSkillEndsAt = now + CONFIG.CHEF_SKILL_DURATION_MS;
    state.chefSkillCooldownUntil = now + CONFIG.CHEF_SKILL_COOLDOWN_MS;
    if(chef.skill === 'rep_boost'){
      state.reputation = Math.min(CONFIG.REP_MAX, (state.reputation || 0) + 15);
    }
    if(chef.skill === 'instant_cook'){
      // free +1 level on the cheapest owned shop in active country
      const country = activeCountryDef();
      const bizState = state.countries[country.id];
      let best = null, bestCost = Infinity;
      country.businesses.forEach(def => {
        const b = bizState[def.id];
        if(b.level > 0){
          const c = businessCost(def, b.level);
          if(c < bestCost){ bestCost = c; best = {def, b}; }
        }
      });
      if(best) best.b.level += 1;
    }
    save();
    renderKitchen(); renderStats(); renderBusinesses();
  }
  function startMichelinChallenge(){
    if((state.michelinStars || 0) >= CONFIG.MICHELIN_MAX_STARS) return;
    if((state.reputation || 0) < CONFIG.MICHELIN_REP_REQ){ playErrorSfx(); return; }
    if(state.michelinChallenge) return;
    const rate = typeof totalRatePerSec === 'function' ? totalRatePerSec() : 1;
    const target = Math.max(1000, rate * CONFIG.MICHELIN_CHALLENGE_CASH_MULT);
    state.michelinChallenge = { startedAt: Date.now(), targetCash: target, earned: 0, durationMs: 120000 };
    save();
    renderKitchen();
  }
  function tickMichelinChallenge(amount){
    if(!state.michelinChallenge) return;
    state.michelinChallenge.earned = (state.michelinChallenge.earned || 0) + amount;
    if(state.michelinChallenge.earned >= state.michelinChallenge.targetCash){
      state.michelinStars = Math.min(CONFIG.MICHELIN_MAX_STARS, (state.michelinStars || 0) + 1);
      adjustFame(CONFIG.FAME_PER_MICHELIN || 40);
      state.michelinChallenge = null;
      playChimeSfx && playChimeSfx();
      checkAchievements();
      save();
      renderKitchen();
    } else if(Date.now() - state.michelinChallenge.startedAt > (state.michelinChallenge.durationMs || 120000)){
      state.michelinChallenge = null;
      save();
      renderKitchen();
    }
  }

  // ---- GDD Part 2: Layout / Queue / Delivery / Cleaning / Service modes ----
  function scaledUpgradeCost(base, growth, level){
    return base * Math.pow(growth, level) * researchCostBonus();
  }
  function upgradeLayout(id){
    const def = LAYOUT_UPGRADES.find(u => u.id === id);
    if(!def) return;
    const lvl = (state.layout && state.layout[id]) || 0;
    if(lvl >= CONFIG.LAYOUT_MAX_LEVEL) return;
    const cost = scaledUpgradeCost(CONFIG.LAYOUT_BASE_COST, CONFIG.LAYOUT_COST_GROWTH, lvl);
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    if(!state.layout) state.layout = {};
    state.layout[id] = lvl + 1;
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function upgradeQueue(id){
    const def = QUEUE_UPGRADES.find(u => u.id === id);
    if(!def) return;
    const lvl = (state.queue && state.queue[id]) || 0;
    if(lvl >= CONFIG.QUEUE_MAX_LEVEL) return;
    const cost = scaledUpgradeCost(CONFIG.QUEUE_BASE_COST, CONFIG.QUEUE_COST_GROWTH, lvl);
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    if(!state.queue) state.queue = {};
    state.queue[id] = lvl + 1;
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function upgradeDelivery(id){
    const def = DELIVERY_FLEET.find(u => u.id === id);
    if(!def) return;
    const lvl = (state.delivery && state.delivery[id]) || 0;
    if(lvl >= CONFIG.DELIVERY_MAX_LEVEL) return;
    const cost = scaledUpgradeCost(CONFIG.DELIVERY_BASE_COST, CONFIG.DELIVERY_COST_GROWTH, lvl);
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    if(!state.delivery) state.delivery = {};
    state.delivery[id] = lvl + 1;
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function upgradeCleaning(){
    const lvl = state.cleaningLevel || 0;
    if(lvl >= CONFIG.CLEANING_MAX_LEVEL) return;
    const cost = scaledUpgradeCost(CONFIG.CLEANING_BASE_COST, CONFIG.CLEANING_COST_GROWTH, lvl);
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.cleaningLevel = lvl + 1;
    state.cleanliness = Math.min(100, (state.cleanliness || 0) + 10);
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function polishCleanliness(){
    const missing = 100 - (state.cleanliness || 0);
    if(missing <= 0) return;
    const cost = Math.max(50, totalRatePerSec() * CONFIG.CLEANLINESS_REPAIR_COST_MULT * (missing / 100));
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.cleanliness = 100;
    save(); renderKitchen(); renderStats();
  }
  function unlockTakeaway(){
    if(state.serviceModes && state.serviceModes.takeaway) return;
    const cost = CONFIG.TAKEAWAY_UNLOCK_COST * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    if(!state.serviceModes) state.serviceModes = {};
    state.serviceModes.takeaway = true;
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function unlockDriveThrough(){
    if(state.serviceModes && state.serviceModes.driveThrough) return;
    if(!(state.serviceModes && state.serviceModes.takeaway)){ playErrorSfx(); return; }
    const cost = CONFIG.DRIVETHRU_UNLOCK_COST * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.serviceModes.driveThrough = true;
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function tickCleanliness(dtSec){
    const decay = CONFIG.CLEANLINESS_DECAY_PER_MIN * (dtSec / 60) * (1 - cleaningDecayReduction());
    if(decay <= 0) return;
    state.cleanliness = Math.max(0, (state.cleanliness || 0) - decay);
  }

  // ---- GDD Part 4: Staff system ----
  function hireStaff(roleId){
    const role = STAFF_ROLES.find(r => r.id === roleId);
    if(!role) return;
    if(state.staff && state.staff[roleId]) return; // already hired
    const cost = role.hireCost * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    if(!state.staff) state.staff = {};
    state.staff[roleId] = { level: 1, xp: 0, happiness: 80, promoted: 0 };
    // HR manager boosts everyone's happiness on hire
    if(roleId === 'hr'){
      Object.values(state.staff).forEach(st => { st.happiness = Math.min(100, (st.happiness||70) + 10); });
    }
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function trainStaffRole(roleId){
    const st = state.staff && state.staff[roleId];
    if(!st) return;
    if((st.level || 1) >= CONFIG.STAFF_MAX_LEVEL) return;
    const cost = CONFIG.STAFF_TRAIN_COST_BASE * Math.pow(CONFIG.STAFF_TRAIN_COST_GROWTH, st.level || 1) * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    st.level = (st.level || 1) + 1;
    st.xp = 0;
    if([5,10,15,20].includes(st.level)){
      st.promoted = (st.promoted || 0) + 1;
      st.happiness = Math.min(100, (st.happiness||70) + 15);
    }
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function trainAcademySkill(skillId){
    const sk = STAFF_SKILLS.find(s => s.id === skillId);
    if(!sk) return;
    if(!state.staffSkills) state.staffSkills = {};
    const lvl = state.staffSkills[skillId] || 0;
    if(lvl >= 15) return;
    const cost = CONFIG.STAFF_TRAIN_COST_BASE * Math.pow(CONFIG.STAFF_TRAIN_COST_GROWTH, lvl) * 2 * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.staffSkills[skillId] = lvl + 1;
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function upgradeStaffEquip(equipId){
    const eq = STAFF_EQUIPMENT.find(e => e.id === equipId);
    if(!eq) return;
    if(!state.staffEquip) state.staffEquip = {};
    const lvl = state.staffEquip[equipId] || 0;
    if(lvl >= CONFIG.STAFF_EQUIP_MAX) return;
    const cost = CONFIG.STAFF_EQUIP_COST_BASE * Math.pow(CONFIG.STAFF_EQUIP_COST_GROWTH, lvl) * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.staffEquip[equipId] = lvl + 1;
    if(equipId === 'uniforms'){
      Object.values(state.staff || {}).forEach(st => { st.happiness = Math.min(100, (st.happiness||70) + 5); });
    }
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function upgradeAutomation(){
    const lvl = state.automationLevel || 0;
    if(lvl >= CONFIG.AUTOMATION_MAX_LEVEL) return;
    const cost = CONFIG.AUTOMATION_BASE_COST * Math.pow(CONFIG.AUTOMATION_COST_GROWTH, lvl) * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.automationLevel = lvl + 1;
    // Automation reduces burnout pressure
    Object.values(state.staff || {}).forEach(st => {
      st.happiness = Math.min(100, (st.happiness||70) + 3);
    });
    save(); renderKitchen(); renderStats(); checkAchievements();
  }
  function upgradeBreakRoom(){
    const cost = CONFIG.BREAK_ROOM_COST * Math.pow(1.5, state.breakRoomLevel || 0) * researchCostBonus();
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    state.breakRoomLevel = (state.breakRoomLevel || 0) + 1;
    Object.values(state.staff || {}).forEach(st => {
      st.happiness = Math.min(100, (st.happiness||70) + 12);
    });
    save(); renderKitchen(); renderStats();
  }
  function rewardStaff(){
    if(!state.staff || !Object.keys(state.staff).length) return;
    const cost = Math.max(100, totalRatePerSec() * CONFIG.REWARD_STAFF_COST_MULT);
    if(getCountryCash(state.activeCountry) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(state.activeCountry, cost)){ playErrorSfx(); return; }
    playBuySfx();
    Object.values(state.staff).forEach(st => {
      st.happiness = Math.min(100, (st.happiness||70) + 20);
    });
    save(); renderKitchen();
  }
  function tickStaff(dtSec){
    if(!state.staff) return;
    const decayBase = CONFIG.STAFF_HAPPINESS_DECAY_PER_MIN * (dtSec / 60);
    const serviceSkill = (state.staffSkills && state.staffSkills.service) || 0;
    const breakBonus = (state.breakRoomLevel || 0) * 0.05;
    const autoBonus = (state.automationLevel || 0) * 0.03;
    const decay = decayBase * Math.max(0.2, 1 - serviceSkill * 0.05 - breakBonus - autoBonus);
    Object.values(state.staff).forEach(st => {
      st.happiness = Math.max(0, (st.happiness == null ? 70 : st.happiness) - decay);
      st.xp = (st.xp || 0) + CONFIG.STAFF_XP_PER_MINUTE * (dtSec / 60);
      // Passive level-up from XP (slow)
      const need = 10 * (st.level || 1);
      if(st.xp >= need && (st.level || 1) < CONFIG.STAFF_MAX_LEVEL){
        st.xp -= need;
        st.level = (st.level || 1) + 1;
        if([5,10,15,20].includes(st.level)) st.promoted = (st.promoted || 0) + 1;
      }
    });
    // Cleaner staff slowly restores cleanliness
    if(state.staff.cleaner){
      state.cleanliness = Math.min(100, (state.cleanliness || 0) + 0.15 * (state.staff.cleaner.level || 1) * (dtSec / 60));
    }
  }

  function trainManager(id){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    if(!b.manager) return;
    const lvl = b.managerLevel || 1;
    if(lvl >= CONFIG.MANAGER_MAX_LEVEL) return;
    const cost = managerTrainCost(def, lvl);
    if(getCountryCash(country.id) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(country.id, cost)){ playErrorSfx(); return; }
    playBuySfx();
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
    if(getCountryCash(country.id) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(country.id, cost)){ playErrorSfx(); return; }
    playBuySfx();
    b[type]++;
    addChallengeProgress('buy', 1);
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function doPrestige(){
    const potential = potentialPrestigePoints();
    if(potential <= 0){ playErrorSfx(); return; }
    playPrestigeSfx();
    const shardsGained = potentialShards();
    state.prestigePoints += potential;
    state.shards += shardsGained;
    state.prestigeCount++;
    // Research points survive prestige (GDD Research Tree)
    state.researchPoints = (state.researchPoints || 0) + CONFIG.RESEARCH_POINT_PER_PRESTIGE * Math.max(1, Math.floor(potential));
    state.cash = 0;
    COUNTRIES.forEach(c => setCountryCash(c.id, 0));
    state.totalEarned = 0;
    // Diamonds and active powerups persist across prestige
    earnDiamonds(Math.max(1, Math.floor(potential / 5))); // bonus diamonds for retiring
    // Retiring resets every country's shops — unlocked countries stay
    // unlocked, only their business levels/upgrades/managers reset.
    // Umami Shards and metaUpgrades are untouched: that's the whole point of
    // the second currency, a grind that survives every retirement.
    // Reputation, ingredients, craft counters, stations, research, chefs,
    // and Michelin stars also persist — long-term kitchen mastery layers.
    COUNTRIES.forEach(c => state.countries[c.id] = initCountryState(c));
    state.activeRecipe = null;
    state.michelinChallenge = null;
    activeOrder = null;
    renderOrderCard();
    unlockAvailableChefs();
    save();
    renderBusinesses(); renderWorld(); renderStats(); checkAchievements();
    if(document.getElementById('prestigePanel').classList.contains('active')){ renderPrestige(); renderPowerups(); }
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
      addCountryCash(state.activeCountry, bonus);
      earnDiamonds(1);
      state.researchPoints = (state.researchPoints || 0) + CONFIG.RESEARCH_POINT_PER_MILESTONE;
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
  function playMilestoneChime(){
    if(!state.sfxEnabled) return;
    const ctx = getAudioCtx();
    if(!ctx || !sfxBus) return;
    try{
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
        osc.connect(gain).connect(sfxBus);
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
    else if(action === 'manager') showManagerTypePicker(id);
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
        addCountryCash(state.activeCountry, data.amount || 0);
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
  const MUSIC_BPM = 88;
  const MUSIC_CHORDS = [
    [261.63, 329.63, 392.00], // C major
    [220.00, 261.63, 329.63], // A minor
    [174.61, 220.00, 261.63], // F major
    [196.00, 246.94, 293.66], // G major
  ];
  let musicTimer = null;
  let musicStep = 0;
  function scheduleMusicStep(){
    if(!state.musicEnabled){ stopMusic(); return; }
    const ctx = getAudioCtx();
    if(!ctx || !musicBus) return;
    const chord = MUSIC_CHORDS[Math.floor(musicStep / 4) % MUSIC_CHORDS.length];
    const beat = musicStep % 4;
    const t0 = ctx.currentTime + 0.02;
    const beatSec = 60 / MUSIC_BPM;
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


})();
