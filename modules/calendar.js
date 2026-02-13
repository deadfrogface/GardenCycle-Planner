(function () {
  'use strict';

  const Planner = window.GardenCyclePlanner;

  function buildEvents(data) {
    const entries = data.planEntries || [];
    const plants = data.plants || [];
    const out = [];
    entries.forEach((e) => {
      const plant = plants.find((p) => p.id === e.plantId);
      if (!plant) return;
      const dates = Planner.computeDates(e, plant);
      const plantName = plant.name || '';
      const bed = (data.beds || []).find((b) => b.id === e.bedId);
      const bedName = bed ? bed.name : '';
      if (dates.keimdatum) out.push({ type: 'Aussaat', date: dates.keimdatum, plantName, bedName, plantId: plant.id, category: plant.category });
      if (dates.umpflanzdatum) out.push({ type: 'Umpflanzung', date: dates.umpflanzdatum, plantName, bedName, plantId: plant.id, category: plant.category });
      if (dates.erntestart) out.push({ type: 'Erntebeginn', date: dates.erntestart, plantName, bedName, plantId: plant.id, category: plant.category });
      if (dates.ernteende) out.push({ type: 'Ernteende', date: dates.ernteende, plantName, bedName, plantId: plant.id, category: plant.category });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  function filterEvents(events, filter) {
    if (!filter || (!filter.plant && !filter.bed && !filter.category)) return events;
    return events.filter((ev) => {
      if (filter.plant && ev.plantName !== filter.plant) return false;
      if (filter.bed && ev.bedName !== filter.bed) return false;
      if (filter.category && ev.category !== filter.category) return false;
      return true;
    });
  }

  function eventsForMonth(events, year, month) {
    const prefix = year + '-' + String(month).padStart(2, '0');
    return events.filter((e) => e.date.startsWith(prefix));
  }

  function formatDateDE(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  window.GardenCycleCalendar = {
    buildEvents,
    filterEvents,
    eventsForMonth,
    formatDateDE
  };
})();
