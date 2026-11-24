window.MB = window.MB || {};

MB.Scenes = MB.Scenes || {};

MB.Scenes.Level = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Level() {
    Phaser.Scene.call(this, { key: "Level" });
  },

  init: function (data) {
    this.levelId = data && data.levelId;
  },

  preload: function () {
    const level = MB.Levels.get(this.levelId) || MB.Levels.all()[0];
    if (!level) return;
    this.levelId = level.id;

    const bgKey = "level-bg-" + level.id;
    if (level.background && !this.textures.exists(bgKey)) {
      this.load.image(bgKey, level.background);
    }
    (level.preload || []).forEach(function (asset) {
      if (asset.key && asset.url && !this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.url);
      }
    }, this);
  },

  create: function () {
    const C = MB.config;
    this.level = MB.Levels.get(this.levelId) || MB.Levels.all()[0];
    if (!this.level) {
      MB.ui.addText(this, C.WIDTH / 2, C.HEIGHT / 2, "No level loaded.", {
        fontSize: "14px",
        color: "#ff8888"
      });
      return;
    }

    this.levelId = this.level.id;
    this.path = MB.path.build(this.level.path);
    this.saveState = MB.save.load();
    this.enemyWord = this.level.enemyWord || { one: "Defense", many: "Defenses", verb: "destroyed" };
    this.battleLine = this.level.battleLine || "The army is marching to the treasure.";
    this.phase = "prepare";
    this.supply = this.level.startingSupply || 0;
    this.army = {};
    C.UNIT_ORDER.forEach(function (id) { this.army[id] = 0; }, this);

    this.units = [];
    this.campUnits = [];
    this.campTweens = [];
    this.projectiles = [];
    this.defenses = [];
    this.correctAnswers = 0;
    this.unitsLost = 0;
    this.defensesDestroyed = 0;
    this.defeatTimer = 0;
    this.finished = false;
    this.quizOpen = false;
    this.damageTexts = 0;
    this.shotCount = 0;
    this.power = 0;
    this.powerBarG = null;
    this.powerText = null;
    this.levelStars = 0;
    this.dinoBites = 0;
    this.overlay = null;
    this.toastText = null;
    this.toastTween = null;
    this.hud = null;
    this.battleStatusText = null;

    this.buildMap();
    this.buildDefenses();
    this.buildHud();
  },

  buildMap: function () {
    const bgKey = "level-bg-" + this.level.id;
    const hasBackground = this.textures.exists(bgKey);
    if (hasBackground) {
      this.add.image(MB.config.WIDTH / 2, MB.config.HEIGHT / 2, bgKey)
        .setDisplaySize(MB.config.WIDTH, MB.config.HEIGHT)
        .setDepth(-1);
    }
    this.map = MB.art.drawMap(this, this.level, this.path, {
      skipGround: hasBackground
    });
  },

  buildDefenses: function () {
    const structures = MB.config.DEFENSES;
    const dinos = MB.config.DINOS;
    const scale = MB.config.enemyScale(this.level.number);
    this.defenses = this.level.defenses.map(function (spot, index) {
      const isDino = !!dinos[spot.type];
      const base = isDino ? dinos[spot.type] : (structures[spot.type] || structures.tower);
      const stats = Object.assign({}, base, spot);
      // Later maps scale HP, damage and firing speed. Per-spot overrides in the
      // level data are applied first, so the whole map scales together.
      const maxHp = Math.round(stats.hp * scale.hp);
      const damage = Math.round(stats.damage * scale.damage);
      const fireRate = Math.round(stats.fireRate * scale.fireRate);
      const visual = isDino
        ? MB.art.drawDino(this, stats, this.level.theme, spot.type)
        : MB.art.drawDefense(this, stats, this.level.theme);
      const bar = MB.ui.addHpBar(
        this,
        spot.x,
        spot.y - (stats.size + 16),
        isDino ? 34 : 42,
        isDino ? 4 : 5,
        { color: isDino ? 0xffc46b : 0xd96455, depth: 7 }
      );
      if (isDino) {
        bar.setRatio(0);
        bar.setAlpha(0);
      }
      return {
        id: (spot.type || "tower") + "-" + index,
        type: spot.type || "tower",
        x: spot.x,
        y: spot.y,
        homeX: spot.x,
        homeY: spot.y,
        hp: maxHp,
        maxHp: maxHp,
        damage: damage,
        range: stats.range,
        fireRate: fireRate,
        projectileSpeed: stats.projectileSpeed,
        aggroRange: stats.aggroRange || 0,
        speed: stats.speed || 0,
        size: stats.size || 20,
        dino: isDino,
        stonesTaken: 0,
        fleeAfter: stats.fleeAfter || 4,
        cooldown: 400 + Math.random() * 700,
        g: visual,
        bar: bar,
        dead: false
      };
    }, this);
    this.defensesTotal = this.defenses.length;
  },

  buildHud: function () {
    const C = MB.config;
    const total = C.UNIT_ORDER.reduce(function (sum, id) {
      return sum + this.army[id];
    }.bind(this), 0);
    if (this.hud) {
      this.hud.destroy(true);
      this.hud = null;
      this.battleStatusText = null;
      this.powerBarG = null;
      this.powerText = null;
    }

    const hud = this.add.container(0, 0).setDepth(100);
    this.hud = hud;

    hud.add(this.add.rectangle(480, 21, 960, 42, 0x081009, 0.95));
    hud.add(this.add.rectangle(480, 42, 960, 2, 0x4c6747, 1));

    hud.add(MB.ui.addButton(this, 64, 21, 100, 28, "‹ MAPS", {
      fill: 0x2d4a32,
      fillOver: 0x3e6645,
      fontSize: "8px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Levels");
      }.bind(this)
    }));

    hud.add(MB.ui.addText(this, 480, 13, "LEVEL " + this.level.number + " · " + this.level.name.toUpperCase(), {
      fontSize: "9px",
      color: "#ffd24d"
    }));
    hud.add(MB.ui.addText(this, 480, 29, this.level.brief, {
      fontSize: "7px",
      color: "#c2d3b4"
    }));
    hud.add(MB.ui.addText(this, 742, 21, "ARMY " + total, {
      fontSize: "9px",
      color: "#cfe0c0"
    }));
    hud.add(MB.ui.addText(this, 894, 21, "SUPPLY " + this.supply, {
      fontSize: "9px",
      color: "#ffd24d",
      origin: 1
    }));

    this.powerText = MB.ui.addText(this, 165, 21, "POWER 0%", {
      fontSize: "8px",
      color: "#b9d6ff"
    });
    hud.add(this.powerText);
    this.powerBarG = this.add.graphics().setPosition(215, 16);
    hud.add(this.powerBarG);
    this.updatePowerMeter();

    hud.add(this.add.rectangle(480, 486, 960, 108, 0x081009, 0.96));
    hud.add(this.add.rectangle(480, 432, 960, 2, 0x4c6747, 1));

    if (this.phase === "battle") {
      hud.add(MB.ui.addText(this, 18, 446, "BATTLE", {
        fontSize: "8px",
        color: "#ff9a8a",
        origin: 0
      }));
      this.battleStatusText = MB.ui.addText(this, 480, 486, "", {
        fontSize: "9px",
        color: "#e8e0cc",
        lineSpacing: 10
      });
      hud.add(this.battleStatusText);
      this.updateBattleStatus();
      return;
    }

    hud.add(MB.ui.addText(this, 18, 446, "TRAIN YOUR ARMY", {
      fontSize: "8px",
      color: "#ffd24d",
      origin: 0
    }));

    const cardX = [70, 188, 306, 424, 542];
    MB.config.UNIT_ORDER.forEach(function (kind, i) {
      const def = this.unitDef(kind);
      const affordable = this.supply >= def.cost;
      const dps = Math.round(def.damage / def.fireRate * 1000);
      hud.add(MB.ui.addButton(this, cardX[i], 490, 116, 52,
        this.unitName(kind).toUpperCase() + "\n" +
        def.cost + " SUP · " + def.hp + " HP\n" +
        dps + " DPS · " + this.army[kind] + " RDY", {
          fill: affordable ? 0x2a5a8f : 0x333d3a,
          fillOver: affordable ? 0x3b74b3 : 0x333d3a,
          fontSize: "7px",
          lineSpacing: 3,
          textColor: affordable ? "#ffffff" : "#84918a",
          onClick: function () {
            this.trainUnit(kind);
          }.bind(this)
        }));
    }, this);

    hud.add(MB.ui.addButton(this, 690, 490, 150, 52, "ANSWER GERMAN\n+1 SUPPLY", {
      fill: 0x2a5ab0,
      fillOver: 0x3f7de0,
      fontSize: "8px",
      lineSpacing: 6,
      onClick: function () {
        this.openQuiz();
      }.bind(this)
    }));

    const soldierWord = total === 1 ? "SOLDIER" : "SOLDIERS";
    const canAttack = total > 0;
    hud.add(MB.ui.addButton(this, 860, 490, 180, 54,
      canAttack ? "ATTACK!\n" + total + " " + soldierWord : "ATTACK\nTRAIN FIRST", {
        fill: canAttack ? 0xa33a32 : 0x3a3f36,
        fillOver: canAttack ? 0xcf4c41 : 0x3a3f36,
        fontSize: canAttack ? "11px" : "9px",
        lineSpacing: 5,
        textColor: canAttack ? "#ffffff" : "#84918a",
        onClick: function () {
          this.startAttack();
        }.bind(this)
      }));
  },

  refreshHud: function () {
    this.buildHud();
  },

  powerConfig: function () {
    // Tolerate a stale cached config.js while a fresh deploy rolls out.
    return MB.config.POWER || {
      MAX: 100, PER_HIT: {}, DAMAGE: 60, BLAST_RADIUS: 60
    };
  },

  updatePowerMeter: function () {
    const C = this.powerConfig();
    if (!this.powerBarG) return;
    const ratio = Math.max(0, Math.min(1, this.power / C.MAX));
    const g = this.powerBarG;
    g.clear();
    g.fillStyle(0x1b2a18, 1);
    g.fillRoundedRect(0, 0, 120, 10, 3);
    g.lineStyle(2, 0x6f8a5c, 1);
    g.strokeRoundedRect(0, 0, 120, 10, 3);
    if (ratio > 0) {
      g.fillStyle(ratio >= 1 ? 0xffd24d : 0x7fd4ff, 1);
      g.fillRoundedRect(1, 1, Math.max(2, 118 * ratio), 8, 2);
    }
    if (this.powerText) {
      this.powerText.setText(ratio >= 1
        ? "POWER READY!"
        : "POWER " + Math.floor(ratio * 100) + "%");
      this.powerText.setColor(ratio >= 1 ? "#ffd24d" : "#b9d6ff");
    }
  },

  addPower: function (amount) {
    if (!amount || this.phase !== "battle") return;
    const C = this.powerConfig();
    this.power = Math.min(C.MAX, this.power + amount);
    this.updatePowerMeter();
    if (this.power >= C.MAX) this.unleashPower();
  },

  unleashPower: function () {
    const C = this.powerConfig();
    this.power = 0;
    this.updatePowerMeter();
    MB.audio.powerBoom();
    this.toast("POWER BARRAGE!", "#ffd24d");

    const targets = this.defenses.filter(function (d) {
      return !d.dead && d.hp > 0;
    });
    targets.forEach(function (d, i) {
      this.time.delayedCall(i * 90, function () {
        if (d.dead) return;
        this.explode(
          d.x, d.y, C.BLAST_RADIUS, C.DAMAGE,
          "player", false, true
        );
      }.bind(this));
    }, this);
  },

  // Base unit stats with any per-level overrides applied (e.g. the Stone Age
  // Slinger trades its landmine for a flamethrower).
  unitDef: function (kind) {
    const base = MB.config.UNITS[kind];
    if (!base) return null;
    const override = this.level.unitStats && this.level.unitStats[kind];
    if (!override) return base;
    const def = {};
    Object.keys(base).forEach(function (k) { def[k] = base[k]; });
    Object.keys(override).forEach(function (k) { def[k] = override[k]; });
    return def;
  },

  trainUnit: function (kind) {
    if (this.phase !== "prepare" || this.finished) return;
    const def = this.unitDef(kind);
    if (!def) return;
    if (this.supply < def.cost) {
      MB.audio.wrong();
      this.toast("Not enough supply - answer more German!", "#ffb08a");
      return;
    }
    this.supply -= def.cost;
    this.army[kind] += 1;
    this.addCampUnit(kind);
    MB.audio.click();
    this.buildHud();
  },

  unitName: function (kind) {
    return (this.level.unitNames && this.level.unitNames[kind]) || this.unitDef(kind).name;
  },

  campSlot: function (index) {
    const area = this.level.playerArea;
    const start = this.path.points[0];
    const startBottom = start.y > area.y + area.h / 2;
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = area.x + 30 + col * 34;
    const y = startBottom
      ? start.y - 36 - row * 22
      : start.y + 36 + row * 22;
    return {
      x: x,
      y: Phaser.Math.Clamp(y, area.y + 26, area.y + area.h - 26)
    };
  },

  addCampUnit: function (kind) {
    const def = this.unitDef(kind);
    const spot = this.campSlot(this.campUnits.length);
    const g = MB.art.drawUnit(this, kind, def, this.level.unitStyle)
      .setDepth(8)
      .setPosition(spot.x, spot.y)
      .setScale(0.45)
      .setAlpha(0);
    this.campUnits.push(g);
    this.campTweens.push(this.tweens.add({
      targets: g,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 220,
      ease: "Back.easeOut"
    }));
  },

  clearCampUnits: function () {
    for (let i = 0; i < this.campTweens.length; i++) this.campTweens[i].stop();
    this.campTweens = [];
    for (let i = 0; i < this.campUnits.length; i++) this.campUnits[i].destroy();
    this.campUnits = [];
  },

  openQuiz: function () {
    if (this.phase !== "prepare" || this.quizOpen || this.finished) return;
    this.quizOpen = true;
    MB.audio.unlock();
    MB.audio.click();
    this.scene.launch("Quiz", { level: this });
    this.scene.pause();
  },

  addSupply: function (amount) {
    const gain = amount == null ? 1 : amount;
    this.supply += gain;
    this.correctAnswers += gain;
  },

  startAttack: function () {
    if (this.phase !== "prepare" || this.finished) return;
    const total = MB.config.UNIT_ORDER.reduce(function (sum, id) {
      return sum + this.army[id];
    }.bind(this), 0);
    if (!total) {
      MB.audio.wrong();
      this.toast("Train at least one soldier first.", "#ffb08a");
      return;
    }
    this.phase = "battle";
    this.power = 0;
    this.defeatTimer = 0;
    MB.audio.unlock();
    MB.audio.click();
    this.clearCampUnits();
    this.spawnArmy();
    this.buildHud();
    this.toast("The army marches!", "#ffd24d");
  },

  spawnArmy: function () {
    const C = MB.config;
    const area = this.level.playerArea;
    const start = this.path.points[0];
    let slot = 0;

    this.units = [];
    C.UNIT_ORDER.forEach(function (kind) {
      const count = this.army[kind] || 0;
      for (let i = 0; i < count; i++) {
        const def = this.unitDef(kind);
        const g = MB.art.drawUnit(this, kind, def, this.level.unitStyle).setDepth(10);
        const bar = MB.ui.addHpBar(this, 0, 0, 22, 3, {
          color: 0x7ce07c,
          depth: 11
        });
        const col = slot % 3;
        const row = Math.floor(slot / 3);
        const spot = this.campSlot(slot);
        const sx = spot.x;
        const sy = spot.y;
        const u = {
          kind: kind,
          def: def,
          g: g,
          bar: bar,
          x: sx,
          y: sy,
          hp: def.hp,
          maxHp: def.hp,
          damage: def.damage,
          range: def.range,
          speed: def.speed,
          projectile: def.projectile || null,
          projectileSpeed: def.projectileSpeed || 0,
          splash: def.splash || 0,
          instantKill: !!def.instantKill,
          mineBlasts: def.mineBlasts || 0,
          cooldown: Math.random() * def.fireRate,
          cooldownMax: def.fireRate,
          progress: 0,
          lane: slot % 3,
          offset: [-12, 0, 12][slot % 3],
          wait: slot * 0.14,
          onPath: false,
          dead: false
        };
        g.setPosition(sx, sy);
        g.setRotation(Math.atan2(start.y - sy, start.x - sx));
        bar.setPosition(sx, sy - def.size - 8);
        bar.setRatio(1);
        this.units.push(u);
        slot++;
      }
    }, this);
  },

  update: function (_time, dt) {
    if (this.phase !== "battle") return;
    const dtSec = dt / 1000;
    this.updateUnits(dtSec);
    this.updateDefenses(dt);
    this.updateProjectiles(dtSec);
    this.checkEnd(dtSec);
    this.updateBattleStatus();
  },

  updateUnits: function (dtSec) {
    const start = this.path.points[0];

    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.dead) continue;

      u.cooldown = Math.max(0, u.cooldown - dtSec * 1000);

      if (!u.onPath) {
        if (u.wait > 0) {
          u.wait -= dtSec;
        } else {
          const dx = start.x - u.x;
          const dy = start.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 4) {
            const step = Math.min(dist, u.speed * dtSec * 1.15);
            u.x += (dx / dist) * step;
            u.y += (dy / dist) * step;
            u.g.setRotation(Math.atan2(dy, dx));
          } else {
            u.x = start.x;
            u.y = start.y;
            u.onPath = true;
            u.progress = 0;
          }
        }
      } else {
        let target = null;
        let best = Infinity;
        for (let d = 0; d < this.defenses.length; d++) {
          const def = this.defenses[d];
          if (def.dead) continue;
          const dx = def.x - u.x;
          const dy = def.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < best) {
            best = dist;
            target = def;
          }
        }

        if (target && best <= u.range) {
          u.g.setRotation(Math.atan2(target.y - u.y, target.x - u.x));
          if (u.cooldown <= 0) {
            this.fireProjectile(u, target, "player");
            u.cooldown = u.cooldownMax;
          }
        } else {
          u.progress = Math.min(this.path.length, u.progress + u.speed * dtSec);
          const pos = this.path.pointAtOffset(u.progress, u.offset);
          u.x = pos.x;
          u.y = pos.y;
          u.g.setRotation(pos.angle);
        }
      }

      u.g.setPosition(u.x, u.y);
      u.bar.setPosition(u.x, u.y - u.def.size - 8);
    }

    this.applyFormationSpacing();
  },

  applyFormationSpacing: function () {
    const lanes = [[], [], []];
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.dead || !u.onPath) continue;
      lanes[u.lane].push(u);
    }

    for (let lane = 0; lane < lanes.length; lane++) {
      const group = lanes[lane];
      group.sort(function (a, b) { return b.progress - a.progress; });
      for (let i = 1; i < group.length; i++) {
        const cap = group[i - 1].progress - 24;
        if (group[i].progress > cap) group[i].progress = Math.max(0, cap);
      }
      for (let i = 0; i < group.length; i++) {
        const u = group[i];
        const pos = this.path.pointAtOffset(u.progress, u.offset);
        u.x = pos.x;
        u.y = pos.y;
        u.g.setPosition(u.x, u.y);
        u.bar.setPosition(u.x, u.y - u.def.size - 8);
      }
    }
  },

  updateDefenses: function (dtMs) {
    const dtSec = dtMs / 1000;
    for (let i = 0; i < this.defenses.length; i++) {
      const d = this.defenses[i];
      if (d.dead) continue;
      if (d.dino) {
        this.updateDino(d, dtSec);
        continue;
      }
      d.cooldown -= dtMs;
      if (d.cooldown > 0) continue;

      let target = null;
      let best = Infinity;
      for (let j = 0; j < this.units.length; j++) {
        const u = this.units[j];
        if (u.dead) continue;
        const dx = u.x - d.x;
        const dy = u.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < best) {
          best = dist;
          target = u;
        }
      }

      if (target && best <= d.range) {
        if (d.type === "bandit") {
          d.g.setRotation(Math.atan2(target.y - d.y, target.x - d.x));
        }
        this.fireProjectile(d, target, "enemy");
        d.cooldown = d.fireRate;
      } else {
        d.cooldown = 150;
      }
    }
  },

  updateDino: function (d, dtSec) {
    d.cooldown = Math.max(0, d.cooldown - dtSec * 1000);

    let target = null;
    let best = Infinity;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.dead) continue;
      const dx = u.x - d.x;
      const dy = u.y - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < best) {
        best = dist;
        target = u;
      }
    }

    if (target && best <= d.aggroRange) {
      d.g.setRotation(Math.atan2(target.y - d.y, target.x - d.x));
      if (best > d.range) {
        const dx = target.x - d.x;
        const dy = target.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        d.x = Phaser.Math.Clamp(d.x + (dx / dist) * d.speed * dtSec, 20, 940);
        d.y = Phaser.Math.Clamp(d.y + (dy / dist) * d.speed * dtSec, 50, 425);
        d.g.setPosition(d.x, d.y);
        d.bar.setPosition(d.x, d.y - d.size - 14);
      } else if (d.cooldown <= 0) {
        this.dinoBite(d, target);
        d.cooldown = d.fireRate;
      }
      return;
    }

    const homeDx = d.homeX - d.x;
    const homeDy = d.homeY - d.y;
    const homeDist = Math.sqrt(homeDx * homeDx + homeDy * homeDy);
    if (homeDist > 3) {
      const step = Math.min(homeDist, d.speed * 0.45 * dtSec);
      d.x += (homeDx / homeDist) * step;
      d.y += (homeDy / homeDist) * step;
      d.g.setRotation(Math.atan2(homeDy, homeDx));
      d.g.setPosition(d.x, d.y);
      d.bar.setPosition(d.x, d.y - d.size - 14);
    }
  },

  fireProjectile: function (source, target, side) {
    const isPlayer = side === "player";
    // Individual units can carry their own weapon; otherwise fall back to the
    // level's projectile style (stones in Stone Age, bullets in High Noon).
    const weapon = isPlayer ? source.projectile : null;
    const grenade = weapon === "grenade";
    const mine = weapon === "mine";
    const nuke = weapon === "nuke";
    const minigun = weapon === "minigun";
    const flame = weapon === "flame";
    const explosive = grenade || mine || nuke || flame;
    const stone = isPlayer && (weapon || this.level.playerProjectile) === "stone";
    const bullet = weapon === "bullet" || minigun ||
      (isPlayer && !weapon && this.level.playerProjectile === "bullet") ||
      (!isPlayer && this.level.enemyProjectile === "bullet");
    let g;
    if (grenade) {
      g = MB.art.drawGrenade(this, source.x, source.y).setDepth(20);
    } else if (mine) {
      g = MB.art.drawMine(this, source.x, source.y).setDepth(20);
    } else if (flame) {
      g = MB.art.drawFlame(this, source.x, source.y).setDepth(20);
      g.setRotation(Math.atan2(target.y - source.y, target.x - source.x));
    } else if (nuke) {
      g = MB.art.drawNuke(this, source.x, source.y).setDepth(20);
      g.setRotation(Math.atan2(target.y - source.y, target.x - source.x));
    } else if (stone) {
      g = MB.art.drawStone(this, source.x, source.y).setDepth(20);
    } else if (bullet) {
      g = MB.art.drawBullet(
        this,
        source.x,
        source.y,
        minigun ? 0xbfe9ff : (isPlayer ? 0xffe6a8 : 0xffb36b)
      ).setDepth(20);
      g.setRotation(Math.atan2(target.y - source.y, target.x - source.x));
    } else {
      g = this.add.circle(
        source.x,
        source.y,
        isPlayer ? 2.6 : 3.5,
        isPlayer ? 0xbfe9ff : 0xffb36b,
        1
      ).setDepth(20);
    }

    let effect = null;
    if (mine) effect = { kind: "mine", blasts: source.mineBlasts || MB.config.MINES.BLASTS_TO_KILL };
    if (flame) effect = { kind: "flame" };
    if (nuke) effect = { kind: "nuke", kills: MB.config.NUKES.KILLS };

    this.projectiles.push({
      g: g,
      x: source.x,
      y: source.y,
      target: target,
      damage: source.damage,
      side: side,
      stone: stone,
      bullet: bullet,
      grenade: grenade,
      effect: effect,
      splash: explosive ? (source.splash || 48) : 0,
      instant: grenade && !!source.instantKill,
      power: isPlayer && source.kind
        ? (this.powerConfig().PER_HIT[source.kind] || 0)
        : 0,
      spin: (stone || grenade || mine)
        ? (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 3)
        : 0,
      arc: grenade ? 22 : (mine ? 8 : (nuke ? 14 : 0)),
      launchDist: Math.max(1, Math.sqrt(
        (target.x - source.x) * (target.x - source.x) +
        (target.y - source.y) * (target.y - source.y)
      )),
      speed: isPlayer
        ? (source.projectileSpeed || (grenade ? 250 : 520))
        : (source.projectileSpeed || 320)
    });

    this.shotCount++;
    if (flame) {
      MB.audio.flame();
    } else if (explosive) {
      MB.audio.torpedoLaunch();
    } else if (this.shotCount % 4 === 1) {
      if (isPlayer) MB.audio.laser();
      else MB.audio.alienShot();
    }
  },

  updateProjectiles: function (dtSec) {
    const survivors = [];

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      const target = p.target;
      if (!target || target.dead || target.hp <= 0) {
        p.g.destroy();
        continue;
      }

      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = p.speed * dtSec;

      if (dist <= step + 4) {
        p.g.destroy();
        if (p.splash > 0) {
          this.explode(
            target.x, target.y, p.splash, p.damage, p.side, p.stone,
            false, p.power, p.instant, p.effect
          );
        } else {
          this.spawnHit(target.x, target.y, p.side, p.stone);
          this.hit(target, p.damage, p.side);
          this.addPower(p.power);
        }
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
        if (p.arc) {
          const t = 1 - Math.min(1, dist / p.launchDist);
          p.g.setPosition(p.x, p.y - Math.sin(Math.PI * t) * p.arc);
        } else {
          p.g.setPosition(p.x, p.y);
        }
        if (p.spin) p.g.rotation += p.spin * dtSec;
        if (p.bullet) p.g.setRotation(Math.atan2(dy, dx));
        survivors.push(p);
      }
    }

    this.projectiles = survivors;
  },

  explode: function (x, y, radius, damage, side, stone, silent, power, instant, effect) {
    const isNuke = !!(effect && effect.kind === "nuke");
    const isFlame = !!(effect && effect.kind === "flame");
    let visual;
    if (isNuke) {
      visual = MB.art.drawNuclearBlast(this, x, y).setDepth(28);
      this.cameras.main.shake(260, 0.008);
      const flash = this.add.rectangle(
        MB.config.WIDTH / 2, MB.config.HEIGHT / 2,
        MB.config.WIDTH, MB.config.HEIGHT, 0xfff4c2, 0.32
      ).setDepth(27);
      this.tweens.add({
        targets: flash, alpha: 0, duration: 320,
        onComplete: function () { flash.destroy(); }
      });
      MB.audio.powerBoom();
    } else if (isFlame) {
      visual = MB.art.drawFlameBurst(this, x, y).setDepth(28);
    } else {
      // Keep huge blast radii readable on a 960x540 canvas: damage uses the
      // full radius, but the drawn effect is capped.
      visual = MB.art.drawExplosion(this, x, y, Math.min(radius, 140)).setDepth(28);
    }
    this.tweens.add({
      targets: visual,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 280,
      onComplete: function () { visual.destroy(); }
    });
    this.spawnHit(x, y, side, stone);
    if (!silent && !isNuke) {
      if (isFlame) MB.audio.flame();
      else MB.audio.explode();
    }

    const r2 = radius * radius;
    const isNukeEffect = !!(effect && effect.kind === "nuke");
    const kills = isNukeEffect
      ? (effect.kills || MB.config.NUKES.KILLS)
      : 0;
    const hitList = [];
    for (let i = 0; i < this.defenses.length; i++) {
      const d = this.defenses[i];
      if (d.dead || d.hp <= 0) continue;
      const dx = d.x - x;
      const dy = d.y - y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= r2) hitList.push({ d: d, dist2: dist2 });
    }
    // A nuke defeats the two closest enemies outright; everyone else in the
    // huge blast still takes heavy damage.
    if (kills > 0) hitList.sort(function (a, b) { return a.dist2 - b.dist2; });
    hitList.forEach(function (entry, i) {
      const d = entry.d;
      // A landmine removes one tenth of the target's own HP per blast, so
      // every enemy dies on the tenth blast regardless of its size.
      const hitDamage = effect && effect.kind === "mine"
        ? Math.ceil(d.maxHp / effect.blasts)
        : damage;
      this.hit(d, hitDamage, side, i < kills || instant);
    }, this);
    this.addPower(power);
  },

  hit: function (target, damage, side, instant) {
    if (!target || target.dead || target.hp <= 0) return;

    if (target.dino) {
      if (side !== "player") return;
      target.hp -= instant ? target.hp : damage;
      target.stonesTaken += 1;
      if (target.bar) {
        target.bar.setAlpha(1);
        target.bar.setRatio(Math.min(1, target.stonesTaken / target.fleeAfter));
      }
      this.spawnDamage(target.x, target.y - 16, damage, side);
      if (target.stonesTaken >= target.fleeAfter || target.hp <= 0) {
        this.fleeDino(target);
      }
      return;
    }

    target.hp -= instant ? target.hp : damage;
    if (target.bar) target.bar.setRatio(target.hp / target.maxHp);
    this.spawnDamage(target.x, target.y - 14, damage, side);

    if (target.hp <= 0) {
      if (target.def) this.killUnit(target);
      else this.killDefense(target);
    }
  },

  dinoBite: function (d, target) {
    this.hit(target, d.damage, "enemy");
    this.dinoBites += 1;

    const flash = this.add.circle(target.x, target.y, 10, 0xff6a4a, 0.4).setDepth(29);
    this.tweens.add({
      targets: flash,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 240,
      onComplete: function () { flash.destroy(); }
    });

    const chomp = this.add.graphics().setDepth(30);
    chomp.lineStyle(2, 0xffd0a0, 0.95);
    const angle = Math.atan2(target.y - d.y, target.x - d.x);
    const ox = target.x - Math.cos(angle) * 8;
    const oy = target.y - Math.sin(angle) * 8;
    chomp.beginPath();
    chomp.arc(ox, oy, 11, angle - 0.9, angle + 0.9, false);
    chomp.strokePath();
    this.tweens.add({
      targets: chomp,
      alpha: 0,
      duration: 220,
      onComplete: function () { chomp.destroy(); }
    });

    this.tweens.add({
      targets: d.g,
      scaleX: 1.14,
      scaleY: 0.9,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut"
    });

    MB.audio.dinoBite();
  },

  fleeDino: function (d) {
    if (d.dead) return;
    d.dead = true;
    if (d.bar) {
      d.bar.destroy();
      d.bar = null;
    }
    this.defensesDestroyed++;
    MB.audio.flee();
    this.spawnBurst(d.x, d.y, 0xd8c8a0);

    const bang = MB.ui.addText(this, d.x, d.y - d.size - 20, "!", {
      fontSize: "14px",
      color: "#ffd24d",
      stroke: "#081009",
      strokeThickness: 3
    }).setDepth(30);
    this.tweens.add({
      targets: bang,
      y: bang.y - 22,
      alpha: 0,
      duration: 700,
      onComplete: function () { bang.destroy(); }
    });

    const options = [
      { x: -100, y: d.y + (Math.random() * 80 - 40), dist: d.x },
      { x: 1060, y: d.y + (Math.random() * 80 - 40), dist: 960 - d.x },
      { x: d.x + (Math.random() * 80 - 40), y: 20, dist: d.y - 42 },
      { x: d.x + (Math.random() * 80 - 40), y: 500, dist: 432 - d.y }
    ];
    options.sort(function (a, b) { return a.dist - b.dist; });
    const escape = options[0];

    d.g.setRotation(Math.atan2(escape.y - d.y, escape.x - d.x));
    this.tweens.add({
      targets: d.g,
      x: escape.x,
      y: escape.y,
      alpha: 0.05,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 750 + Math.random() * 350,
      ease: "Cubic.easeIn",
      onComplete: function () { d.g.destroy(); }
    });
  },

  killUnit: function (unit) {
    unit.dead = true;
    unit.hp = 0;
    unit.g.destroy();
    unit.bar.destroy();
    unit.g = null;
    unit.bar = null;
    this.unitsLost++;
    this.spawnBurst(unit.x, unit.y, 0xffc46b);
    MB.audio.explode();
  },

  killDefense: function (defense) {
    defense.dead = true;
    defense.hp = 0;
    defense.bar.destroy();
    defense.g.setAlpha(0.3);
    this.defensesDestroyed++;
    this.spawnBurst(defense.x, defense.y, 0xffa060);
    MB.audio.powerBoom();
  },

  spawnDamage: function (x, y, amount, side) {
    if (this.damageTexts >= 18) return;
    this.damageTexts++;
    const text = MB.ui.addText(this, x + (Math.random() * 12 - 6), y, String(amount), {
      fontSize: "8px",
      color: side === "player" ? "#ffffff" : "#ff9a8a",
      stroke: "#000000",
      strokeThickness: 3
    }).setDepth(30);

    this.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: 620,
      onComplete: function () {
        this.damageTexts--;
        text.destroy();
      }.bind(this)
    });
  },

  spawnHit: function (x, y, side, stone) {
    const spark = this.add.circle(
      x,
      y,
      3,
      stone ? 0xd8c8a0 : side === "player" ? 0xe8f6ff : 0xffc078,
      0.9
    ).setDepth(29);
    this.tweens.add({
      targets: spark,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 190,
      onComplete: function () { spark.destroy(); }
    });
  },

  spawnBurst: function (x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 18 + Math.random() * 26;
      const dot = this.add.circle(x, y, 2 + Math.random() * 2, color, 1).setDepth(31);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 330 + Math.random() * 220,
        ease: "Cubic.easeOut",
        onComplete: function () { dot.destroy(); }
      });
    }
  },

  updateBattleStatus: function () {
    if (!this.battleStatusText) return;
    const alive = this.units.filter(function (u) { return !u.dead; }).length;
    const left = this.defenses.filter(function (d) { return !d.dead; }).length;
    this.battleStatusText.setText(
      this.enemyWord.many + " left: " + left + "     Soldiers: " + alive +
      "\n" + this.battleLine
    );
  },

  checkEnd: function (dtSec) {
    if (this.phase !== "battle") return;
    const alive = this.units.filter(function (u) { return !u.dead; });

    const reached = alive.some(function (u) {
      return u.onPath && u.progress >= this.path.length - 2;
    }, this);

    if (reached) {
      this.finish(true);
      return;
    }

    if (!alive.length) {
      const incoming = this.projectiles.some(function (p) { return p.side === "player"; });
      if (!incoming) {
        this.defeatTimer += dtSec;
        if (this.defeatTimer >= 0.9) this.finish(false);
      } else {
        this.defeatTimer = 0;
      }
    } else {
      this.defeatTimer = 0;
    }
  },

  // Treasure prize: one star for the win, two for keeping half the army alive,
  // three for losing nobody. Replays can only improve the saved result.
  calculateStars: function () {
    const total = MB.config.UNIT_ORDER.reduce(function (sum, id) {
      return sum + this.army[id];
    }.bind(this), 0);
    const alive = this.units.filter(function (u) { return !u.dead; }).length;
    const S = MB.config.STARS;
    if (!total || alive >= total) return S.MAX;
    if (alive / total >= S.TWO_STAR_RATIO) return 2;
    return 1;
  },

  finish: function (victory) {
    if (this.phase === "done") return;
    this.phase = "done";
    this.finished = true;
    if (this.hud) this.hud.setVisible(false);

    if (victory) {
      this.levelStars = this.calculateStars();
      MB.save.completeLevel(this.level.id, this.levelStars);
      MB.audio.victory();
    } else {
      MB.audio.defeat();
    }

    this.showOverlay(victory);
  },

  showOverlay: function (victory) {
    const C = MB.config;
    const next = MB.Levels.next(this.level.id);
    if (this.overlay) {
      this.overlay.destroy(true);
      this.overlay = null;
    }

    const dim = this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x000000, 0.78);
    dim.setInteractive();

    const panel = MB.ui.addPanel(this, C.WIDTH / 2, C.HEIGHT / 2, 700, 340, {
      fill: victory ? 0x142114 : 0x241616,
      alpha: 0.98,
      border: victory ? 0x8fc47a : 0xd06a5a
    });

    const title = MB.ui.addText(this, C.WIDTH / 2, 140, victory
      ? (next ? "TREASURE TAKEN!" : "CAMPAIGN COMPLETE!")
      : "ATTACK FAILED", {
      fontSize: "28px",
      color: victory ? "#ffd24d" : "#ff8a7a",
      stroke: "#081009",
      strokeThickness: 5
    });

    const subtitle = MB.ui.addText(this, C.WIDTH / 2, 178, victory
      ? (next ? "LEVEL " + this.level.number + " CLEARED" : "ALL " + MB.Levels.count() + " MAPS CLEARED")
      : "Your army fell. Damaged defenses stay damaged.", {
      fontSize: "10px",
      color: victory ? "#9fe08a" : "#e0c0b8"
    });

    let prizeLabel = null;
    let prizeStars = null;
    if (victory) {
      prizeLabel = MB.ui.addText(this, C.WIDTH / 2, 206, "TREASURE PRIZE", {
        fontSize: "8px",
        color: "#cfe0c0"
      });
      prizeStars = MB.art.drawStars(this, C.WIDTH / 2, 230, this.levelStars, 12);
    }

    const totalUnits = MB.config.UNIT_ORDER.reduce(function (sum, id) {
      return sum + this.army[id];
    }.bind(this), 0);
    const alive = this.units.filter(function (u) { return !u.dead; }).length;

    const lines = victory
      ? [
          "Soldiers surviving: " + alive + " / " + totalUnits,
          this.enemyWord.many + " " + this.enemyWord.verb + ": " + this.defensesDestroyed + " / " + this.defensesTotal,
          "Correct answers earned: " + this.correctAnswers
        ]
      : [
          "Soldiers lost: " + this.unitsLost,
          this.enemyWord.many + " " + this.enemyWord.verb + ": " + this.defensesDestroyed + " / " + this.defensesTotal,
          "Supply left: " + this.supply
        ];

    const stats = MB.ui.addText(this, C.WIDTH / 2, victory ? 274 : 244, lines.join("\n"), {
      fontSize: "9px",
      color: "#dfe6d2",
      lineSpacing: victory ? 12 : 16
    });

    const note = MB.ui.addText(this, C.WIDTH / 2, 330, victory
      ? (next ? "The next road is open." : "Every map is cleared. Well fought!")
      : "Answer more German, train again, then attack.", {
      fontSize: "8px",
      color: "#aabb9a"
    });

    const buttons = [];

    if (victory) {
      if (next) {
        buttons.push(MB.ui.addButton(this, 300, 390, 170, 44, "NEXT LEVEL", {
          fill: 0x2f7d3d,
          fillOver: 0x44a356,
          fontSize: "10px",
          onClick: function () {
            MB.audio.click();
            this.scene.restart({ levelId: next.id });
          }.bind(this)
        }));
        buttons.push(MB.ui.addButton(this, 480, 390, 150, 44, "REPLAY", {
          fill: 0x2b4f75,
          fillOver: 0x3d6b9c,
          fontSize: "10px",
          onClick: function () {
            MB.audio.click();
            this.scene.restart({ levelId: this.level.id });
          }.bind(this)
        }));
        buttons.push(MB.ui.addButton(this, 660, 390, 170, 44, "LEVEL SELECT", {
          fill: 0x4a5a3a,
          fillOver: 0x647a4e,
          fontSize: "9px",
          onClick: function () {
            MB.audio.click();
            MB.sceneGo(this, "Levels");
          }.bind(this)
        }));
      } else {
        buttons.push(MB.ui.addButton(this, 380, 390, 180, 44, "REPLAY", {
          fill: 0x2b4f75,
          fillOver: 0x3d6b9c,
          fontSize: "10px",
          onClick: function () {
            MB.audio.click();
            this.scene.restart({ levelId: this.level.id });
          }.bind(this)
        }));
        buttons.push(MB.ui.addButton(this, 590, 390, 190, 44, "LEVEL SELECT", {
          fill: 0x2f7d3d,
          fillOver: 0x44a356,
          fontSize: "10px",
          onClick: function () {
            MB.audio.click();
            MB.sceneGo(this, "Levels");
          }.bind(this)
        }));
      }
    } else {
      buttons.push(MB.ui.addButton(this, 360, 390, 210, 44, "REBUILD ARMY", {
        fill: 0x2f7d3d,
        fillOver: 0x44a356,
        fontSize: "10px",
        onClick: function () {
          MB.audio.click();
          this.rebuildArmy();
        }.bind(this)
      }));
      buttons.push(MB.ui.addButton(this, 610, 390, 190, 44, "LEVEL SELECT", {
        fill: 0x4a5a3a,
        fillOver: 0x647a4e,
        fontSize: "9px",
        onClick: function () {
          MB.audio.click();
          MB.sceneGo(this, "Levels");
        }.bind(this)
      }));
    }

    this.overlay = this.add.container(0, 0).setDepth(200);
    const parts = [dim, panel, title, subtitle, stats, note];
    if (prizeLabel) parts.push(prizeLabel);
    if (prizeStars) parts.push(prizeStars);
    this.overlay.add(parts.concat(buttons));
  },

  rebuildArmy: function () {
    if (this.overlay) {
      this.overlay.destroy(true);
      this.overlay = null;
    }

    this.phase = "prepare";
    this.finished = false;
    this.power = 0;
    this.defeatTimer = 0;

    this.units.forEach(function (u) {
      if (u.g) u.g.destroy();
      if (u.bar) u.bar.destroy();
    });
    this.units = [];
    this.clearCampUnits();

    this.projectiles.forEach(function (p) { p.g.destroy(); });
    this.projectiles = [];

    const C = MB.config;
    this.army = {};
    C.UNIT_ORDER.forEach(function (id) { this.army[id] = 0; }, this);

    this.buildHud();
    if (this.hud) this.hud.setVisible(true);
  },

  toast: function (message, color) {
    if (this.toastTween) {
      this.toastTween.stop();
      this.toastTween = null;
    }
    if (this.toastText) this.toastText.destroy();

    const text = MB.ui.addText(this, MB.config.WIDTH / 2, 414, message, {
      fontSize: "9px",
      color: color || "#ffd24d",
      stroke: "#081009",
      strokeThickness: 4
    }).setDepth(250);
    this.toastText = text;

    this.toastTween = this.tweens.add({
      targets: text,
      y: 396,
      alpha: 0,
      duration: 1500,
      ease: "Cubic.easeOut",
      onComplete: function () {
        text.destroy();
        if (this.toastText === text) this.toastText = null;
        this.toastTween = null;
      }.bind(this)
    });
  }
});
