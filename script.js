(function(){
  "use strict";

  const BUSINESS_DEFS = [
    {id:'cart',   name:'Street Cart',       icon:'🛒', baseCost:10,      baseIncome:0.5,   unlockAt:0},
    {id:'stall',  name:'Noodle Stall',      icon:'🏮', baseCost:100,     baseIncome:4,     unlockAt:0},
    {id:'shop',   name:'Corner Shop',       icon:'🏠', baseCost:1100,    baseIncome:30,    unlockAt:0},
    {id:'diner',  name:'Family Diner',      icon:'🍽️', baseCost:12000,   baseIncome:200,   unlockAt:5},
    {id:'chain',  name:'City Chain',        icon:'🏢', baseCost:130000,  baseIncome:1400,  unlockAt:5},
    {id:'factory',name:'Broth Factory',     icon:'🏭', baseCost:1400000, baseIncome:9000,  unlockAt:10},
    {id:'mall',   name:'Mall Franchise',    icon:'🏬', baseCost:2e7,     baseIncome:55000, unlockAt:10},
    {id:'global', name:'Global Empire HQ',  icon:'🌆', baseCost:3.3e8,   baseIncome:330000,unlockAt:15},
  ];
  const COST_GROWTH = 1.15;
  const MANAGER_COST_MULT = 80;

  // Set to true only once a real rewarded-ad SDK (AdMob, etc.) is wired into
  // doubleOfflineBtn's click handler below. Until then this stays false so the
  // button is hidden rather than silently doubling rewards for a "watch ad"
  // that never actually shows an ad.
  const FEATURES = { adsEnabled: false };

  // upgrade tier definitions: type -> {icon, label, boostPerLevel, costMult, costGrowth, maxLevel}
  const UPGRADE_TYPES = {
    speed:    {icon:'⚡', label:'Speed',    boost:0.08, costMult:0.6, costGrowth:1.12, max:20},
    capacity: {icon:'📦', label:'Capacity', boost:0.15, costMult:2.2, costGrowth:1.16, max:20},
    quality:  {icon:'✨', label:'Quality',  boost:0.25, costMult:6,   costGrowth:1.22, max:20},
  };

  const ACHIEVEMENTS = [
    {id:'first_bowl',  icon:'🥢', name:'First Bowl',       desc:'Tap the bowl once',              reward:0.01, cond: s => s.totalTaps >= 1},
    {id:'open_shop',   icon:'🏮', name:'Open For Business', desc:'Open your first business',       reward:0.01, cond: s => Object.values(s.businesses).some(b=>b.level>0)},
    {id:'fast_hands',  icon:'👋', name:'Fast Hands',        desc:'Tap the bowl 100 times',          reward:0.02, cond: s => s.totalTaps >= 100},
    {id:'century',     icon:'💴', name:'Century Club',      desc:'Earn ¥1,000 total',               reward:0.01, cond: s => s.totalEarned >= 1000},
    {id:'millionaire', icon:'💰', name:'Millionaire',       desc:'Earn ¥1,000,000 total',           reward:0.03, cond: s => s.totalEarned >= 1e6},
    {id:'empire',      icon:'🌆', name:'Empire Builder',    desc:'Earn ¥100,000,000 total',         reward:0.05, cond: s => s.totalEarned >= 1e8},
    {id:'full_house',  icon:'🗾', name:'Full House',        desc:'Open all 8 business types',       reward:0.03, cond: s => Object.values(s.businesses).every(b=>b.level>0)},
    {id:'master_chef', icon:'👨‍🍳', name:'Master Chef',       desc:'Reach Quality level 10 on any shop', reward:0.02, cond: s => Object.values(s.businesses).some(b=>b.quality>=10)},
    {id:'first_prestige',icon:'⭐', name:'First Retirement', desc:'Prestige once',                  reward:0.03, cond: s => s.prestigeCount >= 1},
    {id:'ten_prestige', icon:'🌟', name:'Serial Retiree',   desc:'Prestige 10 times',               reward:0.05, cond: s => s.prestigeCount >= 10},
    {id:'critic_5',     icon:'📰', name:"Critic's Choice",  desc:'Experience 5 Food Critic events',  reward:0.02, cond: s => s.criticEventsSeen >= 5},
    {id:'inspector_pass',icon:'🕵️', name:'Inspection Passed', desc:'Clear a Health Inspector event by tapping', reward:0.02, cond: s => s.inspectorsPassed >= 1},
  ];

  let state = {
    cash: 0,
    totalEarned: 0,
    prestigePoints: 0,
    prestigeCount: 0,
    businesses: {}, // id -> {level, manager, speed, capacity, quality}
    lastSeen: Date.now(),
    totalTaps: 0,
    criticEventsSeen: 0,
    inspectorsPassed: 0,
    achievementsClaimed: {},
    achievementBonus: 0,
    integrityFlag: false
  };

  function freshBusiness(){ return {level:0, manager:false, speed:0, capacity:0, quality:0}; }
  BUSINESS_DEFS.forEach(b => state.businesses[b.id] = freshBusiness());

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
  }
  function load(){
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return;
    try{
      const loaded = JSON.parse(raw);
      const savedChecksum = loaded.__checksum;
      const valid = savedChecksum !== undefined && savedChecksum === computeChecksum(loaded);
      state = Object.assign(state, loaded);
      state.integrityFlag = !valid;
      if(!valid) console.warn('Ramen Empire: save checksum mismatch — state may have been edited outside the game.');
      BUSINESS_DEFS.forEach(b => {
        if(!state.businesses[b.id]) state.businesses[b.id] = freshBusiness();
        const biz = state.businesses[b.id];
        if(biz.speed === undefined) biz.speed = 0;
        if(biz.capacity === undefined) biz.capacity = 0;
        if(biz.quality === undefined) biz.quality = 0;
      });
      if(!state.achievementsClaimed) state.achievementsClaimed = {};
      if(state.achievementBonus === undefined) state.achievementBonus = 0;
      if(state.totalTaps === undefined) state.totalTaps = 0;
      if(state.criticEventsSeen === undefined) state.criticEventsSeen = 0;
      if(state.inspectorsPassed === undefined) state.inspectorsPassed = 0;
      if(state.prestigeCount === undefined) state.prestigeCount = 0;
    }catch(e){ console.warn('save corrupt, starting fresh'); }
  }

  // ---------- math ----------
  function prestigeMultiplier(){ return 1 + state.prestigePoints * 0.02; }
  function globalMultiplier(){ return prestigeMultiplier() * (1 + state.achievementBonus); }
  function businessCost(def, level){ return def.baseCost * Math.pow(COST_GROWTH, level); }
  function upgradeCost(def, type, level){
    const t = UPGRADE_TYPES[type];
    return def.baseCost * t.costMult * Math.pow(t.costGrowth, level);
  }
  function businessUpgradeMult(b){
    return (1 + b.speed*UPGRADE_TYPES.speed.boost) * (1 + b.capacity*UPGRADE_TYPES.capacity.boost) * (1 + b.quality*UPGRADE_TYPES.quality.boost);
  }
  function businessIncome(def, b){
    return def.baseIncome * b.level * (1 + b.level*0.01) * businessUpgradeMult(b);
  }
  function businessIncomeWithManager(def, b){
    return businessIncome(def, b) * (b.manager ? 1.5 : 1);
  }
  function managerCost(def){ return def.baseCost * MANAGER_COST_MULT; }

  function eventMultiplier(){
    if(activeEvent.type === 'critic') return 2.5;
    if(activeEvent.type === 'inspector') return 0.4;
    return 1;
  }

  function totalRatePerSec(){
    let total = 0;
    BUSINESS_DEFS.forEach(def => {
      const b = state.businesses[def.id];
      if(b.level > 0){
        total += businessIncomeWithManager(def, b);
      }
    });
    return total * globalMultiplier() * eventMultiplier();
  }
  function nextTapGain(){
    return (1 + state.totalEarned * 0.00001) * globalMultiplier();
  }
  function fmt(n){
    if(n < 1000) return '¥' + n.toFixed(n < 10 ? 1 : 0);
    const units = ['K','M','B','T','Qa','Qi','Sx','Sp'];
    let u = -1;
    while(n >= 1000 && u < units.length - 1){ n /= 1000; u++; }
    return '¥' + n.toFixed(2) + units[u];
  }

  // ---------- random events ----------
  let activeEvent = {type:null, endsAt:0, tapsNeeded:0, tapsDone:0};
  let nextEventCheck = Date.now() + 15000;

  function maybeTriggerEvent(){
    if(activeEvent.type) return;
    if(Date.now() < nextEventCheck) return;
    nextEventCheck = Date.now() + 15000;
    if(Math.random() < 0.12){
      if(Math.random() < 0.7) startCriticEvent();
      else startInspectorEvent();
    }
  }
  function startCriticEvent(){
    activeEvent = {type:'critic', endsAt: Date.now() + 60000, tapsNeeded:0, tapsDone:0};
    state.criticEventsSeen++;
    renderEventBanner();
  }
  function startInspectorEvent(){
    activeEvent = {type:'inspector', endsAt: Date.now() + 20000, tapsNeeded:15, tapsDone:0};
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
      document.getElementById('eventText').textContent = 'Food Critic visiting! Income x2.5';
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
  const bizPanel = document.getElementById('bizPanel');
  function renderBusinesses(){
    bizPanel.innerHTML = '';
    BUSINESS_DEFS.forEach((def, idx) => {
      const b = state.businesses[def.id];
      const prevDef = BUSINESS_DEFS[idx-1];
      const locked = idx > 0 && b.level === 0 && (!prevDef || state.businesses[prevDef.id].level < def.unlockAt) && def.unlockAt > 0;
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
            <div class="biz-name">${def.name} ${b.manager ? '<span class="manager-badge">+50%</span>' : ''}${b.level>0 ? '<span class="expand-caret'+(isOpen?' open':'')+'" aria-hidden="true">▶</span>':''}</div>
            <div class="biz-level">Level ${b.level}</div>
            <div class="biz-income">${b.level>0 ? fmt(income)+'/s' : 'Not opened yet'}</div>
          </div>
          ${!b.manager && b.level >= 5 ? `<button class="buy-btn manager-btn" data-action="manager" data-id="${def.id}" aria-label="Hire manager for ${def.name}, cost ${fmt(mCost)}" ${state.cash < mCost ? 'disabled' : ''}>+50%<small>${fmt(mCost)}</small></button>` : ''}
          <button class="buy-btn" data-action="buy" data-id="${def.id}" aria-label="${buyLabel}" ${!canAfford || locked ? 'disabled' : ''}>${b.level===0?'OPEN':'UPGRADE'}<small>${fmt(cost)}</small></button>
        </div>
        ${b.level > 0 ? `<div class="upgrade-panel${isOpen?' open':''}"><div class="upgrade-row">${upgradeChips}</div></div>` : ''}
      `;
      bizPanel.appendChild(card);
    });
  }

  function renderAchievements(){
    const panel = document.getElementById('achPanel');
    panel.innerHTML = '';
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
    document.getElementById('achDot').classList.toggle('show', anyUnclaimed);
  }

  function renderStats(){
    document.getElementById('cashDisplay').textContent = fmt(state.cash);
    document.getElementById('rateDisplay').textContent = fmt(totalRatePerSec()) + '/s';
    document.getElementById('prestigeDisplay').textContent = Math.floor(state.prestigePoints);
    document.getElementById('multiplierDisplay').textContent = 'x' + globalMultiplier().toFixed(2);
    const potential = Math.floor(Math.sqrt(state.totalEarned / 1e6));
    document.getElementById('prestigePreview').textContent = '+' + potential;
    document.getElementById('prestigeBtn').disabled = potential <= 0;
  }

  // ---------- actions ----------
  function buyBusiness(id){
    const def = BUSINESS_DEFS.find(d => d.id === id);
    const b = state.businesses[id];
    const cost = businessCost(def, b.level);
    if(state.cash < cost) return;
    state.cash -= cost;
    b.level++;
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function hireManager(id){
    const def = BUSINESS_DEFS.find(d => d.id === id);
    const b = state.businesses[id];
    const cost = managerCost(def);
    if(state.cash < cost) return;
    state.cash -= cost;
    b.manager = true;
    renderBusinesses(); renderStats();
  }
  function buyUpgrade(id, type){
    const def = BUSINESS_DEFS.find(d => d.id === id);
    const b = state.businesses[id];
    const t = UPGRADE_TYPES[type];
    if(b[type] >= t.max) return;
    const cost = upgradeCost(def, type, b[type]);
    if(state.cash < cost) return;
    state.cash -= cost;
    b[type]++;
    renderBusinesses(); renderStats(); checkAchievements();
  }
  function doPrestige(){
    const potential = Math.floor(Math.sqrt(state.totalEarned / 1e6));
    if(potential <= 0) return;
    state.prestigePoints += potential;
    state.prestigeCount++;
    state.cash = 0;
    state.totalEarned = 0;
    BUSINESS_DEFS.forEach(def => state.businesses[def.id] = freshBusiness());
    save();
    renderBusinesses(); renderStats(); checkAchievements();
  }

  function checkAchievements(){
    renderAchievements();
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
      if(state.businesses[id].level === 0) return;
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
    const btn = e.target.closest('[data-action="claim"]');
    if(!btn) return;
    claimAchievement(btn.dataset.id);
  });
  function closeAchModal(){ closeModal(document.getElementById('achModal')); }
  document.getElementById('achModalClose').addEventListener('click', closeAchModal);
  document.getElementById('achModal').addEventListener('modal-dismiss', closeAchModal);

  // ---------- tap to earn ----------
  const bowlWrap = document.getElementById('bowlWrap');
  const tapZone = document.getElementById('tapZone');
  function handleTap(){
    state.totalTaps++;
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
    el.style.left = (45 + Math.random()*10) + '%';
    tapZone.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ---------- nav ----------
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.panel-view').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(btn.dataset.panel).classList.add('active');
      if(btn.dataset.panel === 'achPanel') renderAchievements();
    });
  });

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
    const elapsedSec = Math.min((now - state.lastSeen) / 1000, 4 * 3600);
    if(elapsedSec < 30) return;
    const rate = totalRatePerSec();
    if(rate <= 0) return;
    pendingOfflineGain = rate * elapsedSec * 0.5;
    if(pendingOfflineGain < 1) return;
    document.getElementById('offlineText').textContent =
      `While you were away for ${Math.round(elapsedSec/60)} min, your shops earned ${fmt(pendingOfflineGain)}.`;
    openModal(document.getElementById('offlineModal'));
  }
  function collectOffline(multiplier){
    const amount = pendingOfflineGain * multiplier;
    state.cash += amount;
    state.totalEarned += amount;
    closeModal(document.getElementById('offlineModal'));
    renderStats(); checkAchievements();
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
    collectOffline(2);
  });

  // ---------- game loop ----------
  let lastTick = Date.now();
  function tick(){
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    // Businesses keep producing passively even during a health inspector event;
    // eventMultiplier() already applies the 0.4x penalty inside totalRatePerSec().
    const gain = totalRatePerSec() * dt;
    if(gain > 0){
      state.cash += gain;
      state.totalEarned += gain;
    }
    maybeTriggerEvent();
    tickEvent();
    renderStats();
    requestAnimationFrame(tick);
  }

  setInterval(() => { renderBusinesses(); checkAchievements(); }, 1000);
  setInterval(save, 10000);

  // ---------- init ----------
  load();
  checkOfflineEarnings();
  renderBusinesses();
  renderAchievements();
  renderStats();
  requestAnimationFrame(tick);

  window.addEventListener('beforeunload', save);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if(document.hidden) save(); });

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
    });
  }

})();
