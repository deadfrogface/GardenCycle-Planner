(function () {
  'use strict';

  const Storage = window.GardenCycleStorage;
  const CATEGORIES = ['Gemüse', 'Obst', 'Kräuter', 'Blumen', 'Sonstige'];
  const SAISONS = ['Frühjahr', 'Sommer', 'Herbst', 'Winter'];

  function nextId() {
    return 'p' + Date.now() + '-' + Math.round(Math.random() * 9999);
  }

  function ensureSeed(data) {
    if (data.plants && data.plants.length > 0) return Promise.resolve(data);
    return Storage.getDefaultPlantsJson()
      .then((raw) => {
        let list = [];
        try {
          list = JSON.parse(raw || '[]');
        } catch (_) {}
        data.plants = list.map((p, i) => ({ id: 'p0-' + i, ...p }));
        return Storage.write(data).then(() => data);
      });
  }

  function load(data) {
    return ensureSeed(data || {}).then((d) => d.plants || []);
  }

  function add(data, plant) {
    const p = { id: nextId(), ...plant };
    data.plants = data.plants || [];
    data.plants.push(p);
    return Storage.write(data).then(() => p);
  }

  function update(data, id, updates) {
    const idx = (data.plants || []).findIndex((p) => p.id === id);
    if (idx === -1) return Promise.resolve(null);
    data.plants[idx] = { ...data.plants[idx], ...updates };
    return Storage.write(data).then(() => data.plants[idx]);
  }

  function remove(data, id) {
    data.plants = (data.plants || []).filter((p) => p.id !== id);
    return Storage.write(data);
  }

  function getById(plants, id) {
    return (plants || []).find((p) => p.id === id) || null;
  }

  window.GardenCyclePlants = {
    load,
    add,
    update,
    remove,
    getById,
    CATEGORIES,
    SAISONS
  };
})();
