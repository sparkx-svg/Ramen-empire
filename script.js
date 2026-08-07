/**
 * Ramen Empire: AAA Studio Edition (GDD 1-13 Master Engine)
 * Features Live 2D Canvas Scene Renderer, All 13 GDD Systems,
 * Collections Compendium, Legendary Relics, and 100% Free VIP Pass.
 */

// --- 1. FULL 13-PART GDD CATALOGS ---

const AAA_CATALOG = {
    // Part 1 & 2: Stations & Layout
    stations: [
        { id: 'st_noodles', name: 'Noodle Kneading & Strainer Station', cost: 15, baseRps: 1.0, icon: '🍜', desc: 'Crafts fresh wheat and egg noodles.' },
        { id: 'st_broth', name: 'Broth Cauldron Pressure Vat', cost: 100, baseRps: 5.0, icon: '🍲', desc: 'Simmers 18-hour bone marrow broth.' },
        { id: 'st_toppings', name: 'Gourmet Topping Torch Station', cost: 1100, baseRps: 25.0, icon: '🥩', desc: 'Sears Chashu, Ajitsuke Tamago & Nori.' },
        { id: 'st_drinks', name: 'Artisan Tea & Craft Sake Bar', cost: 12000, baseRps: 120.0, icon: '🍵', desc: 'Serves Yuzu Soda, Sake & Matcha.' },
        { id: 'st_desserts', name: 'Mochi & Ice Cream Counter', cost: 130000, baseRps: 650.0, icon: '🍨', desc: 'Serves Black Sesame Mochi & Ice Cream.' }
    ],

    // Part 3 & 11: Recipe Book & Collection
    recipes: [
        { id: 'rec_shoyu', name: 'Tokyo Shoyu Ramen', cost: 50, priceMult: 1.25, icon: '🥣', desc: 'Classic soy sauce base with clear chicken broth.' },
        { id: 'rec_miso', name: 'Hokkaido Miso Special', cost: 500, priceMult: 1.6, icon: '🍲', desc: 'Soybean paste with garlic butter & corn.' },
        { id: 'rec_tonkotsu', name: 'Hakata Tonkotsu', cost: 5000, priceMult: 2.2, icon: '🐖', desc: 'Rich 18-hour simmered pork bone soup.' },
        { id: 'rec_black_garlic', name: 'Mayu Black Garlic', cost: 50000, priceMult: 3.2, icon: '🧄', desc: 'Charred garlic sesame oil drizzle.' },
        { id: 'rec_truffle', name: 'Black Truffle Shio', cost: 500000, priceMult: 5.5, icon: '🍄', desc: 'Shaved winter truffles with sea salt broth.' },
        { id: 'rec_wagyu', name: 'A5 Wagyu Char Siu Special', cost: 10000000, priceMult: 10.0, icon: '🥩', desc: 'Melt-in-your-mouth marbled A5 Wagyu slices.' }
    ],

    // Part 4 & 12: Staff & Legendary Chefs
    staffRoles: [
        { id: 'staff_head_chef', name: 'Head Executive Chef', cost: 200, rpsAdd: 10, icon: '👨‍🍳', desc: 'Automates main kitchen boiling.' },
        { id: 'staff_waiter', name: 'Floor Waiter', cost: 1000, rpsAdd: 45, icon: '🏃‍♂️', desc: 'Increases table serving speed.' },
        { id: 'staff_cashier', name: 'Express Cashier', cost: 8000, rpsAdd: 220, icon: '🪙', desc: 'Boosts customer checkout throughput.' },
        { id: 'staff_cleaner', name: 'Cleaning Specialist', cost: 60000, rpsAdd: 1100, icon: '🧹', desc: 'Maintains 100% restaurant cleanliness.' },
        { id: 'staff_driver', name: 'Delivery Scooter Driver', cost: 500000, rpsAdd: 5500, icon: '🛵', desc: 'Handles citywide delivery orders.' }
    ],

    // Part 12: Legendary Relics & Mythic Chefs
    legendaryRelics: [
        { id: 'relic_knife', name: 'Master Chef Obsidian Knife', mult: 2.5, icon: '🔪', desc: '+150% All Cooking Station Speed' },
        { id: 'relic_bowl', name: 'Golden Imperial Broth Bowl', mult: 5.0, icon: '✨', desc: '+400% All Menu Selling Prices' },
        { id: 'relic_cat', name: 'Lucky Fortune Beckoning Cat', mult: 3.0, icon: '🐱', desc: '+200% Customer Traffic & Tips' }
    ],

    // Part 1 & 7: Cities & Franchise Expansion
    cities: [
        { id: 'city_tokyo', name: 'Tokyo Flagship', cost: 0, mult: 1.0, icon: '🏮', desc: 'Traditional street alley starting location.' },
        { id: 'city_osaka', name: 'Osaka Dotonbori', cost: 50000, mult: 4.0, icon: '🐙', desc: 'Famous street food and nightlife district.' },
        { id: 'city_sapporo', name: 'Sapporo Snow Festival', cost: 2000000, mult: 18.0, icon: '❄️', desc: 'Cold climate miso broth paradise.' },
        { id: 'city_shibuya', name: 'Cyber Shibuya 2077', cost: 100000000, mult: 85.0, icon: '🌆', desc: 'Futuristic automated dining tower.' },
        { id: 'city_paris', name: 'Paris Champs-Élysées', cost: 5000000000, mult: 400.0, icon: '🥐', desc: '3-Star Michelin luxury palace.' }
    ]
};


