# Level format

A level is a plain JavaScript object passed to `MB.Levels.define`. The engine
reads it without any level-specific scene code, so maps can be added or edited
in parallel with scene work.

Coordinates are in the game's 960 x 540 canvas. The top 42 px and bottom 108 px
are covered by the HUD; keep roads, units and scenery between roughly `y = 50`
and `y = 430`. The player camp is normally on the left.

## Minimal example

```js
MB.Levels.define({
  id: "my-road",                 // unique, never change after release
  number: 5,                     // unlock order
  name: "My Road",
  subtitle: "A short description for the map select card.",
  brief: "Shown under the level name during play.",
  seed: 42,                      // stable grass/rock scatter

  theme: {
    grass: 0x3f5c33,
    grassDark: 0x344e2b,
    grassLight: 0x507140,
    path: 0xa8875c,
    pathEdge: 0x7c6341,
    camp: 0x355f8c,
    campEdge: 0x79a9d6,
    tent: 0x2b4b70,
    flag: 0xffd24d,
    tree: 0x2a5a32,
    treeLight: 0x3d7a43,
    trunk: 0x5a3f2a,
    rock: 0x707a74,
    rockLight: 0x95a09a,
    bush: 0x3c6e38,
    flower: 0xffd24d,
    water: 0x2e5f73,
    waterLight: 0x4a849b,
    enemy: 0xa34a3f,
    enemyDark: 0x6e2f28,
    gold: 0xffd24d
  },

  pathWidth: 36,
  playerArea: { x: 10, y: 50, w: 130, h: 370 },

  // Optional per-level presentation.
  unitStyle: "stoneage",         // "stoneage" or "western"; omit for default
  unitNames: { landsknecht: "Clubman", archer: "Slinger" },
  playerProjectile: "stone",     // "stone", "bullet" or omit for energy bolts
  enemyProjectile: "bullet",     // optional, same values
  enemyWord: { one: "Dino", many: "Dinos", verb: "routed" },
  battleLine: "Keep throwing stones until the dinos run away!",

  // The road. The first point is inside the camp; the last is the treasure.
  path: [
    { x: 55, y: 380 },
    { x: 210, y: 380 },
    { x: 210, y: 170 },
    { x: 900, y: 170 }
  ],

  treasure: { x: 900, y: 170 },

  defenses: [
    { type: "tower", x: 280, y: 275 },
    { type: "raptor", x: 600, y: 275 }
  ],

  scenery: [
    { type: "tree", x: 120, y: 70, scale: 1.0 },
    { type: "rock", x: 340, y: 320, scale: 0.8 },
    { type: "bush", x: 500, y: 120, scale: 0.9 },
    { type: "pond", x: 700, y: 350, scale: 1.0 },
    { type: "flower", x: 800, y: 210, scale: 0.8 }
  ],

  startingSupply: 0
});
```

## Fields

| Field | Required | Meaning |
| ----- | -------- | ------- |
| `id` | yes | Unique stable identifier used in the save file. |
| `number` | no | Unlock order; defaults to load order. Cleared level `n` unlocks `n+1`. |
| `name` | yes | Level name on the map select card and top bar. |
| `subtitle` | no | Map select description. |
| `brief` | no | Short objective line during play. |
| `seed` | no | Seed for deterministic grass scatter and rock placement. |
| `theme` | no | Palette; missing colours fall back to the default green theme. |
| `background` | no | Path to a 960x540 image used as the ground underlay. |
| `preload` | no | Array of `{ key, url }` images to load before the level starts. |
| `path` | yes | Array of waypoints; at least two. |
| `pathWidth` | no | Road width in pixels, default 36. |
| `playerArea` | no | Camp rectangle; defaults to the left strip. |
| `treasure` | yes | Chest centre position. |
| `defenses` | no | Array of towers, ballistae, bandits or dinos. |
| `scenery` | no | Array of decorative props. |
| `startingSupply` | no | Supply the player starts with, default 0. |
| `unitStyle` | no | `"stoneage"` or `"western"` reskins soldiers. |
| `unitNames` | no | Per-unit display names, e.g. `{ landsknecht: "Clubman" }`. |
| `playerProjectile` | no | `"stone"` or `"bullet"` changes player shots. |
| `enemyProjectile` | no | `"stone"` or `"bullet"` changes enemy shots. |
| `enemyWord` | no | Labels for the HUD/stats: `{ one, many, verb }`. |
| `battleLine` | no | Objective line shown in the bottom bar during battle. |

