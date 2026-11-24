window.MB = window.MB || {};

MB.Scenes = MB.Scenes || {};

MB.Scenes.Menu = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Menu() {
    Phaser.Scene.call(this, { key: "Menu" });
  },

  create: function () {
    const C = MB.config;
    const levels = MB.Levels.all();
    this.state = MB.save.load();

    if (levels.length) MB.art.drawMenuBackdrop(this, levels[0]);
    else this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x07120a, 1);

    MB.ui.addText(this, C.WIDTH / 2, 112, C.TITLE.toUpperCase(), {
      fontSize: "38px",
      color: "#ffd24d",
      fontStyle: "bold",
      stroke: "#081009",
      strokeThickness: 8
    });

    MB.ui.addText(this, C.WIDTH / 2, 166, "Answer German. Raise an army. Take the treasure.", {
      fontSize: "10px",
      color: "#e8f0d8",
      stroke: "#081009",
      strokeThickness: 4
    });

    const panel = MB.ui.addPanel(this, C.WIDTH / 2, 278, 660, 132, {
      fill: 0x0b1a0e,
      alpha: 0.88,
      border: 0x6d8a5a
    });
    panel.setDepth(1);

    MB.ui.addText(this, C.WIDTH / 2, 246, "HOW IT WORKS", {
      fontSize: "10px",
      color: "#ffd24d"
    }).setDepth(2);

    MB.ui.addText(this, C.WIDTH / 2, 288, [
      "1. Answer German questions to earn supply.",
      "2. Spend supply to train your army.",
      "3. March down the road and reach the treasure."
    ].join("\n"), {
      fontSize: "9px",
      color: "#cfe0c0",
      lineSpacing: 13
    }).setDepth(2);

    const cleared = levels.filter(function (level) {
      return MB.save.isComplete(this.state, level.id);
    }, this).length;

    MB.ui.addText(this, C.WIDTH / 2, 366, levels.length
      ? "Campaign: " + cleared + " / " + levels.length + " maps cleared"
      : "No levels loaded.", {
      fontSize: "9px",
      color: "#9fb894"
    }).setDepth(2);

    MB.ui.addButton(this, C.WIDTH / 2, 432, 300, 62, "PLAY", {
      fill: 0x2f7d3d,
      fillOver: 0x44a356,
      fontSize: "22px",
      onClick: function () {
        MB.audio.unlock();
        MB.audio.click();
        MB.sceneGo(this, "Levels");
      }.bind(this)
    }).setDepth(2);

    MB.ui.addButton(this, C.WIDTH / 2, 500, 220, 38, "RESET PROGRESS", {
      fill: 0x6e3232,
      fillOver: 0x8d4444,
      fontSize: "9px",
      onClick: function () {
        MB.audio.click();
        this.showResetConfirm();
      }.bind(this)
    }).setDepth(2);

    MB.ui.addText(this, C.WIDTH - 50, 16, C.VERSION, {
      fontSize: "12px",
      color: "#8a9c80",
      origin: 1
    }).setDepth(2);
  },

  showResetConfirm: function () {
    if (this.resetModal) return;
    const C = MB.config;

    const dim = this.add.rectangle(C.WIDTH / 2, C.HEIGHT / 2, C.WIDTH, C.HEIGHT, 0x000000, 0.78);
    dim.setInteractive();
    const panel = MB.ui.addPanel(this, C.WIDTH / 2, C.HEIGHT / 2, 540, 250, {
      fill: 0x1c2417,
      alpha: 0.98,
      border: 0xd06a5a
    });
    const title = MB.ui.addText(this, C.WIDTH / 2, 196, "RESET PROGRESS?", {
      fontSize: "17px",
      color: "#ff8a7a"
    });
    const body = MB.ui.addText(this, C.WIDTH / 2, 248, "All cleared maps will be locked again.\nThis cannot be reverted.", {
      fontSize: "10px",
      color: "#e6e0ce",
      lineSpacing: 12
    });
    const cancel = MB.ui.addButton(this, C.WIDTH / 2 - 120, 326, 200, 44, "CANCEL", {
      fill: 0x365a38,
      fillOver: 0x4a7a4d,
      fontSize: "11px",
      onClick: function () {
        MB.audio.click();
        this.resetModal.destroy(true);
        this.resetModal = null;
      }.bind(this)
    });
    const reset = MB.ui.addButton(this, C.WIDTH / 2 + 120, 326, 200, 44, "YES, RESET", {
      fill: 0x7a3030,
      fillOver: 0xa14141,
      fontSize: "11px",
      onClick: function () {
        MB.audio.click();
        MB.save.clear();
        this.scene.restart();
      }.bind(this)
    });

    this.resetModal = this.add.container(0, 0).setDepth(200);
    this.resetModal.add([dim, panel, title, body, cancel, reset]);
  }
});
