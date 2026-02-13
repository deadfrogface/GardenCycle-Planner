(function () {
  'use strict';

  const Storage = window.GardenCycleStorage;
  const BED_TYPES = ['Freiland', 'Gewächshaus', 'Hochbeet'];

  function nextId() {
    return 'b' + Date.now() + '-' + Math.round(Math.random() * 9999);
  }

  function areaM2(bed) {
    const l = Number(bed.length) || 0;
    const w = Number(bed.width) || 0;
    return l * w;
  }

  function occupiedArea(bedId, planEntries, plants) {
    let area = 0;
    (planEntries || []).filter((e) => e.bedId === bedId).forEach((e) => {
      const p = (plants || []).find((x) => x.id === e.plantId);
      if (!p) return;
      const ap = (Number(p.abstandPflanze) || 0) / 100;
      const ar = (Number(p.abstandReihe) || 0) / 100;
      if (ap && ar) area += ap * ar;
    });
    return area;
  }

  function load(data) {
    return Promise.resolve((data && data.beds) || []);
  }

  function add(data, bed) {
    const b = { id: nextId(), name: bed.name, length: bed.length, width: bed.width, type: bed.type || BED_TYPES[0] };
    data.beds = data.beds || [];
    data.beds.push(b);
    return Storage.write(data).then(() => b);
  }

  function update(data, id, updates) {
    const idx = (data.beds || []).findIndex((b) => b.id === id);
    if (idx === -1) return Promise.resolve(null);
    data.beds[idx] = { ...data.beds[idx], ...updates };
    return Storage.write(data).then(() => data.beds[idx]);
  }

  function remove(data, id) {
    data.beds = (data.beds || []).filter((b) => b.id !== id);
    data.planEntries = (data.planEntries || []).filter((e) => e.bedId !== id);
    return Storage.write(data);
  }

  window.GardenCycleBeds = {
    load,
    add,
    update,
    remove,
    areaM2,
    occupiedArea,
    BED_TYPES
  };
})();