## Defenses and dinos

`type` is `tower`, `ballista`, `bandit`, `raptor`, `stego` or `trex`. Base
stats live in `js/config.js` under `MB.config.DEFENSES` and `MB.config.DINOS`;
any stat can be overridden per placement:

```js
{ type: "tower", x: 300, y: 250, hp: 240, damage: 12, range: 200 }
{ type: "raptor", x: 420, y: 300, fleeAfter: 5 }
```

Towers, ballistae and bandits stand still and shoot. Place them roughly 50-120
px from a road segment; their range is measured from the structure, so one
between two road segments covers both.

Dinos are mobile:

- They chase soldiers within `aggroRange` and bite within `range`.
- Every player stone that hits counts as one scare hit. The small bar above a
  dino appears after the first hit and fills up.
- At `fleeAfter` hits the dino runs off the map and counts as routed.
- `hp` still exists for overrides/future use, but the flee threshold is what
  clears the path.
- Give them `x`, `y` near a road segment; they return there when no soldier is
  close.

## Scenery

Built-in procedural types:

- `tree`
- `rock`
- `bush`
- `pond`
- `flower`
- `fern`
- `bones`
- `campfire`
- `cactus`

Each accepts `x`, `y`, optional `scale`, and `rotation` for textured props.

To use custom art for a prop, load it in `preload` and set `texture`:

```js
preload: [{ key: "dead-tree", url: "assets/levels/my-road/dead-tree.png" }],
scenery: [
  { texture: "dead-tree", x: 420, y: 140, scale: 1.2 }
]
```

A texture is used when its key is loaded; otherwise the procedural `type` is
drawn as a fallback. Add a new procedural type by adding a case in
`drawScenery` and a drawing function in `js/art.js`.

## Adding a level

1. Copy `js/levels/level-01-high-noon.js` to a new file and change `id`, `number`, path,
   theme, defenses and scenery.
2. Add one `<script>` tag in `index.html` after `js/levels/core.js` and before
   `js/art.js`.
3. Test it with the local server or a preview branch.

No scene code changes are needed. Extra levels beyond four get pagination in
the map select automatically. Keep `number` unique; the existing maps are
Stone Age (1), High Noon (2), The Old Road (3) and Amber Pass (4).

## Improving the graphics

The art layer is deliberately separate:

- `background` plus `skipGround` gives a hand-painted ground while the engine
  keeps drawing the functional road, camp and treasure.
- `preload` + `texture` replaces individual scenery props.
- `js/art.js` holds the drawing code for units, towers, bandits, dinos, the camp,
  the chest and the generated ground. Replace those functions to change the
  look globally without touching level data.

If you replace the ground entirely, keep the visual road aligned with the
`path` data; units fight along the path, not along painted pixels.

## Unit weapons

A unit in `MB.config.UNITS` can define its own weapon:

- `projectile: "stone" | "bullet" | "minigun" | "grenade" | "mine" | "flame" |
  "nuke"` overrides the level's `playerProjectile` for that unit. `minigun` is
  the Clubman's machine gun: very fast, low-damage bullets in every level.
  `flame` fires short-range flame jets with a small `splash`.
- `projectileSpeed` sets the travel speed of its shots.
- `splash` sets the explosion radius in canvas pixels; every enemy inside it
  takes the shot's damage. The Grenadier uses 600, the Archer's mine uses 400,
  the flame jet uses 35 and the Musketeer's nuke uses 5,000,000. The drawn
  explosion is capped at 140 px so huge blasts stay readable; nukes get a
  mushroom cloud, screen shake and a white flash.
