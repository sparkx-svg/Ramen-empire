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

