window.MB = window.MB || {};

// Level registry. Each level is a plain data object in its own file; see
// LEVELS.md for the schema. Adding a level means adding one file and one
// <script> tag, not touching the game scenes.
MB.Levels = (function () {
  "use strict";

  const list = [];

  function define(def) {
    if (!def || !def.id) throw new Error("Level needs an id");
    if (!def.path || def.path.length < 2) throw new Error("Level " + def.id + " needs a path");
    if (!def.treasure) throw new Error("Level " + def.id + " needs a treasure position");
    if (find(def.id)) throw new Error("Duplicate level id: " + def.id);

    def.number = def.number || list.length + 1;
    def.pathWidth = def.pathWidth || 36;
    def.playerArea = def.playerArea || { x: 10, y: 50, w: 130, h: 370 };
    def.theme = def.theme || {};
    def.defenses = def.defenses || [];
    def.scenery = def.scenery || [];
    def.unitStats = def.unitStats || {};
    def.startingSupply = def.startingSupply || 0;

    list.push(def);
    list.sort(function (a, b) { return a.number - b.number; });
    return def;
  }

  function find(id) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function all() {
    return list.slice();
  }

  function indexOf(id) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  function next(id) {
    const i = indexOf(id);
    return i >= 0 && i + 1 < list.length ? list[i + 1] : null;
  }

  return {
    define: define,
    get: find,
    all: all,
    indexOf: indexOf,
    next: next,
    count: function () { return list.length; }
  };
})();

// Geometry for the marching path. Levels only describe waypoints; distance
// along the path, position and facing are derived here.
MB.path = (function () {
  "use strict";

  function build(points) {
    if (!points || points.length < 2) throw new Error("Path needs at least two points");

    const segments = [];
    let total = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len <= 0.0001) continue;
      segments.push({
        ax: a.x, ay: a.y,
        bx: b.x, by: b.y,
        len: len,
        angle: Math.atan2(dy, dx)
      });
      total += len;
    }

    if (!segments.length) throw new Error("Path has no length");

    function pointAt(distance) {
      let left = Math.max(0, Math.min(total, distance));
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (left <= seg.len || i === segments.length - 1) {
          const t = seg.len ? Math.min(1, left / seg.len) : 0;
          return {
            x: seg.ax + (seg.bx - seg.ax) * t,
            y: seg.ay + (seg.by - seg.ay) * t,
            angle: seg.angle
          };
        }
        left -= seg.len;
      }
      const last = segments[segments.length - 1];
      return { x: last.bx, y: last.by, angle: last.angle };
    }

    function pointAtOffset(distance, offset) {
      const p = pointAt(distance);
      return {
        x: p.x - Math.sin(p.angle) * offset,
        y: p.y + Math.cos(p.angle) * offset,
        angle: p.angle
      };
    }

    return {
      points: points,
      segments: segments,
      length: total,
      pointAt: pointAt,
      pointAtOffset: pointAtOffset
    };
  }

  return { build: build };
})();