- `instantKill: true` makes a grenade set every enemy inside the blast to 0 HP
  instead of applying the damage value. The Grenadier uses this.
- `mineBlasts` (used with `projectile: "mine"`) is the number of blasts needed
  to defeat an enemy. Each mine blast deals `ceil(enemy.maxHp / mineBlasts)`,
  so the Archer's 10 blasts kill any enemy regardless of size.

A level can override any of these stats for a specific unit through its
`unitStats` map, e.g. `unitStats: { archer: { projectile: "flame", ... } }`. The
Stone Age level uses this to turn the Archer reskin (the Slinger) into a
flamethrower while other levels keep its landmine.

Nukes defeat the two closest enemies in the blast outright (see
`MB.config.NUKES.KILLS`) and damage the rest. Clubmen fire a rapid machine gun,
Archers drop landmines, Grenadiers lob grenades, and the Flamethrower soldier
plus the Stone Age Slinger breathe fire. Other units keep the level's
`playerProjectile` style.

Only the player's new weapons were weakened: the minigun now deals 2 damage per
shot, the mine reaches 400 px instead of the whole map, the grenade 600 px, and
the nuke 30 damage per blast. Enemy weapons are unchanged.

## Power meter

Hits from the Musketeer and Grenadier charge a shared POWER meter shown in the
top bar. Each unit's `PER_HIT` value lives in `MB.config.POWER` along with
`MAX`, `DAMAGE` and `BLAST_RADIUS`. At 100% the army automatically unleashes a
POWER BARRAGE: explosions on every remaining defense, staggered by 90 ms. The
meter resets on a new attack and when rebuilding the army.

## Treasure stars

Taking the treasure in any level awards a star prize stored per level in
localStorage. `MB.Scenes.Level.calculateStars()` returns 1 star for a win, 2 if
at least `MB.config.STARS.TWO_STAR_RATIO` (0.5) of the trained army survives, and
3 if every soldier survives. `MB.save.completeLevel(id, stars)` keeps the best
result across replays. The victory overlay draws the stars with
`MB.art.drawStars()`, and cleared cards in `MB.Scenes.Levels` show the saved
stars next to the CLEARED status. No level data changes are needed — the prize
works automatically for every level, including new ones.

## Enemy scaling

Enemies automatically get stronger on later maps, so level data only needs base
stats. `MB.config.enemyScale(levelNumber)` returns multipliers for `hp`,
`damage` and `fireRate`. Level 1 is always 1.0; each level number after that
adds `ENEMY_SCALING.HP`, `ENEMY_SCALING.DAMAGE` and `ENEMY_SCALING.FIRE_RATE`
from `js/config.js`. `buildDefenses()` applies them to both structures and
dinosaurs after any per-spot overrides. The map-select card shows the resulting
HP multiplier as "ENEMY POWER".

## Balance

Unit and enemy stats are in `js/config.js`:

- `MB.config.UNITS.landsknecht`
- `MB.config.UNITS.archer`
- `MB.config.UNITS.musketeer`
- `MB.config.UNITS.grenadier`
- `MB.config.UNITS.rocketeer`
- `MB.config.DEFENSES.tower`
- `MB.config.DEFENSES.ballista`
- `MB.config.DEFENSES.bandit`
- `MB.config.DINOS.raptor`
- `MB.config.DINOS.stego`
- `MB.config.DINOS.trex`

`cost` is measured in correct German answers. A map's difficulty comes from the
number and mix of enemies, their distance from the road, and the amount of
supply a player is willing to earn before attacking.

## Treasure unlock

Taking the treasure in any level permanently unlocks the **Rocketeer** for all
runs, saved in localStorage with the level stars. Before the first treasure the
unit card in the HUD is marked `LOCKED`; afterward the Rocketeer can be bought
with supply like any other soldier. The unlock id lives in
`MB.config.TREASURE_UNLOCK`; `MB.save.isUnlocked()` gates training.
