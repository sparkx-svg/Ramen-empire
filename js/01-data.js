/**
 * js/01-data.js
 * Ramen Empire GDD 1-13 Catalog Data Module
 */

const AAA_CATALOG = {
    stations: [
        { id: 'st_noodles', name: 'Noodle Kneading & Strainer Station', cost: 15, baseRps: 1.0, icon: '🍜', desc: 'Crafts fresh wheat and egg noodles.' },
        { id: 'st_broth', name: 'Broth Cauldron Pressure Vat', cost: 100, baseRps: 5.0, icon: '🍲', desc: 'Simmers 18-hour bone marrow broth.' },
        { id: 'st_toppings', name: 'Gourmet Topping Torch Station', cost: 1100, baseRps: 25.0, icon: '🥩', desc: 'Sears Chashu, Ajitsuke Tamago & Nori.' },
        { id: 'st_drinks', name: 'Artisan Tea & Craft Sake Bar', cost: 12000, baseRps: 120.0, icon: '🍵', desc: 'Serves Yuzu Soda, Sake & Matcha.' },
        { id: 'st_desserts', name: 'Mochi & Ice Cream Counter', cost: 130000, baseRps: 650.0, icon: '🍨', desc: 'Serves Black Sesame Mochi & Ice Cream.' }
    ],
    recipes: [
        { id: 'rec_shoyu', name: 'Tokyo Shoyu Ramen', cost: 50, priceMult: 1.25, icon: '🥣', desc: 'Classic soy sauce base with clear chicken broth.' },
        { id: 'rec_miso', name: 'Hokkaido Miso Special', cost: 500, priceMult: 1.6, icon: '🍲', desc: 'Soybean paste with garlic butter & corn.' },
        { id: 'rec_tonkotsu', name: 'Hakata Tonkotsu', cost: 5000, priceMult: 2.2, icon: '🐖', desc: 'Rich 18-hour simmered pork bone soup.' },
        { id: 'rec_black_garlic', name: 'Mayu Black Garlic', cost: 50000, priceMult: 3.2, icon: '🧄', desc: 'Charred garlic sesame oil drizzle.' },
        { id: 'rec_truffle', name: 'Black Truffle Shio', cost: 500000, priceMult: 5.5, icon: '🍄', desc: 'Shaved winter truffles with sea salt broth.' },
        { id: 'rec_wagyu', name: 'A5 Wagyu Char Siu Special', cost: 10000000, priceMult: 10.0, icon: '🥩', desc: 'Melt-in-your-mouth marbled A5 Wagyu slices.' }
    ],
    staffRoles: [
        { id: 'staff_head_chef', name: 'Head Executive Chef', cost: 200, rpsAdd: 10, icon: '👨‍🍳', desc: 'Automates main kitchen boiling.' },
        { id: 'staff_waiter', name: 'Floor Waiter', cost: 1000, rpsAdd: 45, icon: '🏃‍♂️', desc: 'Increases table serving speed.' },
        { id: 'staff_cashier', name: 'Express Cashier', cost: 8000, rpsAdd: 220, icon: '🪙', desc: 'Boosts customer checkout throughput.' },
        { id: 'staff_cleaner', name: 'Cleaning Specialist', cost: 60000, rpsAdd: 1100, icon: '🧹', desc: 'Maintains 100% restaurant cleanliness.' },
        { id: 'staff_driver', name: 'Delivery Scooter Driver', cost: 500000, rpsAdd: 5500, icon: '🛵', desc: 'Handles citywide delivery orders.' }
    ],
    legendaryRelics: [
        { id: 'relic_knife', name: 'Master Chef Obsidian Knife', mult: 2.5, icon: '🔪', desc: '+150% All Cooking Station Speed' },
        { id: 'relic_bowl', name: 'Golden Imperial Broth Bowl', mult: 5.0, icon: '✨', desc: '+400% All Menu Selling Prices' },
        { id: 'relic_cat', name: 'Lucky Fortune Beckoning Cat', mult: 3.0, icon: '🐱', desc: '+200% Customer Traffic & Tips' }
    ],
    cities: [
        { id: 'city_tokyo', name: 'Tokyo Flagship', cost: 0, mult: 1.0, icon: '🏮', desc: 'Traditional street alley starting location.' },
        { id: 'city_osaka', name: 'Osaka Dotonbori', cost: 50000, mult: 4.0, icon: '🐙', desc: 'Famous street food and nightlife district.' },
        { id: 'city_sapporo', name: 'Sapporo Snow Festival', cost: 2000000, mult: 18.0, icon: '❄️', desc: 'Cold climate miso broth paradise.' },
        { id: 'city_shibuya', name: 'Cyber Shibuya 2077', cost: 100000000, mult: 85.0, icon: '🌆', desc: 'Futuristic automated dining tower.' },
        { id: 'city_paris', name: 'Paris Champs-Élysées', cost: 5000000000, mult: 400.0, icon: '🥐', desc: '3-Star Michelin luxury palace.' }
    ]
};
