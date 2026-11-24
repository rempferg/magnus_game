window.MB = window.MB || {};

MB.config = (function () {
  "use strict";

  const WIDTH = 960;
  const HEIGHT = 540;

  const FONT = '"Press Start 2P", "Courier New", monospace';

  // Appended to asset URLs by the Dockerfile. Bump it whenever js/, style.css
  // or fonts/ change, because those files are served with a one-year immutable
  // cache while index.html itself is never cached.
  const VERSION = "V21";

  // Supply is earned by answering German questions. Units spend it, so a unit
  // that costs 3 needs three correct answers before it can be trained.
  const SUPPLY_PER_ANSWER = 1;

  const UNITS = {
    landsknecht: {
      id: "landsknecht",
      name: "Landsknecht",
      cost: 1,
      hp: 140,
      damage: 2,
      fireRate: 140,
      range: 165,
      speed: 62,
      size: 10,
      color: 0x6f9fe0,
      accent: 0xdbe8ff,
      projectile: "minigun",
      projectileSpeed: 720,
      desc: "Sturdy frontline fighter with a rapid-fire machine gun."
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
      projectile: "mine",
      projectileSpeed: 320,
      splash: 400,
      mineBlasts: 10,
      desc: "Fragile. Drops mines that defeat nearby enemies in ten blasts."
    },
    musketeer: {
      id: "musketeer",
      name: "Musketeer",
      cost: 4,
      hp: 85,
      damage: 30,
      fireRate: 2500,
      range: 260,
      speed: 60,
      size: 9,
      color: 0xb98ad9,
      accent: 0xf2dcff,
      projectile: "nuke",
      projectileSpeed: 300,
      splash: 5000000,
      desc: "Long-range nuclear missile. Huge blast, but needs several hits."
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
      splash: 600,
      instantKill: true,
      desc: "Big blast that instantly defeats nearby enemies."
    },
    flamethrower: {
      id: "flamethrower",
      name: "Flamethrower",
      cost: 4,
      hp: 90,
      damage: 5,
      fireRate: 400,
      range: 140,
      speed: 66,
      size: 10,
      color: 0xe07a3c,
      accent: 0xffe2b8,
      projectile: "flame",
      projectileSpeed: 400,
      splash: 35,
      desc: "Short-range flame jet that burns clustered enemies."
    },
    rocketeer: {
      id: "rocketeer",
      name: "Rocketeer",
      cost: 5,
      hp: 100,
      damage: 22,
      fireRate: 900,
      range: 230,
      speed: 58,
      size: 10,
      color: 0x4fc3c7,
      accent: 0xd6ffff,
      projectile: "rocket",
      projectileSpeed: 380,
      splash: 120,
      desc: "Treasure reward. Fires homing rockets with a wide blast."
    }
  };

  const UNIT_ORDER = [
    "landsknecht", "archer", "musketeer", "grenadier", "flamethrower",
    "rocketeer"
  ];

  // Taking any treasure unlocks this soldier for all later runs.
  const TREASURE_UNLOCK = "rocketeer";

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

  // Hits from the musketeer and grenadier fill a shared meter. A full meter
  // automatically unleashes a barrage on every remaining defense.
  const POWER = {
    MAX: 100,
    PER_HIT: { musketeer: 14, grenadier: 22 },
    DAMAGE: 60,
    BLAST_RADIUS: 60
  };

  // Taking the treasure awards stars. One star for the win, two if at least
  // half the army survives, three if nobody is lost.
  const STARS = {
    MAX: 3,
    TWO_STAR_RATIO: 0.5
  };

  // The Archer drops landmines instead of arrows. A mine removes one tenth of
  // an enemy's HP per blast, so ten blasts defeat it.
  const MINES = {
    RADIUS: 400,
    BLASTS_TO_KILL: 10
  };

  // Short-range flame jets used by the Flamethrower soldier and the Stone Age
  // Slinger.
  const FLAMES = {
    RADIUS: 30
  };

  // The Musketeer fires nuclear missiles: a huge blast that defeats the two
  // closest enemies and damages the rest, so several hits are needed.
  const NUKES = {
    RADIUS: 5000000,
    KILLS: 2
  };

  // Every later map has stronger enemies. Level 1 uses the base DEFENSES/DINOS
  // values; each level number after that adds these fractions.
  const ENEMY_SCALING = {
    HP: 0.25,
    DAMAGE: 0.2,
    FIRE_RATE: -0.06
  };

  function enemyScale(levelNumber) {
    const tier = Math.max(0, (Number(levelNumber) || 1) - 1);
    return {
      hp: 1 + ENEMY_SCALING.HP * tier,
      damage: 1 + ENEMY_SCALING.DAMAGE * tier,
      fireRate: Math.max(0.4, 1 + ENEMY_SCALING.FIRE_RATE * tier)
    };
  }

  return {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    FONT: FONT,
    VERSION: VERSION,
    TREASURE_UNLOCK: TREASURE_UNLOCK,
    POWER: POWER,
    STARS: STARS,
    MINES: MINES,
    FLAMES: FLAMES,
    NUKES: NUKES,
    ENEMY_SCALING: ENEMY_SCALING,
    enemyScale: enemyScale,
    TITLE: "Magnus' Game",
    SUPPLY_PER_ANSWER: SUPPLY_PER_ANSWER,
    UNITS: UNITS,
    UNIT_ORDER: UNIT_ORDER,
    DEFENSES: DEFENSES,
    DINOS: DINOS
  };
})();
