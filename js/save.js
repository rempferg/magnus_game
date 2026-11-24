window.MB = window.MB || {};

MB.save = (function () {
  "use strict";

  const KEY = "german-attack-save-v1";

  function defaults() {
    return {
      version: 1,
      levels: {},
      unlocks: []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const data = JSON.parse(raw);
      const levels = {};
      if (data.levels && typeof data.levels === "object") {
        Object.keys(data.levels).forEach(function (id) {
          const rec = data.levels[id];
          if (rec && rec.completed) {
            levels[id] = {
              completed: true,
              completedAt: rec.completedAt || 0,
              stars: clampStars(rec.stars)
            };
          }
        });
      }
      const unlocks = [];
      if (Array.isArray(data.unlocks)) {
        const known = MB.config.UNIT_ORDER || [];
        data.unlocks.forEach(function (kind) {
          if (known.indexOf(kind) >= 0 && unlocks.indexOf(kind) < 0) unlocks.push(kind);
        });
      }
      return { version: 1, levels: levels, unlocks: unlocks };
    } catch (e) {
      return defaults();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // storage unavailable, ignore
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      // ignore
    }
  }

  function clampStars(value) {
    const n = Number(value);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.min(MB.config.STARS ? MB.config.STARS.MAX : 3, Math.floor(n));
  }

  function isComplete(state, levelId) {
    return !!(state.levels[levelId] && state.levels[levelId].completed);
  }

  function getStars(state, levelId) {
    const rec = state.levels[levelId];
    return rec ? clampStars(rec.stars) : 0;
  }

  function completeLevel(levelId, stars) {
    const state = load();
    const prev = state.levels[levelId] || {};
    state.levels[levelId] = {
      completed: true,
      completedAt: prev.completedAt || Date.now(),
      // Keep the best result, so replaying a level never loses stars.
      stars: Math.max(clampStars(prev.stars), clampStars(stars))
    };
    // The treasure unlocks a new soldier with a new weapon.
    const reward = MB.config.TREASURE_UNLOCK;
    if (reward && state.unlocks.indexOf(reward) < 0) state.unlocks.push(reward);
    save(state);
    return state;
  }

  function isUnlocked(state, kind) {
    if (!MB.config.TREASURE_UNLOCK || kind !== MB.config.TREASURE_UNLOCK) return true;
    return !!(state && state.unlocks && state.unlocks.indexOf(kind) >= 0);
  }

  return {
    defaults: defaults,
    load: load,
    save: save,
    clear: clear,
    isComplete: isComplete,
    getStars: getStars,
    completeLevel: completeLevel,
    isUnlocked: isUnlocked
  };
})();