window.MB = window.MB || {};

// Level data only: no scene code in here. See LEVELS.md for the schema.
MB.Levels.define({
  id: "stone-age",
  number: 1,
  name: "Stone Age",
  subtitle: "Ferns, boulders and hungry dinos.",
  brief: "Pelt the dinos until they flee.",
  seed: 7,

  // Stone Age reskin of the same two unit roles.
  unitStyle: "stoneage",
  unitNames: { landsknecht: "Clubman", archer: "Slinger" },
  // The Slinger swaps the Archer's landmine for a short-range flamethrower.
  unitStats: {
    archer: {
      projectile: "flame",
      projectileSpeed: 420,
      damage: 4,
      fireRate: 140,
      range: 145,
      splash: 30,
      desc: "Short-range flamethrower that burns clustered dinos."
    }
  },
  playerProjectile: "stone",
  enemyWord: { one: "Dino", many: "Dinos", verb: "routed" },
  battleLine: "Keep throwing stones until the dinos run away!",

  theme: {
    grass: 0x6b6335,
    grassDark: 0x57512b,
    grassLight: 0x837a45,
    path: 0xc2a06a,
    pathEdge: 0x8e7147,
    camp: 0x6b4a32,
    campEdge: 0xc79a63,
    tent: 0x7a5033,
    flag: 0xe0b64a,
    tree: 0x2f5a33,
    treeLight: 0x4a7a3f,
    trunk: 0x5a3f2a,
    rock: 0x77705f,
    rockLight: 0x9d947d,
    bush: 0x4a6a32,
    flower: 0xe0b64a,
    water: 0x3f6a6a,
    waterLight: 0x5c8d8b,
    enemy: 0x7a8f4a,
    enemyDark: 0x3f5c2a,
    gold: 0xffd24d
  },

  pathWidth: 40,
  playerArea: { x: 10, y: 50, w: 130, h: 370 },
  path: [
    { x: 55, y: 380 },
    { x: 180, y: 380 },
    { x: 180, y: 200 },
    { x: 340, y: 200 },
    { x: 340, y: 390 },
    { x: 520, y: 390 },
    { x: 520, y: 220 },
    { x: 700, y: 220 },
    { x: 700, y: 390 },
    { x: 900, y: 390 }
  ],

  treasure: { x: 900, y: 390 },

  defenses: [
    { type: "raptor", x: 250, y: 300 },
    { type: "raptor", x: 420, y: 300 },
    { type: "stego", x: 610, y: 300 },
    { type: "raptor", x: 790, y: 300 }
  ],

  scenery: [
    { type: "tree", x: 68, y: 72, scale: 1.05 },
    { type: "tree", x: 138, y: 64, scale: 0.85 },
    { type: "tree", x: 242, y: 80, scale: 1.0 },
    { type: "tree", x: 312, y: 64, scale: 0.9 },
    { type: "tree", x: 392, y: 76, scale: 1.08 },
    { type: "tree", x: 462, y: 64, scale: 0.86 },
    { type: "tree", x: 542, y: 80, scale: 1.02 },
    { type: "tree", x: 612, y: 64, scale: 0.9 },
    { type: "tree", x: 692, y: 76, scale: 1.06 },
    { type: "tree", x: 762, y: 64, scale: 0.88 },
    { type: "tree", x: 842, y: 80, scale: 1.0 },
    { type: "tree", x: 912, y: 64, scale: 0.92 },
    { type: "tree", x: 940, y: 250, scale: 0.9 },
    { type: "tree", x: 940, y: 330, scale: 0.82 },
    { type: "rock", x: 210, y: 140, scale: 0.9 },
    { type: "rock", x: 360, y: 130, scale: 0.8 },
    { type: "rock", x: 500, y: 150, scale: 1.0 },
    { type: "rock", x: 640, y: 140, scale: 0.85 },
    { type: "rock", x: 780, y: 130, scale: 0.9 },
    { type: "rock", x: 900, y: 140, scale: 0.8 },
    { type: "fern", x: 150, y: 250, scale: 1.0 },
    { type: "fern", x: 280, y: 250, scale: 0.9 },
    { type: "fern", x: 460, y: 255, scale: 1.0 },
    { type: "fern", x: 650, y: 330, scale: 0.85 },
    { type: "fern", x: 850, y: 250, scale: 0.95 },
    { type: "fern", x: 940, y: 180, scale: 0.8 },
    { type: "bones", x: 255, y: 120, scale: 1.0 },
    { type: "bones", x: 600, y: 120, scale: 0.9 },
    { type: "bones", x: 850, y: 130, scale: 1.05 },
    { type: "campfire", x: 75, y: 170, scale: 1.0 },
    { type: "flower", x: 190, y: 330, scale: 0.9 },
    { type: "flower", x: 470, y: 330, scale: 0.8 },
    { type: "flower", x: 880, y: 330, scale: 0.9 },
    { type: "flower", x: 930, y: 400, scale: 0.8 }
  ]
});
