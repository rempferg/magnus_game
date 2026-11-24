window.MB = window.MB || {};

// Every piece of in-game art is drawn here. Levels choose colours and prop
// types through data, so a level author can add maps without touching scenes.
// Optional level images (background, scenery textures) are drawn when present;
// otherwise these procedural fallbacks are used.
MB.art = (function () {
  "use strict";

  const FALLBACK = {
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
  };

  function colour(theme, key) {
    return theme[key] != null ? theme[key] : FALLBACK[key];
  }

  function rng(seed) {
    let s = (seed || 1) >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawGround(g, level, theme) {
    const w = MB.config.WIDTH;
    const h = MB.config.HEIGHT;
    g.fillStyle(colour(theme, "grass"), 1);
    g.fillRect(0, 0, w, h);

    const rand = rng(level.seed || 1);
    for (let i = 0; i < 150; i++) {
      const x = rand() * w;
      const y = 42 + rand() * (h - 42);
      const rx = 5 + rand() * 22;
      const ry = 3 + rand() * 10;
      g.fillStyle(i % 2 ? colour(theme, "grassDark") : colour(theme, "grassLight"), 0.16);
      g.fillEllipse(x, y, rx * 2, ry);
    }

    g.lineStyle(1, colour(theme, "grassLight"), 0.35);
    for (let i = 0; i < 110; i++) {
      const x = rand() * w;
      const y = 46 + rand() * (h - 60);
      const len = 3 + rand() * 4;
      g.lineBetween(x, y, x + 1 + rand() * 2, y - len);
    }
  }

  function strokePath(g, points, width, fill, edge) {
    g.lineStyle(width + 8, edge, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.strokePath();
    for (let i = 0; i < points.length; i++) {
      g.fillStyle(edge, 1);
      g.fillCircle(points[i].x, points[i].y, (width + 8) / 2);
    }

    g.lineStyle(width, fill, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.strokePath();
    for (let i = 0; i < points.length; i++) {
      g.fillStyle(fill, 1);
      g.fillCircle(points[i].x, points[i].y, width / 2);
    }
  }

  function drawCamp(g, level, theme) {
    const area = level.playerArea;
    const start = level.path[0];
    const startBottom = start.y > area.y + area.h / 2;

    g.fillStyle(colour(theme, "camp"), 0.2);
    g.fillRoundedRect(area.x, area.y, area.w, area.h, 10);
    g.lineStyle(2, colour(theme, "campEdge"), 0.85);
    g.strokeRoundedRect(area.x, area.y, area.w, area.h, 10);

    const tentY = startBottom ? area.y + 58 : area.y + area.h - 58;
    drawTent(g, area.x + 38, tentY, 1, theme);
    drawTent(g, area.x + 92, tentY + 8, 0.85, theme);

    const flagX = area.x + 20;
    const flagY = startBottom ? area.y + area.h - 34 : area.y + 34;
    g.lineStyle(3, colour(theme, "trunk"), 1);
    g.lineBetween(flagX, flagY, flagX, flagY - 34);
    g.fillStyle(colour(theme, "flag"), 1);
    g.fillTriangle(flagX + 2, flagY - 34, flagX + 26, flagY - 26, flagX + 2, flagY - 18);
  }

  function drawTent(g, x, y, scale, theme) {
    const w = 30 * scale;
    const h = 24 * scale;
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(x + 2, y + 2, w + 8, 10);
    g.fillStyle(colour(theme, "tent"), 1);
    g.fillTriangle(x - w / 2, y + h / 2, x, y - h / 2, x + w / 2, y + h / 2);
    g.lineStyle(2, colour(theme, "campEdge"), 0.8);
    g.strokeTriangle(x - w / 2, y + h / 2, x, y - h / 2, x + w / 2, y + h / 2);
    g.fillStyle(colour(theme, "campEdge"), 0.7);
    g.fillTriangle(x - 4 * scale, y + h / 2, x, y, x + 4 * scale, y + h / 2);
  }

  function drawTree(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(x + 4 * s, y + 11 * s, 28 * s, 9 * s);
    g.fillStyle(colour(theme, "trunk"), 1);
    g.fillRect(x - 2 * s, y - 1 * s, 4 * s, 13 * s);
    g.fillStyle(colour(theme, "tree"), 1);
    g.fillCircle(x - 8 * s, y - 4 * s, 11 * s);
    g.fillCircle(x + 8 * s, y - 4 * s, 10 * s);
    g.fillCircle(x, y - 13 * s, 12 * s);
    g.fillStyle(colour(theme, "treeLight"), 1);
    g.fillCircle(x - 3 * s, y - 12 * s, 6 * s);
    g.fillCircle(x + 8 * s, y - 7 * s, 4.5 * s);
  }

  function drawRock(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(x + 3 * s, y + 7 * s, 28 * s, 9 * s);
    g.fillStyle(colour(theme, "rock"), 1);
    g.fillCircle(x - 6 * s, y, 9 * s);
    g.fillCircle(x + 5 * s, y - 2 * s, 10 * s);
    g.fillCircle(x, y + 5 * s, 8 * s);
    g.fillStyle(colour(theme, "rockLight"), 0.9);
    g.fillCircle(x + 4 * s, y - 5 * s, 4 * s);
  }

  function drawBush(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(x + 2 * s, y + 5 * s, 24 * s, 8 * s);
    g.fillStyle(colour(theme, "bush"), 1);
    g.fillCircle(x - 7 * s, y, 7 * s);
    g.fillCircle(x + 6 * s, y - 1 * s, 8 * s);
    g.fillCircle(x, y - 6 * s, 7 * s);
    g.fillStyle(colour(theme, "treeLight"), 0.7);
    g.fillCircle(x + 5 * s, y - 5 * s, 3 * s);
  }

  function drawPond(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.fillStyle(colour(theme, "water"), 0.9);
    g.fillEllipse(x, y, 54 * s, 30 * s);
    g.fillStyle(colour(theme, "waterLight"), 0.7);
    g.fillEllipse(x - 4 * s, y - 2 * s, 38 * s, 18 * s);
    g.lineStyle(1, 0xffffff, 0.22);
    g.strokeEllipse(x, y, 54 * s, 30 * s);
  }

  function drawFlower(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.lineStyle(1.5, colour(theme, "tree"), 0.9);
    g.lineBetween(x, y, x, y - 6 * s);
    g.fillStyle(colour(theme, "flower"), 1);
    g.fillCircle(x, y - 7 * s, 2.4 * s);
    g.fillCircle(x - 3 * s, y - 5 * s, 1.8 * s);
    g.fillCircle(x + 3 * s, y - 5 * s, 1.8 * s);
  }

  function drawFern(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    const leaf = colour(theme, "treeLight");
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(x + 2 * s, y + 5 * s, 28 * s, 8 * s);
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.42;
      const len = (16 + (i % 2) * 5) * s;
      const tipX = x + Math.cos(angle) * len;
      const tipY = y + Math.sin(angle) * len;
      g.lineStyle(2, leaf, 0.95);
      g.lineBetween(x, y, tipX, tipY);
      g.fillStyle(leaf, 0.9);
      g.fillCircle(tipX, tipY, 2.4 * s);
      g.fillCircle(x + Math.cos(angle) * len * 0.55, y + Math.sin(angle) * len * 0.55, 1.6 * s);
    }
  }

  function drawBones(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    const bone = 0xe7dfc6;
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(x + 2 * s, y + 6 * s, 34 * s, 8 * s);
    g.fillStyle(bone, 1);
    g.fillCircle(x - 9 * s, y - 2 * s, 5.5 * s);
    g.fillRect(x - 10 * s, y + 2 * s, 11 * s, 4 * s);
    g.fillStyle(0x3b3528, 1);
    g.fillCircle(x - 11 * s, y - 3 * s, 1.5 * s);
    g.fillCircle(x - 6 * s, y - 3 * s, 1.5 * s);
    g.lineStyle(2, bone, 0.95);
    g.lineBetween(x - 3 * s, y + 1 * s, x + 16 * s, y + 1 * s);
    for (let i = 0; i < 4; i++) {
      const rx = x + 1 * s + i * 4 * s;
      g.lineBetween(rx, y + 1 * s, rx - 2 * s, y - 7 * s);
      g.lineBetween(rx, y + 1 * s, rx - 2 * s, y + 9 * s);
    }
  }

  function drawCampfire(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(x, y + 4 * s, 30 * s, 10 * s);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillStyle(colour(theme, "rock"), 1);
      g.fillCircle(x + Math.cos(a) * 12 * s, y + Math.sin(a) * 6 * s, 3.4 * s);
    }
    g.lineStyle(3, colour(theme, "trunk"), 1);
    g.lineBetween(x - 8 * s, y + 2 * s, x + 8 * s, y - 1 * s);
    g.lineBetween(x - 8 * s, y - 1 * s, x + 8 * s, y + 2 * s);
    g.fillStyle(0xe0692c, 1);
    g.fillTriangle(x - 7 * s, y, x, y - 16 * s, x + 7 * s, y);
    g.fillStyle(0xffb43c, 1);
    g.fillTriangle(x - 4 * s, y, x + 1 * s, y - 10 * s, x + 4 * s, y);
    g.fillStyle(0xffef9e, 1);
    g.fillCircle(x, y - 3 * s, 1.8 * s);
  }

  function drawCactus(g, item, theme) {
    const s = item.scale || 1;
    const x = item.x;
    const y = item.y;
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(x + 3 * s, y + 12 * s, 26 * s, 8 * s);
    g.fillStyle(colour(theme, "tree"), 1);
    g.fillRoundedRect(x - 4 * s, y - 16 * s, 8 * s, 28 * s, 4 * s);
    g.fillRoundedRect(x - 14 * s, y - 8 * s, 10 * s, 6 * s, 3 * s);
    g.fillRoundedRect(x - 14 * s, y - 14 * s, 6 * s, 12 * s, 3 * s);
    g.fillRoundedRect(x + 4 * s, y - 2 * s, 10 * s, 6 * s, 3 * s);
    g.fillRoundedRect(x + 8 * s, y - 10 * s, 6 * s, 14 * s, 3 * s);
    g.fillStyle(colour(theme, "treeLight"), 0.9);
    g.fillRect(x - 2 * s, y - 12 * s, 2 * s, 10 * s);
    g.lineStyle(1, 0xd8e0b8, 0.7);
    for (let i = 0; i < 4; i++) {
      g.lineBetween(x + 3 * s, y - 12 * s + i * 5 * s, x + 7 * s, y - 14 * s + i * 5 * s);
      g.lineBetween(x - 3 * s, y - 10 * s + i * 5 * s, x - 7 * s, y - 12 * s + i * 5 * s);
    }
    g.fillStyle(colour(theme, "flower"), 1);
    g.fillCircle(x, y - 17 * s, 2 * s);
  }

  function drawScenery(scene, g, level, theme, baseDepth) {
    const items = level.scenery || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.texture && scene.textures.exists(item.texture)) {
        scene.add.image(item.x, item.y, item.texture)
          .setDepth(baseDepth + 1)
          .setScale(item.scale || 1)
          .setRotation(item.rotation || 0);
        continue;
      }
      switch (item.type) {
        case "rock": drawRock(g, item, theme); break;
        case "bush": drawBush(g, item, theme); break;
        case "pond": drawPond(g, item, theme); break;
        case "flower": drawFlower(g, item, theme); break;
        case "fern": drawFern(g, item, theme); break;
        case "bones": drawBones(g, item, theme); break;
        case "campfire": drawCampfire(g, item, theme); break;
        case "cactus": drawCactus(g, item, theme); break;
        case "tree":
        default: drawTree(g, item, theme); break;
      }
    }
  }

  function drawTreasure(scene, spot, theme, hideLabel) {
    const container = scene.add.container(spot.x, spot.y).setDepth(3);
    const glow = scene.add.circle(0, 0, 34, colour(theme, "gold"), 0.14);
    const g = scene.add.graphics();

    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(3, 12, 54, 14);
    g.fillStyle(0x6a4322, 1);
    g.fillRoundedRect(-23, -14, 46, 30, 4);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRoundedRect(-23, -18, 46, 12, 4);
    g.fillStyle(0xffd24d, 1);
    g.fillRect(-21, -6, 42, 4);
    g.fillRect(-3, -18, 6, 30);
    g.fillStyle(0xffef9e, 1);
    g.fillRect(-3, 2, 6, 7);
    g.lineStyle(2, 0x3a2414, 1);
    g.strokeRoundedRect(-23, -18, 46, 34, 4);

    container.add([glow, g]);
    if (!hideLabel) {
      const label = MB.ui.addText(scene, 0, 28, "TREASURE", {
        fontSize: "7px",
        color: "#ffd24d",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);
      container.add(label);
    }

    scene.tweens.add({
      targets: glow,
      alpha: 0.3,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    return container;
  }

  function drawDefense(scene, defense, theme) {
    const container = scene.add.container(defense.x, defense.y);
    const g = scene.add.graphics();
    const size = defense.size || 22;
    const enemy = colour(theme, "enemy");
    const enemyDark = colour(theme, "enemyDark");

    g.fillStyle(0x000000, 0.24);
    g.fillEllipse(3, 9, (size + 10) * 2, 12);

    if (defense.type === "ballista") {
      g.fillStyle(enemyDark, 1);
      g.fillCircle(0, 0, size + 3);
      g.fillStyle(0x8a5a32, 1);
      g.fillCircle(0, 0, size - 1);
      g.lineStyle(4, 0x4f351f, 1);
      g.lineBetween(-size + 4, -size * 0.75, size - 4, size * 0.75);
      g.lineBetween(-size + 4, size * 0.75, size - 4, -size * 0.75);
      g.lineStyle(3, 0xe6d2a8, 1);
      g.lineBetween(0, 0, size + 12, 0);
      g.fillStyle(0xe6d2a8, 1);
      g.fillTriangle(size + 12, 0, size + 4, -5, size + 4, 5);
      g.fillStyle(enemyDark, 1);
      g.fillCircle(0, 0, 6);
      g.lineStyle(2, 0x2e1c0e, 1);
      g.strokeCircle(0, 0, size + 3);
    } else if (defense.type === "bandit") {
      g.fillStyle(enemyDark, 1);
      g.fillCircle(0, 0, size + 3);
      g.fillStyle(enemy, 1);
      g.fillCircle(0, 0, size);
      g.fillStyle(0x5a3a24, 1);
      g.fillCircle(0, 0, size * 0.62);
      g.fillStyle(0xc99a6b, 1);
      g.fillCircle(size * 0.32, -size * 0.08, size * 0.55);
      g.fillStyle(0x4a3120, 1);
      g.fillEllipse(size * 0.3, -size * 0.08, size * 1.45, size * 0.48);
      g.fillStyle(0x3a2618, 1);
      g.fillRoundedRect(size * 0.02, -size * 0.42, size * 0.6, size * 0.36, 3);
      g.lineStyle(3, 0x2a1a10, 1);
      g.lineBetween(size * 0.5, 0, size + 12, 0);
      g.fillStyle(0xd9c8a8, 1);
      g.fillCircle(size + 12, 0, 2);
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(-size * 0.35, size * 0.45, 2);
      g.lineStyle(2, 0x2e1c0e, 1);
      g.strokeCircle(0, 0, size + 3);
      g.fillStyle(0x6b4a2a, 1);
      g.fillRoundedRect(-size * 1.7, size * 0.75, size * 0.9, size * 0.55, 3);
      g.lineStyle(1, 0x3a2414, 1);
      g.strokeRoundedRect(-size * 1.7, size * 0.75, size * 0.9, size * 0.55, 3);
    } else {
      g.fillStyle(enemyDark, 1);
      g.fillCircle(0, 0, size + 3);
      g.fillStyle(enemy, 1);
      g.fillCircle(0, 0, size - 2);
      g.fillStyle(enemyDark, 1);
      g.fillRect(-size * 0.8, -size * 0.8, 8, 8);
      g.fillRect(size * 0.8 - 8, -size * 0.8, 8, 8);
      g.fillRect(-size * 0.8, size * 0.8 - 8, 8, 8);
      g.fillRect(size * 0.8 - 8, size * 0.8 - 8, 8, 8);
      g.fillStyle(0x2a1610, 1);
      g.fillCircle(0, 0, size * 0.4);
      g.fillStyle(colour(theme, "gold"), 0.9);
      g.fillCircle(0, 0, 3);
      g.lineStyle(2, 0x2e1c0e, 1);
      g.strokeCircle(0, 0, size + 3);
      g.lineStyle(2, colour(theme, "enemy"), 1);
      g.lineBetween(0, -size, 0, -size - 14);
      g.fillStyle(colour(theme, "enemy"), 1);
      g.fillTriangle(1, -size - 14, 16, -size - 9, 1, -size - 4);
    }

    container.add(g);
    container.setDepth(6);
    if (defense.scale) container.setScale(defense.scale);
    return container;
  }

  function drawDino(scene, defense, theme, type) {
    const container = scene.add.container(defense.x, defense.y);
    const g = scene.add.graphics();
    const size = defense.size || 15;
    const color = defense.color || 0x7aa347;
    const dark = 0x2e3b22;

    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(3, size * 0.6, size * 3.2, size * 0.8);

    g.fillStyle(dark, 1);
    g.fillTriangle(-size * 1.5, 0, -size * 0.25, -size * 0.45, -size * 0.25, size * 0.45);

    g.fillStyle(color, 1);
    g.fillEllipse(0, 0, size * 2.1, size * 1.2);
    g.lineStyle(1.5, dark, 0.85);
    g.strokeEllipse(0, 0, size * 2.1, size * 1.2);

    if (type === "stego") {
      g.fillStyle(0x9a7a3e, 1);
      for (let i = 0; i < 4; i++) {
        const px = -size * 0.7 + i * size * 0.45;
        g.fillTriangle(px - size * 0.2, -size * 0.45, px, -size * 0.95, px + size * 0.2, -size * 0.45);
      }
      g.fillStyle(0xcfc7a0, 1);
      g.fillTriangle(-size * 1.1, -size * 0.15, -size * 1.55, -size * 0.55, -size * 0.95, -size * 0.35);
      g.fillTriangle(-size * 1.1, 0.15 * size, -size * 1.55, size * 0.55, -size * 0.95, size * 0.35);
    } else if (type === "trex") {
      g.fillStyle(dark, 1);
      g.fillCircle(-size * 0.45, size * 0.55, size * 0.3);
      g.fillCircle(size * 0.25, size * 0.6, size * 0.28);
      g.fillStyle(0x6a3d24, 1);
      g.fillTriangle(-size * 0.3, size * 0.75, -size * 0.05, size * 1.15, 0, size * 0.7);
      g.fillTriangle(size * 0.1, size * 0.75, size * 0.35, size * 1.1, size * 0.4, size * 0.65);
    } else {
      g.fillStyle(dark, 1);
      g.fillEllipse(-size * 0.45, size * 0.55, size * 0.55, size * 0.8);
      g.fillEllipse(size * 0.35, size * 0.55, size * 0.55, size * 0.8);
      g.lineStyle(1.5, dark, 0.55);
      g.lineBetween(-size * 0.6, -size * 0.3, -size * 0.2, -size * 0.45);
      g.lineBetween(-size * 0.2, -size * 0.35, size * 0.2, -size * 0.42);
    }

    const headSize = type === "trex" ? size * 0.78 : type === "stego" ? size * 0.4 : size * 0.55;
    const headX = type === "stego" ? size * 1.15 : size * 0.95;
    const headY = type === "stego" ? -size * 0.02 : -size * 0.25;

    g.fillStyle(color, 1);
    g.fillCircle(headX, headY, headSize);
    g.fillStyle(dark, 1);
    if (type === "trex") {
      g.fillTriangle(headX + headSize * 0.3, headY - headSize * 0.55,
        headX + headSize * 1.15, headY - headSize * 0.05,
        headX + headSize * 0.3, headY + headSize * 0.45);
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 3; i++) {
        const tx = headX + headSize * (0.5 + i * 0.18);
        g.fillTriangle(tx, headY + headSize * 0.15, tx + 2, headY + headSize * 0.45, tx + 4, headY + headSize * 0.15);
      }
    } else {
      g.fillTriangle(headX + headSize * 0.4, headY - headSize * 0.35,
        headX + headSize * 1.35, headY,
        headX + headSize * 0.4, headY + headSize * 0.35);
    }

    g.fillStyle(0xffe6a8, 1);
    g.fillCircle(headX - headSize * 0.05, headY - headSize * 0.28, Math.max(1.4, size * 0.12));
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(headX, headY - headSize * 0.28, Math.max(0.8, size * 0.06));

    container.add(g);
    container.setDepth(6);
    if (defense.scale) container.setScale(defense.scale);
    return container;
  }

  function drawStoneAgeUnit(scene, kind, def) {
    const container = scene.add.container(0, 0);
    const g = scene.add.graphics();
    const size = def.size;

    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(2, size * 0.5, (size + 8) * 2, size * 0.7);

    g.fillStyle(0x3a2a1c, 1);
    g.fillCircle(0, 0, size + 2);
    g.fillStyle(0x7a5334, 1);
    g.fillCircle(0, 0, size);
    g.fillStyle(0x5a3c24, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillTriangle(
        Math.cos(a - 0.18) * size, Math.sin(a - 0.18) * size,
        Math.cos(a) * (size + 4), Math.sin(a) * (size + 4),
        Math.cos(a + 0.18) * size, Math.sin(a + 0.18) * size
      );
    }

    g.fillStyle(0xc99a6b, 1);
    g.fillCircle(size * 0.35, 0, size * 0.6);
    g.fillStyle(0x4a3120, 1);
    g.fillCircle(size * 0.2, -size * 0.08, size * 0.42);
    g.fillStyle(def.accent, 1);
    g.fillRect(size * 0.1, -size * 0.36, size * 0.6, 3);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(size * 0.55, -size * 0.1, Math.max(1, size * 0.1));

    if (kind === "landsknecht") {
      g.fillStyle(0x6b4a2c, 1);
      g.fillRect(size * 0.2, -3, size * 0.9, 6);
      g.fillStyle(0x4a4a45, 1);
      g.fillRect(size + 5, -size * 0.5, size * 0.9, size);
      g.lineStyle(2, 0x8c8c82, 1);
      g.lineBetween(size * 0.4, 0, size + 16, 0);
      g.fillStyle(0xd8c8a8, 1);
      g.fillCircle(size + 17, 0, 2.2);
    } else if (kind === "archer") {
      g.lineStyle(2, 0xd8c8a8, 1);
      g.beginPath();
      g.arc(size * 0.72, 0, size * 0.62, -1.15, 1.15, false);
      g.strokePath();
      g.fillStyle(0x8c8c82, 1);
      g.fillCircle(size * 1.15, 0, size * 0.24);
    } else if (kind === "musketeer") {
      g.lineStyle(4, 0x6b4a2c, 1);
      g.lineBetween(size * 0.35, 0, size + 18, 0);
      g.fillStyle(0xd8c8a8, 1);
      g.fillTriangle(size + 18, 0, size + 10, -2, size + 10, 2);
      g.fillStyle(0xffe6a8, 1);
      g.fillCircle(size * 0.8, -size * 0.22, 2);
    } else if (kind === "grenadier") {
      g.fillStyle(0x4a4a45, 1);
      g.fillCircle(size + 9, 0, size * 0.45);
      g.lineStyle(1.5, 0xd8c8a8, 1);
      g.lineBetween(size + 9, -size * 0.35, size + 6, -size * 0.9);
      g.fillStyle(0xffb36b, 1);
      g.fillCircle(size + 6, -size * 0.9, 2);
    } else if (kind === "flamethrower") {
      g.fillStyle(0x8a5a2a, 1);
      g.fillCircle(-size * 0.55, -size * 0.3, size * 0.45);
      g.lineStyle(4, 0x6b4a2c, 1);
      g.lineBetween(size * 0.35, 0, size + 14, 0);
      g.fillStyle(0xff7a2f, 1);
      g.fillTriangle(size + 16, 0, size + 6, -4, size + 6, 4);
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(size + 19, 0, 2.5);
    } else if (kind === "rocketeer") {
      g.fillStyle(0x4fc3c7, 1);
      g.fillRect(size * 0.3, -size * 0.55, size * 1.1, size * 1.1);
      g.fillStyle(0x2a8f94, 1);
      g.fillCircle(size + 8, 0, size * 0.4);
      g.fillStyle(0xfff2b0, 1);
      g.fillTriangle(size + 14, 0, size + 8, -3, size + 8, 3);
    } else {
      g.lineStyle(4, 0x5a3f2a, 1);
      g.lineBetween(size * 0.4, 0, size + 10, 0);
      g.fillStyle(0x6f4a2c, 1);
      g.fillCircle(size + 11, 0, size * 0.42);
      g.fillStyle(0x8c8c82, 1);
      g.fillCircle(size + 11, 0, size * 0.2);
    }

    g.fillStyle(0x8c8c82, 1);
    g.fillCircle(-size * 0.5, size * 0.5, size * 0.25);

    container.add(g);
    return container;
  }

  function drawWesternUnit(scene, kind, def) {
    const container = scene.add.container(0, 0);
    const g = scene.add.graphics();
    const size = def.size;

    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(2, size * 0.5, (size + 8) * 2, size * 0.7);

    g.fillStyle(0x2a1a10, 1);
    g.fillCircle(0, 0, size + 2);
    g.fillStyle(def.color, 1);
    g.fillCircle(0, 0, size);
    g.fillStyle(0x3a2418, 0.9);
    g.fillTriangle(-size, size * 0.35, 0, size * 0.95, size, size * 0.35);

    g.fillStyle(0xc99a6b, 1);
    g.fillCircle(size * 0.35, -size * 0.05, size * 0.55);
    g.fillStyle(0x4a3120, 1);
    g.fillEllipse(size * 0.3, -size * 0.08, size * 1.35, size * 0.9);
    g.fillStyle(0x5a3f2a, 1);
    g.fillCircle(size * 0.3, -size * 0.08, size * 0.4);
    g.fillStyle(def.accent, 1);
    g.fillRect(size * 0.05, size * 0.18, size * 0.6, 2.5);

    if (kind === "landsknecht") {
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(-size * 0.3, size * 0.35, 2.6);
      g.fillStyle(0x7a5a10, 1);
      g.fillCircle(-size * 0.3, size * 0.35, 1);
    } else {
      g.lineStyle(2, 0xd9c8a8, 0.9);
      g.lineBetween(-size * 0.65, -size * 0.25, size * 0.35, size * 0.35);
    }

    if (kind === "landsknecht") {
      g.fillStyle(0x8a5a2a, 1);
      g.fillRect(size * 0.35, -3, size * 0.9, 6);
      g.fillStyle(0x3a3a36, 1);
      g.fillRect(size + 5, -size * 0.45, size * 0.9, size * 0.9);
      g.lineStyle(2, 0xd9c8a8, 1);
      g.lineBetween(size * 0.45, 0, size + 16, 0);
      g.fillStyle(0xd9c8a8, 1);
      g.fillCircle(size + 17, 0, 2.2);
    } else if (kind === "grenadier") {
      g.fillStyle(0xb03024, 1);
      g.fillRect(size * 0.5, -size * 0.45, size * 0.7, size * 0.9);
      g.lineStyle(1.5, 0xd9c8a8, 1);
      g.lineBetween(size + 8, -size * 0.3, size + 13, -size * 0.75);
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(size + 13, -size * 0.75, 2);
    } else if (kind === "flamethrower") {
      g.fillStyle(0xb03024, 1);
      g.fillRect(-size * 0.9, -size * 0.5, size * 0.7, size);
      g.lineStyle(3, 0x2a1a10, 1);
      g.lineBetween(size * 0.45, 0, size + 15, 0);
      g.fillStyle(0xff8a2f, 1);
      g.fillTriangle(size + 17, 0, size + 8, -4, size + 8, 4);
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(size + 20, 0, 2.2);
    } else if (kind === "rocketeer") {
      g.fillStyle(0x4fc3c7, 1);
      g.fillRect(-size * 0.9, -size * 0.45, size * 0.75, size * 0.9);
      g.fillStyle(0x2a8f94, 1);
      g.fillRect(size * 0.35, -size * 0.55, size * 1.25, size * 1.1);
      g.fillStyle(0xfff2b0, 1);
      g.fillTriangle(size + 18, 0, size + 10, -4, size + 10, 4);
    } else {
      const barrel = kind === "musketeer" ? size + 22 : size + 12;
      g.lineStyle(3, 0x2a1a10, 1);
      g.lineBetween(size * 0.45, 0, barrel, 0);
      g.fillStyle(0xd9c8a8, 1);
      g.fillCircle(barrel, 0, 2);
      if (kind === "musketeer") {
        g.fillStyle(0x6b4a2c, 1);
        g.fillRect(size * 0.35, -2.5, size * 0.9, 5);
      }
    }

    container.add(g);
    return container;
  }

  function drawUnit(scene, kind, def, style) {
    if (style === "stoneage") return drawStoneAgeUnit(scene, kind, def);
    if (style === "western") return drawWesternUnit(scene, kind, def);

    const container = scene.add.container(0, 0);
    const g = scene.add.graphics();
    const size = def.size;
    const color = def.color;
    const accent = def.accent;

    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(2, size * 0.5, (size + 8) * 2, size * 0.7);

    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(0, 0, size + 2);
    g.fillStyle(color, 1);
    g.fillCircle(0, 0, size);
    g.fillStyle(accent, 1);
    g.fillCircle(-1, -1, size * 0.45);

    if (kind === "landsknecht") {
      g.fillStyle(0x2a1a10, 1);
      g.fillRect(size * 0.35, -3.5, size, 7);
      g.fillStyle(0x3a3a36, 1);
      g.fillRect(size + 6, -size * 0.5, size, size);
      g.lineStyle(2, 0xd8c8a8, 1);
      g.lineBetween(size * 0.4, 0, size + 17, 0);
      g.fillStyle(0xd8c8a8, 1);
      g.fillCircle(size + 18, 0, 2.2);
    } else if (kind === "archer") {
      g.lineStyle(2, 0x3a2a18, 1);
      g.beginPath();
      g.arc(size * 0.65, 0, size * 0.9, -1.25, 1.25, false);
      g.strokePath();
      g.lineStyle(1.5, accent, 1);
      g.lineBetween(size * 0.65, -size * 0.85, size * 0.65, size * 0.85);
      g.lineStyle(2, 0xffe6a8, 1);
      g.lineBetween(size * 0.3, 0, size + 9, 0);
      g.fillStyle(0xffe6a8, 1);
      g.fillTriangle(size + 9, 0, size + 3, -3, size + 3, 3);
    } else if (kind === "musketeer") {
      g.fillStyle(0x2a1a10, 1);
      g.fillRect(size * 0.4, -3, size * 1.4, 6);
      g.fillStyle(0x9a9a92, 1);
      g.fillRect(size + 4, -1.5, size * 0.8, 3);
      g.fillStyle(0xffd24d, 1);
      g.fillRect(size * 0.35, -size * 0.5, 3, size);
    } else if (kind === "grenadier") {
      g.fillStyle(0x3a2a1a, 1);
      g.fillRect(size * 0.5, -size * 0.7, size * 0.7, size * 1.4);
      g.fillStyle(0x4a4a45, 1);
      g.fillCircle(size + 8, 0, size * 0.42);
      g.lineStyle(1.5, accent, 1);
      g.lineBetween(size + 8, -size * 0.35, size + 5, -size * 0.85);
      g.fillStyle(0xffb36b, 1);
      g.fillCircle(size + 5, -size * 0.85, 2);
    } else if (kind === "flamethrower") {
      g.fillStyle(0xb03024, 1);
      g.fillRect(-size * 0.95, -size * 0.6, size * 0.75, size * 1.2);
      g.fillStyle(0x2a1a10, 1);
      g.fillRect(size * 0.4, -3, size * 1.3, 6);
      g.fillStyle(0xff7a2f, 1);
      g.fillTriangle(size + 18, 0, size + 8, -5, size + 8, 5);
      g.fillStyle(0xffd24d, 1);
      g.fillCircle(size + 21, 0, 2.4);
    } else if (kind === "rocketeer") {
      g.fillStyle(0x4fc3c7, 1);
      g.fillRect(-size * 0.95, -size * 0.55, size * 0.8, size * 1.1);
      g.fillStyle(0x2a8f94, 1);
      g.fillRect(size * 0.35, -size * 0.6, size * 1.35, size * 1.2);
      g.fillStyle(0xfff2b0, 1);
      g.fillTriangle(size + 19, 0, size + 10, -5, size + 10, 5);
    } else {
      g.fillStyle(accent, 1);
      g.fillRect(size * 0.55, -size * 0.8, 5, size * 1.6);
      g.lineStyle(2, 0xd8c8a8, 1);
      g.lineBetween(size * 0.3, 0, size + 13, 0);
      g.fillStyle(0xd8c8a8, 1);
      g.fillTriangle(size + 13, 0, size + 7, -3, size + 7, 3);
    }

    container.add(g);
    return container;
  }

  function drawLabels(scene, level, theme) {
    const area = level.playerArea;
    const start = level.path[0];
    const startBottom = start.y > area.y + area.h / 2;
    const labelY = startBottom ? area.y + area.h - 13 : area.y + 13;
    MB.ui.addText(scene, area.x + area.w / 2, labelY, "YOUR CAMP", {
      fontSize: "7px",
      color: "#d8e8ff",
      stroke: "#000000",
      strokeThickness: 3
    }).setDepth(2);
  }

  function drawMap(scene, level, path, opts) {
    opts = opts || {};
    const theme = level.theme || {};
    const baseDepth = opts.depth || 0;
    const g = scene.add.graphics().setDepth(baseDepth);

    if (!opts.skipGround) drawGround(g, level, theme);
    drawCamp(g, level, theme);
    strokePath(
      g,
      path.points,
      level.pathWidth,
      colour(theme, "path"),
      colour(theme, "pathEdge")
    );
    drawScenery(scene, g, level, theme, baseDepth);
    if (!opts.menu) drawLabels(scene, level, theme);
    const treasure = drawTreasure(scene, level.treasure, theme, opts.menu);
    treasure.setDepth(baseDepth + 3);

    return { g: g, treasure: treasure };
  }

  function drawMiniMap(scene, level, cx, cy, w, h) {
    const theme = level.theme || {};
    const g = scene.add.graphics();
    const mapW = MB.config.WIDTH;
    const mapH = MB.config.HEIGHT;
    const pad = 7;
    const sx = (w - pad * 2) / mapW;
    const sy = (h - pad * 2) / mapH;
    const left = cx - w / 2 + pad;
    const top = cy - h / 2 + pad;

    function pt(p) {
      return { x: left + p.x * sx, y: top + p.y * sy };
    }

    g.fillStyle(colour(theme, "grassDark"), 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
    g.lineStyle(2, colour(theme, "campEdge"), 0.5);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);

    const area = level.playerArea;
    const areaTopLeft = pt({ x: area.x, y: area.y });
    g.fillStyle(colour(theme, "camp"), 0.45);
    g.fillRect(areaTopLeft.x, areaTopLeft.y, area.w * sx, area.h * sy);

    g.lineStyle(4, colour(theme, "pathEdge"), 1);
    g.beginPath();
    const first = pt(level.path[0]);
    g.moveTo(first.x, first.y);
    for (let i = 1; i < level.path.length; i++) {
      const p = pt(level.path[i]);
      g.lineTo(p.x, p.y);
    }
    g.strokePath();

    g.lineStyle(2, colour(theme, "path"), 1);
    g.beginPath();
    g.moveTo(first.x, first.y);
    for (let i = 1; i < level.path.length; i++) {
      const p = pt(level.path[i]);
      g.lineTo(p.x, p.y);
    }
    g.strokePath();

    for (let i = 0; i < level.defenses.length; i++) {
      const d = pt(level.defenses[i]);
      g.fillStyle(colour(theme, "enemy"), 1);
      g.fillCircle(d.x, d.y, 2.5);
    }

    const t = pt(level.treasure);
    g.fillStyle(colour(theme, "gold"), 1);
    g.fillCircle(t.x, t.y, 4);
    return g;
  }

  function drawMenuBackdrop(scene, level) {
    const path = MB.path.build(level.path);
    const map = drawMap(scene, level, path, { menu: true, depth: -20 });
    scene.add.rectangle(MB.config.WIDTH / 2, MB.config.HEIGHT / 2, MB.config.WIDTH, MB.config.HEIGHT, 0x07120a, 0.62);
    return map;
  }

  function drawStone(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x8c8c82, 1);
    g.fillTriangle(-5, -3, 4, -4, 5, 3);
    g.fillTriangle(-5, -3, 5, 3, -4, 4);
    g.lineStyle(1, 0x4f4f47, 1);
    g.strokeTriangle(-5, -3, 4, -4, 5, 3);
    g.strokeTriangle(-5, -3, 5, 3, -4, 4);
    g.fillStyle(0xd8d4c0, 0.75);
    g.fillCircle(-1, -1, 1.3);
    container.add(g);
    return container;
  }

  function drawBullet(scene, x, y, color) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    const tint = color == null ? 0xffe6a8 : color;
    g.fillStyle(tint, 0.25);
    g.fillCircle(-7, 0, 3.2);
    g.fillStyle(tint, 1);
    g.fillRect(-7, -1.5, 13, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, -0.8, 4, 1.6);
    container.add(g);
    return container;
  }

  function drawGrenade(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x3a3a36, 1);
    g.fillCircle(0, 0, 4.5);
    g.lineStyle(1, 0x1c1c1a, 1);
    g.strokeCircle(0, 0, 4.5);
    g.fillStyle(0x8c8c82, 0.8);
    g.fillCircle(-1.4, -1.4, 1.3);
    g.lineStyle(1.4, 0xd8c8a8, 1);
    g.lineBetween(2, -3.5, 4, -7);
    g.fillStyle(0xffd24d, 1);
    g.fillCircle(4, -7, 1.6);
    container.add(g);
    return container;
  }

  function drawMine(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    // Spikes around a flat disc, with a red arming light in the middle.
    g.fillStyle(0x33382f, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillCircle(Math.cos(a) * 6.5, Math.sin(a) * 6.5, 2.4);
    }
    g.fillStyle(0x4c5347, 1);
    g.fillCircle(0, 0, 6.5);
    g.lineStyle(1.5, 0x22261f, 1);
    g.strokeCircle(0, 0, 6.5);
    g.fillStyle(0x2a2e27, 1);
    g.fillCircle(-1.4, -1.4, 2.6);
    g.fillStyle(0xff5a4a, 1);
    g.fillCircle(1.6, 1, 2);
    container.add(g);
    return container;
  }

  function drawFlame(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0xff5a1f, 0.55);
    g.fillCircle(-2, 0, 6);
    g.fillStyle(0xff8a2f, 0.9);
    g.fillCircle(0, 0, 4.5);
    g.fillStyle(0xffd24d, 1);
    g.fillCircle(1.5, 0, 2.5);
    g.fillStyle(0xfff4c2, 1);
    g.fillCircle(3, 0, 1.3);
    container.add(g);
    return container;
  }

  function drawFlameBurst(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0xff5a1f, 0.45);
    g.fillCircle(0, 0, 16);
    g.fillStyle(0xff8a2f, 0.7);
    g.fillCircle(-4, -2, 9);
    g.fillCircle(4, 2, 8);
    g.fillStyle(0xffd24d, 0.85);
    g.fillCircle(0, -1, 5);
    g.fillStyle(0xfff4c2, 1);
    g.fillCircle(1, -2, 2.4);
    container.add(g);
    return container;
  }

  function drawRocket(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0xffa23c, 0.95);
    g.fillTriangle(-9, -2, -17, 0, -9, 2);
    g.fillStyle(0xfff2b0, 1);
    g.fillTriangle(-9, -1, -13, 0, -9, 1);
    g.fillStyle(0x4fc3c7, 1);
    g.fillTriangle(-8, -2.5, -4, -6, -3, -2.5);
    g.fillTriangle(-8, 2.5, -4, 6, -3, 2.5);
    g.fillStyle(0xe8f6f6, 1);
    g.fillRect(-9, -2.5, 15, 5);
    g.fillStyle(0x2a8f94, 1);
    g.fillRect(-9, -2.5, 4, 5);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(6, -2.5, 12, 0, 6, 2.5);
    container.add(g);
    return container;
  }

  function drawRocketBlast(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x4fc3c7, 0.35);
    g.fillCircle(0, 0, 30);
    g.fillStyle(0xff8a2f, 0.8);
    g.fillCircle(0, 0, 20);
    g.fillStyle(0xffd24d, 0.95);
    g.fillCircle(-4, -2, 11);
    g.fillStyle(0xfffbe0, 1);
    g.fillCircle(-6, -3, 5);
    g.lineStyle(2, 0xd6ffff, 0.9);
    g.strokeCircle(0, 0, 34);
    container.add(g);
    return container;
  }

  function drawNuke(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    // A small missile with fins and a flame, pointing along +x.
    g.fillStyle(0xff9a3c, 0.9);
    g.fillTriangle(-10, -2, -18, 0, -10, 2);
    g.fillStyle(0xffe27a, 1);
    g.fillTriangle(-10, -1, -14, 0, -10, 1);
    g.fillStyle(0x8f9a8c, 1);
    g.fillTriangle(-10, -2.5, -6, -7, -4, -2.5);
    g.fillTriangle(-10, 2.5, -6, 7, -4, 2.5);
    g.fillStyle(0xd8dcd0, 1);
    g.fillRect(-10, -2.5, 16, 5);
    g.fillStyle(0x9aa39a, 1);
    g.fillRect(-10, -2.5, 4, 5);
    g.fillStyle(0xf2f4e8, 1);
    g.fillTriangle(6, -2.5, 11, 0, 6, 2.5);
    container.add(g);
    return container;
  }

  function drawNuclearBlast(scene, x, y) {
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0xffe06a, 0.7);
    g.fillCircle(0, 0, 52);
    g.fillStyle(0xfffbe0, 0.95);
    g.fillCircle(0, 0, 32);
    // Rising stem and billowing cap.
    g.fillStyle(0xb9b0a0, 0.85);
    g.fillEllipse(0, 20, 22, 58);
    g.fillStyle(0xd8cfbd, 0.92);
    g.fillCircle(-24, -12, 24);
    g.fillCircle(24, -12, 24);
    g.fillCircle(0, -22, 30);
    g.fillStyle(0xfff2cf, 0.9);
    g.fillCircle(-10, -27, 14);
    g.fillCircle(12, -24, 12);
    g.lineStyle(3, 0xfff4c2, 0.8);
    g.strokeCircle(0, 0, 66);
    container.add(g);
    return container;
  }

  function drawExplosion(scene, x, y, radius) {
    const r = radius || 48;
    const container = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0xff7a2f, 0.45);
    g.fillCircle(0, 0, r * 0.55);
    g.fillStyle(0xffd24d, 0.7);
    g.fillCircle(0, 0, r * 0.36);
    g.fillStyle(0xfff4c2, 1);
    g.fillCircle(0, 0, r * 0.18);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillStyle(i % 2 ? 0xffd24d : 0xff7a2f, 0.9);
      g.fillCircle(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.1);
    }
    container.add(g);
    return container;
  }

  function starPoints(cx, cy, outer, inner, points) {
    const result = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      result.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return result;
  }

  // A row of three stars. The first `count` are lit; the rest are dim placeholders.
  function drawStars(scene, x, y, count, size) {
    size = size || 10;
    const max = (MB.config.STARS && MB.config.STARS.MAX) || 3;
    const gap = size * 2.3;
    const container = scene.add.container(x, y);
    for (let i = 0; i < max; i++) {
      const g = scene.add.graphics();
      const pts = starPoints(0, 0, size, size * 0.45, 5);
      const filled = i < count;
      g.fillStyle(filled ? 0xffd24d : 0x2c3428, filled ? 1 : 0.9);
      g.fillPoints(pts, true);
      g.lineStyle(1.5, filled ? 0xfff0b0 : 0x59654f, 1);
      g.strokePoints(pts, true);
      g.setPosition((i - (max - 1) / 2) * gap, 0);
      container.add(g);
    }
    return container;
  }

  return {
    drawMap: drawMap,
    drawMiniMap: drawMiniMap,
    drawMenuBackdrop: drawMenuBackdrop,
    drawDefense: drawDefense,
    drawDino: drawDino,
    drawUnit: drawUnit,
    drawStone: drawStone,
    drawBullet: drawBullet,
    drawGrenade: drawGrenade,
    drawMine: drawMine,
    drawFlame: drawFlame,
    drawFlameBurst: drawFlameBurst,
    drawRocket: drawRocket,
    drawRocketBlast: drawRocketBlast,
    drawNuke: drawNuke,
    drawNuclearBlast: drawNuclearBlast,
    drawExplosion: drawExplosion,
    drawStars: drawStars,
    rng: rng
  };
})();
