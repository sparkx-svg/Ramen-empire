/**
 * js/02-state-persistence.js
 * State Management & LocalStorage Persistence
 */

class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.yen = 0;
        this.lifetimeYen = 0;
        this.gems = 100;
        this.michelinStars = 0;
        this.fame = 100;
        this.businessLevel = 1;
        this.satisfaction = 99;
        this.cleanliness = 100;
        this.activeCityId = 'city_tokyo';
        this.activeTheme = 'cyberpunk';
        this.vipUnlocked = true;
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
