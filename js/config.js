window.MB = window.MB || {};

MB.config = (function () {
  "use strict";

  const WIDTH = 960;
  const HEIGHT = 540;

  const FONT = '"Press Start 2P", "Courier New", monospace';

  // Appended to asset URLs by the Dockerfile. Bump it whenever js/, style.css
  // or fonts/ change, because those files are served with a one-year immutable
  // cache while index.html itself is never cached.
  const VERSION = "V8";

  // Supply is earned by answering German questions. Units spend it, so a unit
  // that costs 3 needs three correct answers before it can be trained.
  const SUPPLY_PER_ANSWER = 1;

  const UNITS = {
    landsknecht: {
      id: "landsknecht",
      name: "Landsknecht",
      cost: 1,
      hp: 140,
      damage: 9,
      fireRate: 900,
      range: 150,
      speed: 62,
      size: 10,
      color: 0x6f9fe0,
      accent: 0xdbe8ff,
      desc: "Sturdy frontline fighter."
    },
    archer: {
      id: "archer",
      name: "Archer",
      cost: 3,
      hp: 70,
      damage: 22,
      fireRate: 650,
      range: 215,
      speed: 70,
      size: 9,
      color: 0x75c46f,
      accent: 0xe6ffd9,
      desc: "Fragile, high damage."
    },
    musketeer: {
      id: "musketeer",
      name: "Musketeer",
      cost: 4,
      hp: 85,
      damage: 40,
      fireRate: 1500,
      range: 260,
      speed: 60,
      size: 9,
      color: 0xb98ad9,
      accent: 0xf2dcff,
      projectile: "bullet",
      desc: "Long-range, heavy shot."
    },
    grenadier: {
      id: "grenadier",
      name: "Grenadier",
      cost: 5,
      hp: 120,
      damage: 36,
      fireRate: 2200,
      range: 175,
      speed: 52,
      size: 11,
      color: 0xd98a4b,
      accent: 0xffe2b0,
      projectile: "grenade",
      projectileSpeed: 250,
      splash: 2000,
      desc: "Huge blast that hits every enemy on the map."
    }
  };

  const UNIT_ORDER = ["landsknecht", "archer", "musketeer", "grenadier"];

  const DEFENSES = {
    tower: {
      name: "Watchtower",
      hp: 180,
      damage: 9,
      range: 185,
      fireRate: 1200,
      projectileSpeed: 300,
      size: 22,
      color: 0xa34a3f
    },
    ballista: {
      name: "Ballista",
      hp: 280,
      damage: 20,
      range: 220,
      fireRate: 2200,
      projectileSpeed: 380,
      size: 26,
      color: 0x8a5a32
    },
    bandit: {
      name: "Outlaw",
      hp: 140,
      damage: 9,
      range: 205,
      fireRate: 1100,
      projectileSpeed: 480,
      size: 16,
      color: 0x6a3a2a
    }
  };

  // Mobile Stone Age enemies. They bite soldiers that come close and run away
  // after taking `fleeAfter` stones. They are placed through a level's
  // `defenses` array, just like towers.
  const DINOS = {
    raptor: {
      name: "Raptor",
      hp: 90,
      damage: 10,
      range: 52,
      aggroRange: 300,
      fireRate: 1000,
      speed: 110,
      size: 15,
      fleeAfter: 14,
      color: 0x7aa347
    },
    stego: {
      name: "Stego",
      hp: 210,
      damage: 14,
      range: 56,
      aggroRange: 280,
      fireRate: 1300,
      speed: 68,
      size: 22,
      fleeAfter: 22,
      color: 0x6f8f58
    },
    trex: {
      name: "T-Rex",
      hp: 340,
      damage: 22,
      range: 70,
      aggroRange: 360,
      fireRate: 1100,
      speed: 85,
      size: 28,
      fleeAfter: 28,
      color: 0x8f5a3a
    }
  };

  return {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    FONT: FONT,
    VERSION: VERSION,
    TITLE: "German Attack",
    SUPPLY_PER_ANSWER: SUPPLY_PER_ANSWER,
    UNITS: UNITS,
    UNIT_ORDER: UNIT_ORDER,
    DEFENSES: DEFENSES,
    DINOS: DINOS
  };
})();
