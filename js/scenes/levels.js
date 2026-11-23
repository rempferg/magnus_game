window.MB = window.MB || {};

MB.Scenes = MB.Scenes || {};

MB.Scenes.Levels = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Levels() {
    Phaser.Scene.call(this, { key: "Levels" });
  },

  init: function (data) {
    this.page = (data && data.page) || 0;
  },

  create: function () {
    const C = MB.config;
    this.levels = MB.Levels.all();
    this.state = MB.save.load();
    this.pageSize = 4;

    if (this.levels.length) MB.art.drawMenuBackdrop(this, this.levels[0]);
    else this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x07120a, 1);

    MB.ui.addButton(this, 72, 28, 112, 32, "‹ MENU", {
      fill: 0x2d4a32,
      fillOver: 0x3e6645,
      fontSize: "9px",
      onClick: function () {
        MB.audio.click();
        MB.sceneGo(this, "Menu");
      }.bind(this)
    });

    MB.ui.addText(this, C.WIDTH / 2, 52, "CHOOSE YOUR MAP", {
      fontSize: "24px",
      color: "#ffd24d",
      fontStyle: "bold",
      stroke: "#081009",
      strokeThickness: 6
    });

    MB.ui.addText(this, C.WIDTH / 2, 84, "Every map is a separate level. Clear one to unlock the next.", {
      fontSize: "9px",
      color: "#d7e4c8",
      stroke: "#081009",
      strokeThickness: 3
    });

    const pages = Math.max(1, Math.ceil(this.levels.length / this.pageSize));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const start = this.page * this.pageSize;

    for (let i = 0; i < this.pageSize; i++) {
      const level = this.levels[start + i];
      if (!level) break;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = col === 0 ? 245 : 715;
      const cy = row === 0 ? 218 : 388;
      this.drawLevelCard(level, cx, cy, start + i);
    }

    if (!this.levels.length) {
      MB.ui.addText(this, C.WIDTH / 2, 300, "No levels loaded.", { fontSize: "12px", color: "#ff8888" });
    }

    if (pages > 1) {
      MB.ui.addButton(this, 430, 510, 120, 34, "‹ PREV", {
        fill: 0x2d4a32,
        fillOver: 0x3e6645,
        fontSize: "9px",
        onClick: function () {
          if (this.page > 0) {
            MB.audio.click();
            this.scene.restart({ page: this.page - 1 });
          }
        }.bind(this)
      });
      MB.ui.addText(this, 480, 510, (this.page + 1) + " / " + pages, {
        fontSize: "9px",
        color: "#cfe0c0"
      });
      MB.ui.addButton(this, 530, 510, 120, 34, "NEXT ›", {
        fill: 0x2d4a32,
        fillOver: 0x3e6645,
        fontSize: "9px",
        onClick: function () {
          if (this.page < pages - 1) {
            MB.audio.click();
            this.scene.restart({ page: this.page + 1 });
          }
        }.bind(this)
      });
    }

    MB.ui.addText(this, C.WIDTH - 50, 16, C.VERSION, {
      fontSize: "12px",
      color: "#8a9c80",
      origin: 1
    });
  },

  isUnlocked: function (index) {
    if (index <= 0) return true;
    if (MB.save.isComplete(this.state, this.levels[index].id)) return true;
    const previous = this.levels[index - 1];
    return MB.save.isComplete(this.state, previous.id);
  },

  drawLevelCard: function (level, cx, cy, index) {
    const unlocked = this.isUnlocked(index);
    const completed = MB.save.isComplete(this.state, level.id);

    MB.ui.addPanel(this, cx, cy, 430, 150, {
      fill: unlocked ? 0x102015 : 0x0b130d,
      alpha: 0.96,
      border: completed ? 0x7fbf6a : unlocked ? 0x7a8f62 : 0x3f4a3a
    });

    const map = MB.art.drawMiniMap(this, level, cx - 122, cy, 150, 100);
    if (!unlocked) map.setAlpha(0.32);

    const scale = MB.config.enemyScale(level.number);
    MB.ui.addText(this, cx - 30, cy - 52,
      "LEVEL " + level.number + "   ENEMY POWER x" + scale.hp.toFixed(2), {
      fontSize: "8px",
      color: unlocked ? "#ffd24d" : "#66705c",
      origin: 0
    });
    MB.ui.addText(this, cx - 30, cy - 34, level.name, {
      fontSize: "13px",
      color: unlocked ? "#ffffff" : "#7b8573",
      origin: 0
    });
    MB.ui.addText(this, cx - 30, cy - 16, level.subtitle + "\n" + level.brief, {
      fontSize: "7px",
      color: unlocked ? "#b9cbaa" : "#65705f",
      lineSpacing: 6,
      wordWrap: 210,
      origin: 0,
      align: "left"
    });

    const status = completed ? "CLEARED" : unlocked ? "READY" : "LOCKED";
    const statusColour = completed ? "#8fe08a" : unlocked ? "#ffd24d" : "#7b8573";
    MB.ui.addText(this, cx - 30, cy + 43, status, {
      fontSize: "8px",
      color: statusColour,
      origin: 0
    });

    if (completed) {
      MB.art.drawStars(this, cx + 45, cy + 18, MB.save.getStars(this.state, level.id), 8);
    }

    if (!unlocked) {
      MB.ui.addButton(this, cx + 145, cy + 44, 118, 34, "LOCKED", {
        fill: 0x333d31,
        fillOver: 0x333d31,
        fontSize: "9px",
        textColor: "#7b8573",
        onClick: function () {}
      });
      return;
    }

    MB.ui.addButton(this, cx + 145, cy + 44, 118, 34, completed ? "REPLAY" : "PLAY", {
      fill: completed ? 0x2b5a38 : 0x2f7d3d,
      fillOver: completed ? 0x3d7a4b : 0x44a356,
      fontSize: "10px",
      onClick: function () {
        MB.audio.unlock();
        MB.audio.click();
        MB.sceneGo(this, "Level", { levelId: level.id });
      }.bind(this)
    });
  }
});
