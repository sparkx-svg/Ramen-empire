/**
 * Ramen Empire — 03 Economy Ui
 * Economy math, events, challenges, rendering, actions, milestones.
 *
 * This file is part of the split source. Run `node build-script.js` (or npm run build:script)
 * to concatenate js/*.js back into script.js for deployment.
 */
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
    return 1 + sumLevels(state.delivery) * CONFIG.DELIVERY_INCOME_PER_LEVEL;
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
      * staffEquipBonus();
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
    addCountryCash(state.activeCountry, pendingDailyReward.cash);
    addEarned(pendingDailyReward.cash);
    state.prestigePoints += pendingDailyReward.miso;
    if(state.daily.streak % 7 === 0) earnDiamonds(3);
    else if(state.daily.streak % 3 === 0) earnDiamonds(1);
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
    if(rep >= 55 && Math.random() < (CONFIG.VIP_SPAWN_CHANCE || 0.06) * (1 + vipArea * 0.15)){
      return CUSTOMER_TYPES.find(c => c.id === 'vip');
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

    // Satisfaction slightly affects spawn chance (happy customers = more traffic)
    const sat = (state.satisfaction || CONFIG.SATISFACTION_START) / 100;
    const chance = (CONFIG.ORDER_TRIGGER_CHANCE || 0.28) * (0.75 + sat * 0.5);
    if(Math.random() >= chance) return;

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
    if(stars >= 4) state.reviewsPositive = (state.reviewsPositive || 0) + 1;
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
        : `<button class="world-btn" data-action="unlock" data-id="${country.id}" aria-label="Unlock ${country.name} for ${fmt(country.unlockCost)}" ${!canAffordUnlock(country.unlockCost) ? 'disabled' : ''}>UNLOCK<small>${fmt(country.unlockCost)}</small></button>`;
      card.innerHTML = `
        <div class="world-flag" aria-hidden="true">${country.icon}</div>
        <div class="world-info">
          <div class="world-name">${country.name}${active ? '<span class="active-tag">ACTIVE</span>' : ''}</div>
          <div class="world-tagline">${country.tagline}</div>
          <div class="world-income">${unlocked ? fmt(rate) + '/s · ' + fmt(getCountryCash(country.id)) + ' cash' : 'Locked'}</div>
        </div>
        ${btn}
      `;
      panel.appendChild(card);
    });
  }
  function unlockCountry(id){
    const country = getCountry(id);
    if(!country || isUnlocked(id) || !canAffordUnlock(country.unlockCost)) return;
    if(!spendFromRichest(country.unlockCost)) return;
    state.unlockedCountries.push(id);
    state.activeCountry = id;
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

