/**
 * js/04-auth-main.js
 * Master Initialization & Event Dispatcher Module
 */

class MasterAaaEngine {
    constructor() {
        this.state = new GameState();
        this.sound = new SoundEngine();
        this.particles = new ParticleCanvasEngine();
        this.scene = new KitchenSceneCanvas();

        this.init();
    }

    init() {
        this.loadGame();
        this.bindEvents();
        this.applyTheme(this.state.activeTheme);
        this.renderAll();

        setInterval(() => this.gameTick(0.1), 100);
        setInterval(() => this.saveGame(), 10000);

        this.checkOffline();
    }

    applyTheme(theme) {
        this.state.activeTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.particles.setTheme(theme);

        const select = document.getElementById('themeSelect');
        if (select) select.value = theme;
    }

    getRevenuePerSecond() {
        let rps = 0;

        AAA_CATALOG.stations.forEach(s => {
            const lvl = this.state.stations[s.id] || 0;
            rps += s.baseRps * lvl;
        });

        AAA_CATALOG.staffRoles.forEach(st => {
            const count = this.state.staff[st.id] || 0;
            rps += st.rpsAdd * count;
        });

        let recipeMult = 1.0;
        AAA_CATALOG.recipes.forEach(r => {
            if (this.state.recipes[r.id]) recipeMult *= r.priceMult;
        });

        let relicMult = 1.0;
        AAA_CATALOG.legendaryRelics.forEach(rel => {
            if (this.state.relics[rel.id]) relicMult *= rel.mult;
        });

        const cityObj = AAA_CATALOG.cities.find(c => c.id === this.state.activeCityId);
        const cityMult = cityObj ? cityObj.mult : 1.0;

        return rps * recipeMult * relicMult * cityMult;
    }

    gameTick(delta) {
        const rps = this.getRevenuePerSecond();
        const earned = rps * delta;

        this.state.yen += earned;
        this.state.lifetimeYen += earned;

        if (this.state.lifetimeYen > this.state.businessLevel * 5000) {
            this.state.businessLevel += 1;
            this.state.gems += 10;
            this.showToast(`🎉 Business Level Up! Now Level ${this.state.businessLevel} (+10 Free Gems)`);
        }

        this.renderStats();
    }

    renderAll() {
        this.renderStats();
        this.renderStations();
        this.renderRecipes();
        this.renderStaff();
        this.renderLegendary();
        this.renderReviews();
        this.renderCities();
        this.renderCollections();
        this.renderShop();
        this.renderQueueGrid();
    }

    renderStats() {
        document.getElementById('yenVal').textContent = '¥' + this.formatNum(this.state.yen);
        document.getElementById('gemsVal').textContent = this.formatNum(this.state.gems);
        document.getElementById('michelinVal').textContent = `★ ${this.state.michelinStars} (Fame: ${this.formatNum(this.state.fame)})`;
        document.getElementById('businessLvlVal').textContent = this.state.businessLevel;

        document.getElementById('rpsVal').textContent = '¥' + this.formatNum(this.getRevenuePerSecond(), 1) + '/s';
        document.getElementById('satisfactionVal').textContent = this.state.satisfaction + '%';
        document.getElementById('cleanVal').textContent = this.state.cleanliness + '%';

        const cityObj = AAA_CATALOG.cities.find(c => c.id === this.state.activeCityId);
        if (cityObj) {
            document.getElementById('locBadge').textContent = `City Branch: ${cityObj.name}`;
            document.getElementById('locTitle').textContent = `${cityObj.name} Ramen Flagship`;
        }
    }

