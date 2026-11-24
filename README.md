# Magnus' Game

A top-down German-learning campaign game built with Phaser 3.

Answer German questions to earn supply. Spend supply on a marching army, send
it down the road, and fight your way past towers, ballistae, outlaws and
dinosaurs to the treasure. Clearing a map unlocks the next one and earns stars
based on how many of your soldiers survived.

The game ships with four levels:

| # | Level | Map |
| - | ----- | --- |
| 1 | Stone Age | Savannah, cavemen and four dinosaurs |
| 2 | High Noon | Desert outlaws, pistols and bullets |
| 3 | The Old Road | Green fields, five defenses |
| 4 | Amber Pass | Autumn woods, six defenses |

Enemies get stronger on every map: each later level adds **+25% HP**, **+20%
damage** and faster firing (the map-select cards show the enemy power). Level 1
uses the base stats, so it is the easiest place to learn the game.

## How to play

1. Press **ANSWER GERMAN** and answer as many questions as you like. Each
   correct answer earns **1 supply**.
2. Spend supply on units. The roles are the same in every level; levels reskin
   them:
   - **Landsknecht / Clubman / Deputy** - 1 supply, 140 HP, 14 DPS. Sturdy,
     rapid-fire minigun.
   - **Archer / Gunslinger** - 3 supply, 70 HP, 34 DPS. Fragile. Drops landmines
     with a 400-pixel blast; each blast removes one tenth of an enemy's HP, so
     ten blasts defeat it.
   - **Slinger** (Stone Age only) - 3 supply, 70 HP, 29 DPS. A short-range
     flamethrower with a 30-pixel blast that burns clustered dinos.
   - **Musketeer** - 4 supply, 85 HP, 12 DPS. Fires nuclear missiles with a
     5,000,000-pixel blast and a big mushroom cloud. Each blast defeats the two
     closest enemies outright and damages the rest.
   - **Grenadier** - 5 supply, 120 HP, 16 DPS. Slow grenades with a 600-pixel
     blast that instantly defeats nearby enemies.
   - **Flamethrower** - 4 supply, 90 HP, 19 DPS. A short-range flame jet with a
     35-pixel blast, available in every level.

   Musketeer and Grenadier hits fill the **POWER** meter in the top bar. When it
   reaches 100%, the army automatically fires a POWER BARRAGE at every enemy
   still standing.

   Each purchase appears in your camp immediately. Press **ATTACK** to send
   the whole army down the road.
3. The army marches along the path. Units stop and throw or shoot at enemies
   in range. Towers fire back; dinosaurs bite soldiers that get close.
4. Dinosaurs are scared off rather than killed: after a few stone hits they
   turn and run off the map. Towers and ballistae stay destroyed once broken.
5. Reach the treasure to clear the level and unlock the next map. The treasure
   is your prize: **★** for a win, **★★** if at least half the army survives,
   and **★★★** if nobody is lost. Stars are saved, shown on the victory screen
   and on the map-select card, and can only improve when you replay.

A failed attack is not a dead end: answer more German, rebuild the army, and
anything already defeated stays out of the way.

## Run locally

Docker:

```sh
WEB_PORT=8000 docker compose up --build
```

Then open <http://127.0.0.1:8000>.

Without Docker, serve the repository root with any static file server:

```sh
python3 -m http.server 8000
```

## Preview deployment

The `web-app-deployment` preview system allocates `WEB_PORT`, builds the
Compose stack and serves it at a `*.team-a.net` URL:

```sh
git push origin preview/initial
```

The hook prints the preview URL. Delete the branch to tear the preview down.

For that to work, the repository's bare repo on the preview host needs the hook:

```sh
ln -sf ~/web-app-deployment/post-receive_web-app-repos \
    ~/magnus_game.git/hooks/post-receive
```

## Project layout

```
index.html                     page shell and script order
style.css                      page background and fullscreen button
js/config.js                   canvas size, unit/defense/dino stats, version
js/main.js                     Phaser bootstrap, scaling, fullscreen
js/ui.js                       pixel-art text, buttons, panels, HP bars
js/art.js                      all top-down map/unit/dino drawing
js/german.js                   German question bank (152 questions)
js/save.js                     cleared-map progress in localStorage
js/levels/core.js              level registry and path geometry
js/levels/level-00-stone-age.js  Stone Age
js/levels/level-01-high-noon.js  High Noon
js/levels/level-02-old-road.js   The Old Road
js/levels/level-03-amber-pass.js Amber Pass
js/scenes/menu.js              title screen
js/scenes/levels.js            map select and unlocking
js/scenes/level.js             map, army training, marching battle
js/scenes/quiz.js              German question overlay
js/phaser.min.js               Phaser 3.85.2
fonts/PressStart2P.woff2       pixel font
assets/                        optional level art (see assets/README.md)
deployment/nginx.container.conf  nginx config inside the container
```

## Level authoring

Levels are data, not scene code. Each level lives in its own file under
`js/levels/` and is registered with `MB.Levels.define({...})`. A level supplies
its own path, enemies, scenery, colours, unit names and treasure position. Add
the file to `index.html` and it appears in the map select; the next level
unlocks by `number` order.

Enemy entries in `defenses` can be structures (`tower`, `ballista`), bandits
(`bandit`) or dinos (`raptor`, `stego`, `trex`). Dinos walk toward nearby
soldiers to bite them and flee after `fleeAfter` stone hits. A level can set
`unitStyle` to `"stoneage"` or `"western"` to reskin soldiers, and
`playerProjectile` / `enemyProjectile` to `"stone"` or `"bullet"`. Individual
units can override the level's projectile with their own `projectile` in
`js/config.js`; Musketeers always fire bullets and Grenadiers lob grenades with
splash damage.

See [LEVELS.md](LEVELS.md) for the full schema and a minimal example.

## Graphics

The current art is procedural and drawn in `js/art.js`, so there are no image
assets to prepare. Levels can already opt into custom art:

- `background` - an optional 960x540 image drawn under the road.
- `preload` - extra image keys/URLs for a level.
- scenery items with `texture` use that image instead of the procedural prop.

To change the look globally, edit the drawing functions in `js/art.js`; to
change a map, edit its level data. This keeps level layout and art replaceable
independently.

## Asset caching

`style.css`, `fonts/` and `js/` are served with a one-year immutable cache,
while `index.html` is served `no-store`. Bump `VERSION` in `js/config.js` when
changing those assets; the Dockerfile appends it to their URLs during the build.

## License

GPL-3.0, see [LICENSE](LICENSE).
