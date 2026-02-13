(function () {
  'use strict';

  const Storage = window.GardenCycleStorage;
  const Plants = window.GardenCyclePlants;
  const Beds = window.GardenCycleBeds;
  const Planner = window.GardenCyclePlanner;
  const Calendar = window.GardenCycleCalendar;

  let state = { data: null, plants: [], beds: [] };

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
    document.querySelectorAll('.nav-list a').forEach((a) => a.classList.remove('active'));
    const view = document.getElementById('view-' + name);
    const link = document.querySelector('.nav-list a[data-view="' + name + '"]');
    if (view) view.classList.remove('hidden');
    if (link) link.classList.add('active');
    if (state.data) renderView(name);
  }

  function loadData() {
    return Storage.read().then((data) => {
      state.data = data || { plants: [], beds: [], planEntries: [], bedHistory: [] };
      return Plants.load(state.data).then((plants) => {
        state.plants = plants;
        return Beds.load(state.data).then((beds) => {
          state.beds = beds;
          return state;
        });
      });
    });
  }

  function renderView(name) {
    if (name === 'dashboard') renderDashboard();
    else if (name === 'pflanzen') renderPlants();
    else if (name === 'beete') renderBeds();
    else if (name === 'saisonplanung') renderPlanner();
    else if (name === 'kalender') renderCalendar();
  }

  function renderDashboard() {
    const el = document.getElementById('view-dashboard');
    const entries = state.data.planEntries || [];
    const plants = state.plants;
    const beds = state.beds;
    const today = new Date().toISOString().slice(0, 10);
    const active = entries.filter((e) => {
      const p = plants.find((x) => x.id === e.plantId);
      if (!p) return false;
      const d = Planner.computeDates(e, p);
      return d.ernteende && d.ernteende >= today && (d.erntestart || '').localeCompare(today) <= 0;
    });
    const nextHarvest = [];
    entries.forEach((e) => {
      const p = plants.find((x) => x.id === e.plantId);
      if (!p) return;
      const d = Planner.computeDates(e, p);
      if (d.erntestart && d.erntestart >= today) nextHarvest.push({ date: d.erntestart, name: p.name, bed: (beds.find((b) => b.id === e.bedId) || {}).name });
    });
    nextHarvest.sort((a, b) => a.date.localeCompare(b.date));
    const bedIdsUsed = new Set(entries.map((e) => e.bedId));
    const freeBeds = beds.filter((b) => !bedIdsUsed.has(b.id));
    el.innerHTML =
      '<div class="card"><h2>Dashboard</h2></div>' +
      '<div class="dashboard-grid">' +
      '<div class="dashboard-card"><h3>Aktive Pflanzen</h3><ul id="dash-active"></ul></div>' +
      '<div class="dashboard-card"><h3>Nächste Ernte</h3><ul id="dash-harvest"></ul></div>' +
      '<div class="dashboard-card"><h3>Freie Beete</h3><ul id="dash-free"></ul></div>' +
      '</div>';
    const ulActive = document.getElementById('dash-active');
    const ulHarvest = document.getElementById('dash-harvest');
    const ulFree = document.getElementById('dash-free');
    active.forEach((e) => {
      const p = plants.find((x) => x.id === e.plantId);
      const b = beds.find((x) => x.id === e.bedId);
      const li = document.createElement('li');
      li.textContent = (p && p.name) + ' – ' + (b && b.name);
      ulActive.appendChild(li);
    });
    if (active.length === 0) { const li = document.createElement('li'); li.textContent = 'Keine aktiven Kulturen.'; li.classList.add('empty-msg'); ulActive.appendChild(li); }
    nextHarvest.slice(0, 10).forEach((h) => {
      const li = document.createElement('li');
      li.textContent = Calendar.formatDateDE(h.date) + ': ' + h.name + (h.bed ? ' (' + h.bed + ')' : '');
      ulHarvest.appendChild(li);
    });
    if (nextHarvest.length === 0) { const li = document.createElement('li'); li.textContent = 'Keine anstehenden Ernten.'; li.classList.add('empty-msg'); ulHarvest.appendChild(li); }
    freeBeds.forEach((b) => { const li = document.createElement('li'); li.textContent = b.name + ' (' + Beds.areaM2(b) + ' m²)'; ulFree.appendChild(li); });
    if (freeBeds.length === 0) { const li = document.createElement('li'); li.textContent = 'Keine freien Beete.'; li.classList.add('empty-msg'); ulFree.appendChild(li); }
  }

  function renderPlants() {
    const el = document.getElementById('view-pflanzen');
    const list = state.plants;
    el.innerHTML =
      '<div class="card"><h2>Pflanzendatenbank</h2>' +
      '<form id="form-plant"><div class="form-row"><label>Name *</label><input type="text" id="plant-name" required></div>' +
      '<div class="form-row"><label>Kategorie</label><select id="plant-category">' + (Plants.CATEGORIES.map((c) => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('')) + '</select></div>' +
      '<div class="form-row"><label>Vorkultur</label><select id="plant-vorkultur"><option value="false">Nein</option><option value="true">Ja</option></select></div>' +
      '<div class="form-row"><label>Keimdauer (Tage)</label><input type="number" id="plant-keimdauer" min="0" value="0"></div>' +
      '<div class="form-row"><label>Wachstumsdauer (Tage)</label><input type="number" id="plant-wachstumsdauer" min="1" value="60"></div>' +
      '<div class="form-row"><label>Abstand Pflanze (cm)</label><input type="number" id="plant-abstandPflanze" min="0" value="30"></div>' +
      '<div class="form-row"><label>Abstand Reihe (cm)</label><input type="number" id="plant-abstandReihe" min="0" value="40"></div>' +
      '<div class="form-row"><label>Erntezeitraum (Tage)</label><input type="number" id="plant-erntezeitraum" min="0" value="14"></div>' +
      '<div class="form-row"><label>Saison</label><select id="plant-saison">' + (Plants.SAISONS.map((s) => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join('')) + '</select></div>' +
      '<div class="form-row"><label>Familie (Fruchtfolge)</label><input type="text" id="plant-family" placeholder="z. B. Nachtschatten"></div>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Hinzufügen</button></div><p id="plant-form-error" class="form-error hidden"></p></form></div>' +
      '<div class="card"><h2>Alle Pflanzen</h2><table><thead><tr><th>Name</th><th>Kategorie</th><th>Vorkultur</th><th>Keimdauer</th><th>Wachstum</th><th></th></tr></thead><tbody id="plants-tbody"></tbody></table><p id="plants-empty" class="empty-msg"></p></div>';
    const tbody = document.getElementById('plants-tbody');
    list.forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(p.name) + '</td><td>' + esc(p.category) + '</td><td>' + (p.vorkultur ? 'Ja' : 'Nein') + '</td><td>' + (p.keimdauer || 0) + '</td><td>' + (p.wachstumsdauer || 0) + '</td><td><button type="button" class="btn btn-danger btn-small edit-plant" data-id="' + esc(p.id) + '">Bearbeiten</button> <button type="button" class="btn btn-danger btn-small del-plant" data-id="' + esc(p.id) + '">Löschen</button></td>';
      tbody.appendChild(tr);
    });
    document.getElementById('plants-empty').textContent = list.length === 0 ? 'Noch keine Pflanzen.' : '';
    document.getElementById('form-plant').onsubmit = (ev) => {
      ev.preventDefault();
      const errEl = document.getElementById('plant-form-error');
      const name = document.getElementById('plant-name').value.trim();
      if (!name) { errEl.textContent = 'Name ist Pflicht.'; errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');
      const plant = {
        name,
        category: document.getElementById('plant-category').value,
        vorkultur: document.getElementById('plant-vorkultur').value === 'true',
        keimdauer: parseInt(document.getElementById('plant-keimdauer').value, 10) || 0,
        wachstumsdauer: parseInt(document.getElementById('plant-wachstumsdauer').value, 10) || 60,
        abstandPflanze: parseInt(document.getElementById('plant-abstandPflanze').value, 10) || 0,
        abstandReihe: parseInt(document.getElementById('plant-abstandReihe').value, 10) || 0,
        erntezeitraum: parseInt(document.getElementById('plant-erntezeitraum').value, 10) || 0,
        saison: document.getElementById('plant-saison').value,
        family: document.getElementById('plant-family').value.trim() || undefined
      };
      Plants.add(state.data, plant).then(() => loadData().then(() => { renderPlants(); document.getElementById('plant-name').value = ''; }));
    };
    el.querySelectorAll('.del-plant').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Pflanze wirklich löschen?')) return;
        Plants.remove(state.data, btn.dataset.id).then(() => loadData().then(() => renderPlants()));
      });
    });
    el.querySelectorAll('.edit-plant').forEach((btn) => {
      btn.addEventListener('click', () => openPlantEdit(btn.dataset.id));
    });
  }

  function openPlantEdit(id) {
    const p = Plants.getById(state.plants, id);
    if (!p) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal"><h2>Pflanze bearbeiten</h2><form id="modal-plant-form">' +
      '<div class="form-row"><label>Name *</label><input type="text" id="m-plant-name" value="' + esc(p.name) + '" required></div>' +
      '<div class="form-row"><label>Kategorie</label><select id="m-plant-category">' + Plants.CATEGORIES.map((c) => '<option value="' + esc(c) + '"' + (c === p.category ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></div>' +
      '<div class="form-row"><label>Vorkultur</label><select id="m-plant-vorkultur"><option value="false"' + (!p.vorkultur ? ' selected' : '') + '>Nein</option><option value="true"' + (p.vorkultur ? ' selected' : '') + '>Ja</option></select></div>' +
      '<div class="form-row"><label>Keimdauer (Tage)</label><input type="number" id="m-plant-keimdauer" min="0" value="' + (p.keimdauer || 0) + '"></div>' +
      '<div class="form-row"><label>Wachstumsdauer (Tage)</label><input type="number" id="m-plant-wachstumsdauer" min="1" value="' + (p.wachstumsdauer || 60) + '"></div>' +
      '<div class="form-row"><label>Abstand Pflanze (cm)</label><input type="number" id="m-plant-abstandPflanze" min="0" value="' + (p.abstandPflanze || 0) + '"></div>' +
      '<div class="form-row"><label>Abstand Reihe (cm)</label><input type="number" id="m-plant-abstandReihe" min="0" value="' + (p.abstandReihe || 0) + '"></div>' +
      '<div class="form-row"><label>Erntezeitraum (Tage)</label><input type="number" id="m-plant-erntezeitraum" min="0" value="' + (p.erntezeitraum || 0) + '"></div>' +
      '<div class="form-row"><label>Saison</label><select id="m-plant-saison">' + Plants.SAISONS.map((s) => '<option value="' + esc(s) + '"' + (s === (p.saison || '') ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></div>' +
      '<div class="form-row"><label>Familie</label><input type="text" id="m-plant-family" value="' + esc(p.family || '') + '"></div>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Speichern</button> <button type="button" class="btn btn-cancel">Abbrechen</button></div></form></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector('form').onsubmit = (ev) => {
      ev.preventDefault();
      const name = document.getElementById('m-plant-name').value.trim();
      if (!name) return;
      Plants.update(state.data, id, {
        name,
        category: document.getElementById('m-plant-category').value,
        vorkultur: document.getElementById('m-plant-vorkultur').value === 'true',
        keimdauer: parseInt(document.getElementById('m-plant-keimdauer').value, 10) || 0,
        wachstumsdauer: parseInt(document.getElementById('m-plant-wachstumsdauer').value, 10) || 60,
        abstandPflanze: parseInt(document.getElementById('m-plant-abstandPflanze').value, 10) || 0,
        abstandReihe: parseInt(document.getElementById('m-plant-abstandReihe').value, 10) || 0,
        erntezeitraum: parseInt(document.getElementById('m-plant-erntezeitraum').value, 10) || 0,
        saison: document.getElementById('m-plant-saison').value,
        family: document.getElementById('m-plant-family').value.trim() || undefined
      }).then(() => loadData().then(() => { overlay.remove(); renderPlants(); }));
    };
  }

  function renderBeds() {
    const el = document.getElementById('view-beete');
    const list = state.beds;
    el.innerHTML =
      '<div class="card"><h2>Beet- und Flächenverwaltung</h2>' +
      '<form id="form-bed"><div class="form-row"><label>Name *</label><input type="text" id="bed-name" required></div>' +
      '<div class="form-row"><label>Länge (m)</label><input type="number" id="bed-length" min="0.1" step="0.1" value="2"></div>' +
      '<div class="form-row"><label>Breite (m)</label><input type="number" id="bed-width" min="0.1" step="0.1" value="1.2"></div>' +
      '<div class="form-row"><label>Typ</label><select id="bed-type">' + Beds.BED_TYPES.map((t) => '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('') + '</select></div>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Beet anlegen</button></div><p id="bed-form-error" class="form-error hidden"></p></form></div>' +
      '<div class="card"><h2>Alle Beete</h2><table><thead><tr><th>Name</th><th>Typ</th><th>Fläche (m²)</th><th>Belegt (m²)</th><th></th></tr></thead><tbody id="beds-tbody"></tbody></table><p id="beds-empty" class="empty-msg"></p></div>';
    const tbody = document.getElementById('beds-tbody');
    list.forEach((b) => {
      const total = Beds.areaM2(b);
      const occ = Beds.occupiedArea(b.id, state.data.planEntries, state.plants);
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(b.name) + '</td><td>' + esc(b.type) + '</td><td>' + total.toFixed(1) + '</td><td>' + occ.toFixed(1) + '</td><td><button type="button" class="btn btn-danger btn-small edit-bed" data-id="' + esc(b.id) + '">Bearbeiten</button> <button type="button" class="btn btn-danger btn-small del-bed" data-id="' + esc(b.id) + '">Löschen</button></td>';
      tbody.appendChild(tr);
    });
    document.getElementById('beds-empty').textContent = list.length === 0 ? 'Noch keine Beete.' : '';
    document.getElementById('form-bed').onsubmit = (ev) => {
      ev.preventDefault();
      const errEl = document.getElementById('bed-form-error');
      const name = document.getElementById('bed-name').value.trim();
      if (!name) { errEl.textContent = 'Name ist Pflicht.'; errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');
      Beds.add(state.data, {
        name,
        length: parseFloat(document.getElementById('bed-length').value) || 0,
        width: parseFloat(document.getElementById('bed-width').value) || 0,
        type: document.getElementById('bed-type').value
      }).then(() => loadData().then(() => { renderBeds(); document.getElementById('bed-name').value = ''; }));
    };
    el.querySelectorAll('.del-bed').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Beet wirklich löschen? Planungen für dieses Beet entfallen.')) return;
        Beds.remove(state.data, btn.dataset.id).then(() => loadData().then(() => renderBeds()));
      });
    });
    el.querySelectorAll('.edit-bed').forEach((btn) => {
      btn.addEventListener('click', () => openBedEdit(btn.dataset.id));
    });
  }

  function openBedEdit(id) {
    const b = state.beds.find((x) => x.id === id);
    if (!b) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal"><h2>Beet bearbeiten</h2><form id="modal-bed-form">' +
      '<div class="form-row"><label>Name *</label><input type="text" id="m-bed-name" value="' + esc(b.name) + '" required></div>' +
      '<div class="form-row"><label>Länge (m)</label><input type="number" id="m-bed-length" min="0.1" step="0.1" value="' + (b.length || 0) + '"></div>' +
      '<div class="form-row"><label>Breite (m)</label><input type="number" id="m-bed-width" min="0.1" step="0.1" value="' + (b.width || 0) + '"></div>' +
      '<div class="form-row"><label>Typ</label><select id="m-bed-type">' + Beds.BED_TYPES.map((t) => '<option value="' + esc(t) + '"' + (t === b.type ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></div>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Speichern</button> <button type="button" class="btn btn-cancel">Abbrechen</button></div></form></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector('form').onsubmit = (ev) => {
      ev.preventDefault();
      Beds.update(state.data, id, {
        name: document.getElementById('m-bed-name').value.trim(),
        length: parseFloat(document.getElementById('m-bed-length').value) || 0,
        width: parseFloat(document.getElementById('m-bed-width').value) || 0,
        type: document.getElementById('m-bed-type').value
      }).then(() => loadData().then(() => { overlay.remove(); renderBeds(); }));
    };
  }

  function renderPlanner() {
    const el = document.getElementById('view-saisonplanung');
    const entries = state.data.planEntries || [];
    el.innerHTML =
      '<div class="card"><h2>Saisonplanung</h2><form id="form-plan">' +
      '<div class="form-row"><label>Pflanze *</label><select id="plan-plant">' + state.plants.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('') + '</select></div>' +
      '<div class="form-row"><label>Beet *</label><select id="plan-bed">' + state.beds.map((b) => '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>').join('') + '</select></div>' +
      '<div class="form-row"><label>Pflanzdatum *</label><input type="date" id="plan-date" required></div>' +
      '<div id="plan-warnings"></div>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Eintrag anlegen</button></div><p id="plan-form-error" class="form-error hidden"></p></form></div>' +
      '<div class="card"><h2>Planungseinträge</h2><table><thead><tr><th>Pflanze</th><th>Beet</th><th>Pflanzdatum</th><th>Keimdatum</th><th>Umpflanzung</th><th>Erntestart</th><th>Ernteende</th><th></th></tr></thead><tbody id="plan-tbody"></tbody></table><p id="plan-empty" class="empty-msg"></p></div>';
    const tbody = document.getElementById('plan-tbody');
    entries.forEach((e) => {
      const p = Plants.getById(state.plants, e.plantId);
      const b = state.beds.find((x) => x.id === e.bedId);
      const d = Planner.computeDates(e, p);
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(p && p.name) + '</td><td>' + esc(b && b.name) + '</td><td>' + Calendar.formatDateDE(e.pflanzdatum) + '</td><td>' + Calendar.formatDateDE(d.keimdatum) + '</td><td>' + Calendar.formatDateDE(d.umpflanzdatum) + '</td><td>' + Calendar.formatDateDE(d.erntestart) + '</td><td>' + Calendar.formatDateDE(d.ernteende) + '</td><td><button type="button" class="btn btn-danger btn-small del-plan" data-id="' + esc(e.id) + '">Löschen</button></td>';
      tbody.appendChild(tr);
    });
    document.getElementById('plan-empty').textContent = entries.length === 0 ? 'Noch keine Planungseinträge.' : '';
    document.getElementById('form-plan').onsubmit = (ev) => {
      ev.preventDefault();
      const plantId = document.getElementById('plan-plant').value;
      const bedId = document.getElementById('plan-bed').value;
      const pflanzdatum = document.getElementById('plan-date').value;
      const errEl = document.getElementById('plan-form-error');
      const warnEl = document.getElementById('plan-warnings');
      warnEl.innerHTML = '';
      if (!pflanzdatum) { errEl.textContent = 'Pflanzdatum ist Pflicht.'; errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');
      const draft = { plantId, bedId, pflanzdatum };
      const plant = Plants.getById(state.plants, plantId);
      const warnings = Planner.cropRotationWarnings(draft, state.data, state.plants);
      if (warnings.length > 0) {
        warnings.forEach((w) => {
          const box = document.createElement('div');
          box.className = 'warning-box';
          box.textContent = w;
          warnEl.appendChild(box);
        });
      }
      Planner.add(state.data, draft).then((entry) => {
        if (plant) Planner.recordBedHistory(state.data, bedId, plantId, plant.family);
        return loadData().then(() => { renderPlanner(); document.getElementById('plan-date').value = ''; });
      });
    };
    el.querySelectorAll('.del-plan').forEach((btn) => {
      btn.addEventListener('click', () => {
        Planner.remove(state.data, btn.dataset.id).then(() => loadData().then(() => renderPlanner()));
      });
    });
  }

  function renderCalendar() {
    const el = document.getElementById('view-kalender');
    const events = Calendar.buildEvents(state.data);
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let filter = { plant: '', bed: '', category: '' };
    const filtered = Calendar.filterEvents(events, (filter.plant || filter.bed || filter.category) ? filter : null);
    const plants = [...new Set(events.map((e) => e.plantName))].sort();
    const beds = [...new Set(events.map((e) => e.bedName))].sort();
    const categories = [...new Set(events.map((e) => e.category))].sort();
    el.innerHTML =
      '<div class="card"><h2>Kalenderansicht</h2>' +
      '<div class="calendar-filters">' +
      '<label>Filter Pflanze: <select id="cal-filter-plant"><option value="">— Alle —</option>' + plants.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('') + '</select></label>' +
      '<label>Filter Beet: <select id="cal-filter-bed"><option value="">— Alle —</option>' + beds.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('') + '</select></label>' +
      '<label>Filter Kategorie: <select id="cal-filter-cat"><option value="">— Alle —</option>' + categories.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('') + '</select></label>' +
      '<button type="button" class="btn btn-small" id="cal-prev">← Vorheriger</button> <span id="cal-month-label"></span> <button type="button" class="btn btn-small" id="cal-next">Nächster →</button>' +
      '</div>' +
      '<div id="cal-month-grid" class="calendar-month"></div>' +
      '<h3>Liste (nach Datum)</h3><table><thead><tr><th>Datum</th><th>Ereignis</th><th>Pflanze</th><th>Beet</th></tr></thead><tbody id="cal-list-tbody"></tbody></table></div>';
    function redraw() {
      const list = Calendar.filterEvents(events, (filter.plant || filter.bed || filter.category) ? filter : null);
      document.getElementById('cal-month-label').textContent = year + ' – ' + ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][month - 1];
      const monthEvents = Calendar.eventsForMonth(list, year, month);
      const firstDay = new Date(year, month - 1, 1).getDay();
      const daysInMonth = new Date(year, month, 0).getDate();
      const startOffset = firstDay === 0 ? 6 : firstDay - 1;
      const grid = document.getElementById('cal-month-grid');
      const head = ['Mo','Di','Mi','Do','Fr','Sa','So'].map((h) => '<div class="day-head">' + h + '</div>').join('');
      let cells = '';
      for (let i = 0; i < startOffset; i++) cells += '<div class="day-cell"></div>';
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const dayEv = monthEvents.filter((e) => e.date === dateStr);
        cells += '<div class="day-cell"><div class="date-num">' + d + '</div>' + dayEv.map((e) => '<div class="event">' + esc(e.type) + ' ' + esc(e.plantName) + '</div>').join('') + '</div>';
      }
      grid.innerHTML = head + cells;
      const tbody = document.getElementById('cal-list-tbody');
      tbody.innerHTML = '';
      list.slice(0, 100).forEach((e) => {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + Calendar.formatDateDE(e.date) + '</td><td>' + esc(e.type) + '</td><td>' + esc(e.plantName) + '</td><td>' + esc(e.bedName) + '</td>';
        tbody.appendChild(tr);
      });
    }
    document.getElementById('cal-filter-plant').onchange = () => { filter.plant = document.getElementById('cal-filter-plant').value; redraw(); };
    document.getElementById('cal-filter-bed').onchange = () => { filter.bed = document.getElementById('cal-filter-bed').value; redraw(); };
    document.getElementById('cal-filter-cat').onchange = () => { filter.category = document.getElementById('cal-filter-cat').value; redraw(); };
    document.getElementById('cal-prev').onclick = () => { month--; if (month < 1) { month = 12; year--; } redraw(); };
    document.getElementById('cal-next').onclick = () => { month++; if (month > 12) { month = 1; year++; } redraw(); };
    redraw();
  }

  function exportCSV() {
    const events = Calendar.buildEvents(state.data);
    const headers = 'Datum;Ereignis;Pflanze;Beet;Kategorie';
    const rows = events.map((e) => [e.date, e.type, e.plantName, e.bedName, e.category].map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';'));
    const csv = '\uFEFF' + headers + '\n' + rows.join('\n');
    Storage.saveFile(csv, 'gardencycle-export.csv').then((r) => { if (r.ok) alert('Gespeichert: ' + r.path); else if (!r.ok) alert('Speichern fehlgeschlagen.'); });
  }

  function exportPDF() {
    if (typeof window.jspdf === 'undefined') {
      alert('PDF-Export: jspdf nicht geladen. Bitte CSV nutzen oder App neu starten.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const events = Calendar.buildEvents(state.data);
    doc.setFontSize(14);
    doc.text('GardenCycle Pro – Saisonübersicht', 14, 20);
    doc.setFontSize(10);
    let y = 28;
    events.slice(0, 80).forEach((e) => {
      doc.text(e.date + '  ' + e.type + '  ' + e.plantName + '  ' + e.bedName, 14, y);
      y += 6;
    });
    const out = doc.output('datauristring');
    Storage.saveFile(out, 'gardencycle-export.pdf').then((r) => { if (r.ok) alert('Gespeichert: ' + r.path); else alert('Speichern fehlgeschlagen.'); });
  }

  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);

  document.querySelectorAll('.nav-list a[data-view]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); showView(a.dataset.view); });
  });
  window.addEventListener('hashchange', () => {
    const view = (location.hash || '#dashboard').slice(1) || 'dashboard';
    if (['dashboard','pflanzen','beete','saisonplanung','kalender'].indexOf(view) >= 0) showView(view);
  });

  loadData().then(() => {
    const view = (location.hash || '#dashboard').slice(1) || 'dashboard';
    showView(view || 'dashboard');
  });
})();