    renderStations() {
        const container = document.getElementById('kitchenStationsList');
        if (!container) return;

        container.innerHTML = AAA_CATALOG.stations.map(s => {
            const lvl = this.state.stations[s.id] || 0;
            const cost = Math.floor(s.cost * Math.pow(1.15, lvl));

            return `
                <div class="item-card">
                    <div class="item-left">
                        <div class="item-icon">${s.icon}</div>
                        <div class="item-details">
                            <h4>${s.name} <span class="text-gold">(Lvl ${lvl})</span></h4>
                            <p>${s.desc}</p>
                            <span class="item-effect">+${s.baseRps * (lvl + 1)} Yen/sec</span>
                        </div>
                    </div>
                    <div class="item-right">
                        <button class="buy-btn" onclick="gameEngine.upgradeStation('${s.id}')" ${this.state.yen < cost ? 'disabled' : ''}>
                            Upgrade ¥${this.formatNum(cost)}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecipes() {
        const container = document.getElementById('recipeBookList');
        if (!container) return;

        container.innerHTML = AAA_CATALOG.recipes.map(r => {
            const unlocked = this.state.recipes[r.id];
            return `
                <div class="item-card">
                    <div class="item-left">
                        <div class="item-icon">${r.icon}</div>
                        <div class="item-details">
                            <h4>${r.name}</h4>
                            <p>${r.desc}</p>
                            <span class="item-effect">${r.priceMult}x Price Boost</span>
                        </div>
                    </div>
                    <div class="item-right">
                        ${unlocked ? '<span class="text-green"><i class="fa-solid fa-check"></i> Mastered</span>' : `
                            <button class="buy-btn" onclick="gameEngine.unlockRecipe('${r.id}')" ${this.state.yen < r.cost ? 'disabled' : ''}>
                                Master ¥${this.formatNum(r.cost)}
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStaff() {
        const container = document.getElementById('staffAcademyList');
        if (!container) return;

        container.innerHTML = AAA_CATALOG.staffRoles.map(st => {
            const count = this.state.staff[st.id] || 0;
            const cost = Math.floor(st.cost * Math.pow(1.18, count));

            return `
                <div class="item-card">
                    <div class="item-left">
                        <div class="item-icon">${st.icon}</div>
                        <div class="item-details">
                            <h4>${st.name} <span class="text-purple">(Hired: ${count})</span></h4>
                            <p>${st.desc}</p>
                            <span class="item-effect">+${st.rpsAdd} Yen/s</span>
                        </div>
                    </div>
                    <div class="item-right">
                        <button class="buy-btn" onclick="gameEngine.hireStaff('${st.id}')" ${this.state.yen < cost ? 'disabled' : ''}>
                            Hire ¥${this.formatNum(cost)}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderLegendary() {
        const container = document.getElementById('legendaryList');
        if (!container) return;

        container.innerHTML = AAA_CATALOG.legendaryRelics.map(rel => {
            const unlocked = this.state.relics[rel.id];
            return `
                <div class="item-card">
                    <div class="item-left">
                        <div class="item-icon">${rel.icon}</div>
                        <div class="item-details">
                            <h4>${rel.name}</h4>
                            <p>${rel.desc}</p>
                            <span class="item-effect">${rel.mult}x Global Boost</span>
                        </div>
                    </div>
                    <div class="item-right">
                        ${unlocked ? '<span class="text-gold"><i class="fa-solid fa-check"></i> Relic Active</span>' : `
                            <button class="btn btn-purple" onclick="gameEngine.unlockRelic('${rel.id}')">
                                Unlock 💎25 Gems
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderReviews() {
        const container = document.getElementById('customerReviewsList');
        if (!container) return;

        container.innerHTML = this.state.reviews.map(rev => `
            <div class="item-card">
                <div class="item-left">
                    <div class="item-icon">💬</div>
                    <div class="item-details">
                        <h4>${rev.name} <span class="text-gold">${rev.rating}</span></h4>
                        <p>"${rev.text}"</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderCities() {
        const container = document.getElementById('cityFranchiseList');
        if (!container) return;

        container.innerHTML = AAA_CATALOG.cities.map(c => {
            const unlocked = this.state.cities[c.id];
            const isCurrent = this.state.activeCityId === c.id;

            return `
                <div class="item-card">
                    <div class="item-left">
                        <div class="item-icon">${c.icon}</div>
                        <div class="item-details">
                            <h4>${c.name}</h4>
                            <p>${c.desc}</p>
                            <span class="item-effect">${c.mult}x Global Revenue Multiplier</span>
                        </div>
                    </div>
                    <div class="item-right">
                        ${isCurrent ? '<span class="text-gold">Active Branch</span>' : (unlocked ? `
                            <button class="btn btn-secondary" onclick="gameEngine.switchCity('${c.id}')">Relocate</button>
                        ` : `
                            <button class="buy-btn" onclick="gameEngine.unlockCity('${c.id}')" ${this.state.yen < c.cost ? 'disabled' : ''}>
                                Expand ¥${this.formatNum(c.cost)}
                            </button>
                        `)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCollections() {
        const container = document.getElementById('collectionsList');
        if (!container) return;

        container.innerHTML = `
            <div class="item-card">
                <div class="item-left">
                    <div class="item-icon">📖</div>
                    <div class="item-details">
                        <h4>Recipe Encyclopedia</h4>
                        <p>Mastered: ${Object.keys(this.state.recipes).length}/${AAA_CATALOG.recipes.length}</p>
                    </div>
                </div>
            </div>
            <div class="item-card">
                <div class="item-left">
                    <div class="item-icon">📜</div>
                    <div class="item-details">
                        <h4>Relic Artifacts Collection</h4>
                        <p>Unlocked: ${Object.keys(this.state.relics).length}/${AAA_CATALOG.legendaryRelics.length}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderShop() {
        const container = document.getElementById('f2pShopContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="item-card">
                <div class="item-left">
                    <div class="item-icon">🎁</div>
                    <div class="item-details">
                        <h4>100% Free Starter Pack</h4>
                        <p>Claim Free ¥10,000 + 💎50 Soul Gems!</p>
                    </div>
                </div>
                <div class="item-right">
                    <button class="btn btn-primary" onclick="gameEngine.claimFreeStarterPack()">Claim Pack</button>
                </div>
            </div>
        `;
    }

    renderQueueGrid() {
        const container = document.getElementById('queueGrid');
        if (!container) return;

        const customerTypes = ['Student 🎒', 'Office Worker 💼', 'Tourist 📸', 'Food Critic 📝', 'VIP Celebrity 🌟'];
        container.innerHTML = customerTypes.map(c => `
            <div class="queue-card" style="background: rgba(255,255,255,0.04); padding: 8px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5rem;">${c.split(' ')[1]}</div>
                <span style="font-size: 0.75rem; font-weight: 700;">${c.split(' ')[0]}</span>
            </div>
        `).join('');
    }

    upgradeStation(id) {
        const s = AAA_CATALOG.stations.find(x => x.id === id);
        const lvl = this.state.stations[id] || 0;
        const cost = Math.floor(s.cost * Math.pow(1.15, lvl));

        if (this.state.yen >= cost) {
            this.state.yen -= cost;
            this.state.stations[id] = lvl + 1;
            this.sound.playSfx(880, 'sine', 0.1, 0.2);
            this.renderStations();
            this.renderStats();
        } else {
            this.showToast('⚠️ Not enough Yen!');
        }
    }

    unlockRecipe(id) {
        const r = AAA_CATALOG.recipes.find(x => x.id === id);
        if (this.state.yen >= r.cost && !this.state.recipes[id]) {
            this.state.yen -= r.cost;
            this.state.recipes[id] = 1;
            this.sound.playSfx(880, 'sine', 0.15, 0.2);
            this.renderRecipes();
            this.renderStats();
            this.showToast(`🍜 Mastered ${r.name}!`);
        }
    }

    hireStaff(id) {
        const st = AAA_CATALOG.staffRoles.find(x => x.id === id);
        const count = this.state.staff[id] || 0;
        const cost = Math.floor(st.cost * Math.pow(1.18, count));

        if (this.state.yen >= cost) {
            this.state.yen -= cost;
            this.state.staff[id] = count + 1;
            this.sound.playSfx(880, 'sine', 0.1, 0.2);
            this.renderStaff();
            this.renderStats();
        }
    }

    unlockRelic(id) {
        if (this.state.gems >= 25 && !this.state.relics[id]) {
            this.state.gems -= 25;
            this.state.relics[id] = true;
            this.sound.playSfx(1046, 'triangle', 0.2, 0.25);
            this.renderLegendary();
            this.renderStats();
            this.showToast(`✨ Unlocked Legendary Relic!`);
        } else {
            this.showToast('⚠️ Requires 💎25 Gems!');
        }
    }

    unlockCity(id) {
        const c = AAA_CATALOG.cities.find(x => x.id === id);
        if (this.state.yen >= c.cost && !this.state.cities[id]) {
            this.state.yen -= c.cost;
            this.state.cities[id] = true;
            this.state.activeCityId = id;
            this.sound.playSfx(1046, 'square', 0.2, 0.2);
            this.renderCities();
            this.renderStats();
            this.showToast(`🏮 Expanded Flagship Branch in ${c.name}!`);
        }
    }

    switchCity(id) {
        this.state.activeCityId = id;
        this.renderCities();
        this.renderStats();
        this.showToast(`🏮 Relocated to ${AAA_CATALOG.cities.find(c => c.id === id).name}!`);
    }

    claimFreeStarterPack() {
        this.state.yen += 10000;
        this.state.gems += 50;
        this.sound.playSfx(1318, 'triangle', 0.3, 0.25);
        this.showToast('🎁 Free Starter Pack Claimed! (+¥10,000 & 💎50)');
        this.renderStats();
    }

    spinLuckyWheel() {
        const reward = Math.floor(Math.random() * 5000) + 1000;
        this.state.yen += reward;
        this.sound.playSfx(1318, 'triangle', 0.3, 0.25);
        this.showToast(`🎡 Lucky Wheel Won: ¥${this.formatNum(reward)}!`);
        document.getElementById('wheelModal').classList.add('hidden');
        this.renderStats();
    }

    handleTap() {
        const rps = this.getRevenuePerSecond();
        const tapVal = Math.max(1, Math.floor(rps * 0.5));
        this.state.yen += tapVal;
        this.state.lifetimeYen += tapVal;

        this.sound.playSfx(520, 'triangle', 0.08, 0.2);
        this.renderStats();
    }

    bindEvents() {
        const tapBtn = document.getElementById('tapCookBtn');
        if (tapBtn) tapBtn.addEventListener('click', () => this.handleTap());

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-tab');
                const content = document.getElementById(targetId);
                if (content) content.classList.add('active');
            });
        });

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                this.showToast(`🎨 Theme Changed!`);
            });
        }

        const bgmBtn = document.getElementById('bgmToggleBtn');
        if (bgmBtn) {
            bgmBtn.addEventListener('click', () => {
                const active = this.sound.toggleBgm();
                this.showToast(active ? '🎵 Lo-Fi Synth Music Started' : '🔇 Music Muted');
            });
        }

        const vipBtn = document.getElementById('vipPassBtn');
        if (vipBtn) vipBtn.addEventListener('click', () => document.getElementById('vipModal').classList.remove('hidden'));

        const closeVipBtn = document.getElementById('closeVipBtn');
        if (closeVipBtn) closeVipBtn.addEventListener('click', () => document.getElementById('vipModal').classList.add('hidden'));

        document.getElementById('claimVipBonusBtn').addEventListener('click', () => {
            this.state.gems += 20;
            this.sound.playSfx(1046, 'triangle', 0.2, 0.2);
            this.showToast('🎁 Claimed VIP Bonus (+💎20 Gems)!');
            document.getElementById('vipModal').classList.add('hidden');
            this.renderStats();
        });

        const wheelBtn = document.getElementById('luckyWheelBtn');
        if (wheelBtn) wheelBtn.addEventListener('click', () => document.getElementById('wheelModal').classList.remove('hidden'));

        const spinBtn = document.getElementById('spinWheelBtn');
        if (spinBtn) spinBtn.addEventListener('click', () => this.spinLuckyWheel());

        const closeWheelBtn = document.getElementById('closeWheelBtn');
        if (closeWheelBtn) closeWheelBtn.addEventListener('click', () => document.getElementById('wheelModal').classList.add('hidden'));

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => document.getElementById('settingsModal').classList.remove('hidden'));

        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => document.getElementById('settingsModal').classList.add('hidden'));

        document.getElementById('manualSaveBtn').addEventListener('click', () => {
            this.saveGame();
            this.showToast('💾 Game Progress Saved!');
        });

        document.getElementById('resetDataBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all game data?')) {
                localStorage.removeItem('ramen_empire_aaa_v14_save');
                this.state.reset();
                this.renderAll();
                document.getElementById('settingsModal').classList.add('hidden');
                this.showToast('🧹 Game Reset Complete.');
            }
        });

        document.getElementById('claimOfflineBtn').addEventListener('click', () => {
            document.getElementById('offlineModal').classList.add('hidden');
        });
    }

    saveGame() {
        this.state.lastSaveTime = Date.now();
        localStorage.setItem('ramen_empire_aaa_v14_save', JSON.stringify(this.state));
    }

    loadGame() {
        const saved = localStorage.getItem('ramen_empire_aaa_v14_save');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(this.state, parsed);
            } catch (e) {}
        }
    }

    checkOffline() {
        const now = Date.now();
        const diffSec = (now - (this.state.lastSaveTime || now)) / 1000;
        if (diffSec > 60) {
            const earned = Math.floor(diffSec * this.getRevenuePerSecond() * 0.5);
            if (earned > 0) {
                this.state.yen += earned;
                document.getElementById('offlineTimeStr').textContent = `${Math.floor(diffSec / 3600)}h ${Math.floor((diffSec % 3600) / 60)}m`;
                document.getElementById('offlineYenStr').textContent = `¥${this.formatNum(earned)}`;
                document.getElementById('offlineModal').classList.remove('hidden');
            }
        }
    }

    formatNum(num, decimals = 0) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toFixed(decimals);
    }

    showToast(msg) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new MasterAaaEngine();
});
