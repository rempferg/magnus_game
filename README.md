# German Attack

A top-down German-learning campaign game built with Phaser 3.

Answer German questions to earn supply. Spend supply on a marching army, send
it down the road, and fight your way past towers, ballistae, outlaws and
dinosaurs to the treasure. Clearing a map unlocks the next one.

The game ships with four levels:

| # | Level | Map |
| - | ----- | --- |
| 1 | Stone Age | Savannah, cavemen and four dinosaurs |
| 2 | High Noon | Desert outlaws, pistols and bullets |
| 3 | The Old Road | Green fields, five defenses |
| 4 | Amber Pass | Autumn woods, six defenses |

## How to play

1. Press **ANSWER GERMAN** and answer as many questions as you like. Each
   correct answer earns **1 supply**.
2. Spend supply on units. The roles are the same in every level; levels reskin
   them:
   - **Landsknecht / Clubman / Deputy** - 1 supply, 140 HP, 10 DPS. Sturdy.
   - **Archer / Slinger / Gunslinger** - 3 supply, 70 HP, 34 DPS. Fragile,
     more damage.
   - **Musketeer** - 4 supply, 85 HP, 27 DPS. Long range, heavy bullets.
   - **Grenadier** - 5 supply, 120 HP, 16 DPS. Slow grenades with a 2000-pixel
     blast that reaches every enemy on the map.

   Each purchase appears in your camp immediately. Press **ATTACK** to send
   the whole army down the road.
3. The army marches along the path. Units stop and throw or shoot at enemies
   in range. Towers fire back; dinosaurs bite soldiers that get close.
4. Dinosaurs are scared off rather than killed: after a few stone hits they
   turn and run off the map. Towers and ballistae stay destroyed once broken.
5. Reach the treasure to clear the level and unlock the next map.

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
    ~/german_attack.git/hooks/post-receive
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