// --- 2. GAME STATE ---

class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.yen = 0;
        this.lifetimeYen = 0;
        this.gems = 100; // Free Gems
        this.michelinStars = 0;
        this.fame = 100;
        this.businessLevel = 1;
        this.satisfaction = 99;
        this.cleanliness = 100;
        this.activeCityId = 'city_tokyo';
        this.activeTheme = 'cyberpunk';
        this.vipUnlocked = true; // 100% Free VIP Pass
        this.lastSaveTime = Date.now();

        this.stations = {};
        AAA_CATALOG.stations.forEach(s => this.stations[s.id] = 1);

        this.recipes = { 'rec_shoyu': 1 };
        this.staff = {};
        AAA_CATALOG.staffRoles.forEach(st => this.staff[st.id] = 0);

        this.relics = {};

        this.cities = { 'city_tokyo': true };

        this.reviews = [
            { name: 'Food Critic Ramsay', rating: '★★★★★', text: 'Unbelievable Tonkotsu richness! 3 Stars.' },
            { name: 'Anime Influencer Rin', rating: '★★★★★', text: 'The atmosphere and Cyber-Glow broth are divine.' }
        ];

        this.guild = { name: 'Dragon Noodle Guild', members: 50, rank: 1 };
        this.customs = { theme: 'cyberpunk', outfit: 'Master Executive', lighting: 'Neon Spotlight' };
    }
}


// --- 3. LIVE 2D KITCHEN SCENE CANVAS RENDERER ---

class KitchenSceneCanvas {
    constructor() {
        this.canvas = document.getElementById('kitchenSceneCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.chefX = 50;
        this.scooterX = 50;
        this.elevatorY = 30;
        this.direction = 1;

        if (this.canvas) {
            this.animate();
        }
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background Floor
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.fillRect(0, 120, this.canvas.width, 40);

        // Chef Animation
        this.chefX += 1.2 * this.direction;
        if (this.chefX > 220 || this.chefX < 30) this.direction *= -1;

        this.ctx.font = '28px sans-serif';
        this.ctx.fillText('👨‍🍳', this.chefX, 110);
        this.ctx.fillText('🍲', 140, 110);
        this.ctx.fillText('🍜', 280, 110);

        // Elevator Shaft Animation
        this.elevatorY += 0.8 * this.direction;
        this.ctx.fillStyle = 'rgba(255, 184, 0, 0.2)';
        this.ctx.fillRect(380, 20, 40, 120);
        this.ctx.fillText('🛗', 386, 40 + (Math.sin(Date.now() / 300) * 40 + 40));

        // Delivery Scooter Animation
        this.scooterX = (this.scooterX + 2) % (this.canvas.width - 80);
        this.ctx.fillText('🛵💨', 450 + (this.scooterX / 3), 110);

        requestAnimationFrame(() => this.animate());
    }
}


// --- 4. PARTICLES CANVAS ENGINE ---

class ParticleCanvasEngine {
    constructor() {
        this.canvas = document.getElementById('bgParticleCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
        this.activeTheme = 'cyberpunk';

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initParticles();
            this.animate();
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setTheme(theme) {
        this.activeTheme = theme;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 3 + 2,
                speedY: Math.random() * 1.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.8,
                opacity: Math.random() * 0.6 + 0.2
            });
        }
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y > this.canvas.height) { p.y = -10; p.x = Math.random() * this.canvas.width; }

            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;

            if (this.activeTheme === 'cyberpunk') {
                this.ctx.fillStyle = '#00F2FE';
                this.ctx.fillRect(p.x, p.y, 2, p.size * 4);
            } else if (this.activeTheme === 'cozy') {
                this.ctx.fillStyle = '#EC4899';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#D97706';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });

        requestAnimationFrame(() => this.animate());
    }
}


// --- 5. WEB AUDIO SOUND ENGINE ---

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.bgmEnabled = false;
        this.bgmInterval = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    playSfx(freq, type = 'sine', duration = 0.1, gainVal = 0.12) {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    toggleBgm() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgmEnabled) this.startBgm();
        else this.stopBgm();
        return this.bgmEnabled;
    }

    startBgm() {
        this.init();
        if (this.bgmInterval) clearInterval(this.bgmInterval);
        const notes = [261.63, 329.63, 392.00, 523.25];
        let idx = 0;
        this.bgmInterval = setInterval(() => {
            if (!this.bgmEnabled) return;
            this.playSfx(notes[idx % notes.length], 'sine', 0.8, 0.05);
            idx++;
        }, 1200);
    }

    stopBgm() { if (this.bgmInterval) clearInterval(this.bgmInterval); }
}


// --- 6. MASTER GAME ENGINE ---

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

    // --- Actions ---

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
