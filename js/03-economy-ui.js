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
    return (def && def.boost && def.boost[kind]) || 0;
  }
  function globalMultiplier(){
    return prestigeMultiplier()
      * (1 + state.achievementBonus)
      * (1 + metaBonus('umami'))
      * reputationMultiplier()
      * (1 + activeRecipeBoost('income'))
      * (typeof giftBoostMultiplier === 'function' ? giftBoostMultiplier() : 1)
      * powerupMult('income');
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
      * (1 + activeRecipeBoost('tap'))
      * powerupMult('tap');
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
    addCountryCash(state.activeCountry, gain);
    addEarned(gain);
    state.ordersFulfilled = (state.ordersFulfilled || 0) + 1;
    if(Math.random() < 0.08) earnDiamonds(1);
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
    playOrderMissSfx();
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
        <button class="modal-btn" id="repairRepBtn" ${rep >= CONFIG.REP_MAX || getCountryCash(state.activeCountry) < repairCost ? 'disabled' : ''}>
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
      const mBadge = b.manager
        ? `<span class="manager-badge">${MANAGER_BONUS_LABEL} · Lv${mLvl}</span>`
        : '';
      let staffBtn = '';
      if(!b.manager && b.level >= CONFIG.MANAGER_UNLOCK_LEVEL){
        staffBtn = `<button class="buy-btn manager-btn" data-action="manager" data-id="${def.id}" aria-label="Hire manager for ${def.name}, cost ${fmt(mCost)}" ${getCountryCash(state.activeCountry) < mCost ? 'disabled' : ''}>${MANAGER_BONUS_LABEL}<small>${fmt(mCost)}</small></button>`;
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
  function hireManager(id){
    const country = activeCountryDef();
    const def = country.businesses.find(d => d.id === id);
    const b = state.countries[country.id][id];
    const cost = managerCost(def);
    if(getCountryCash(country.id) < cost){ playErrorSfx(); return; }
    if(!spendCountryCash(country.id, cost)){ playErrorSfx(); return; }
    playBuySfx();
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
    state.cash = 0;
    COUNTRIES.forEach(c => setCountryCash(c.id, 0));
    state.totalEarned = 0;
    // Diamonds and active powerups persist across prestige
    earnDiamonds(Math.max(1, Math.floor(potential / 5))); // bonus diamonds for retiring
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

