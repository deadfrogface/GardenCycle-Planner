(function () {
  'use strict';

  const Storage = window.GardenCycleStorage;

  function nextId() {
    return 'e' + Date.now() + '-' + Math.round(Math.random() * 9999);
  }

  function addDays(isoStr, days) {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function computeDates(entry, plant) {
    if (!plant || !entry.pflanzdatum) return {};
    const pd = entry.pflanzdatum;
    const keim = addDays(pd, plant.keimdauer || 0);
    const vorkultur = plant.vorkultur === true;
    const umpflanz = vorkultur ? addDays(pd, plant.keimdauer || 0) : null;
    const wachstum = Number(plant.wachstumsdauer) || 0;
    const pflanzTag = vorkultur ? (plant.keimdauer || 0) : 0;
    const erntestart = addDays(pd, pflanzTag + wachstum);
    const erntezeit = Number(plant.erntezeitraum) || 0;
    const ernteende = erntestart ? addDays(erntestart, erntezeit) : null;
    return { keimdatum: keim, umpflanzdatum: umpflanz, erntestart, ernteende };
  }

  function add(data, entry) {
    const e = { id: nextId(), plantId: entry.plantId, bedId: entry.bedId, pflanzdatum: entry.pflanzdatum };
    data.planEntries = data.planEntries || [];
    data.planEntries.push(e);
    return Storage.write(data).then(() => e);
  }

  function update(data, id, updates) {
    const idx = (data.planEntries || []).findIndex((e) => e.id === id);
    if (idx === -1) return Promise.resolve(null);
    data.planEntries[idx] = { ...data.planEntries[idx], ...updates };
    return Storage.write(data).then(() => data.planEntries[idx]);
  }

  function remove(data, id) {
    data.planEntries = (data.planEntries || []).filter((e) => e.id !== id);
    return Storage.write(data);
  }

  function recordBedHistory(data, bedId, plantId, plantFamily) {
    data.bedHistory = data.bedHistory || [];
    data.bedHistory.push({ bedId, plantId, family: plantFamily, at: new Date().toISOString().slice(0, 10) });
    return Storage.write(data);
  }

  function getHistoryForBed(bedHistory, bedId) {
    return (bedHistory || []).filter((h) => h.bedId === bedId).sort((a, b) => b.at.localeCompare(a.at));
  }

  function cropRotationWarnings(entry, data, plants) {
    const plant = (plants || []).find((p) => p.id === entry.plantId);
    if (!plant) return [];
    const history = getHistoryForBed(data.bedHistory || [], entry.bedId);
    const samePlant = history.filter((h) => h.plantId === entry.plantId).length;
    const sameFamily = history.filter((h) => h.family && h.family === (plant.family || '')).length;
    const warnings = [];
    if (samePlant >= 1) warnings.push('Gleiche Pflanze mehrfach hintereinander im selben Beet.');
    if (sameFamily >= 2) warnings.push('Gleiche Pflanzenfamilie zu oft hintereinander.');
    return warnings;
  }

  window.GardenCyclePlanner = {
    add,
    update,
    remove,
    computeDates,
    recordBedHistory,
    getHistoryForBed,
    cropRotationWarnings,
    addDays
  };
})();
