const STORAGE_KEY = 'gardencycle-plants';

function loadPlants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePlants(plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

function computeHarvestDate(plantDateStr, growthDays) {
  const d = new Date(plantDateStr);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + Number(growthDays));
  return d.toISOString().slice(0, 10);
}

function formatDate(isoStr) {
  if (!isoStr) return '–';
  const d = new Date(isoStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

let plants = loadPlants();
let sortBy = 'plantDate';
let sortAsc = true;

const tbody = document.getElementById('plant-tbody');
const emptyMessage = document.getElementById('empty-message');
const form = document.getElementById('plant-form');
const sortPlantDate = document.getElementById('sort-plant-date');
const sortHarvestDate = document.getElementById('sort-harvest-date');

function renderRow(plant, index) {
  const tr = document.createElement('tr');
  const harvestDate = computeHarvestDate(plant.plantDate, plant.growthDays);
  tr.innerHTML =
    '<td>' + escapeHtml(plant.name) + '</td>' +
    '<td>' + formatDate(plant.plantDate) + '</td>' +
    '<td>' + escapeHtml(String(plant.growthDays)) + '</td>' +
    '<td>' + formatDate(harvestDate) + '</td>' +
    '<td><button type="button" class="btn-delete" data-index="' + index + '">Löschen</button></td>';
  tr.querySelector('.btn-delete').addEventListener('click', () => deletePlant(index));
  return tr;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getSortedPlants() {
  const list = plants.slice();
  list.sort((a, b) => {
    let va, vb;
    if (sortBy === 'plantDate') {
      va = a.plantDate || '';
      vb = b.plantDate || '';
    } else {
      va = computeHarvestDate(a.plantDate, a.growthDays) || '';
      vb = computeHarvestDate(b.plantDate, b.growthDays) || '';
    }
    const cmp = va.localeCompare(vb);
    return sortAsc ? cmp : -cmp;
  });
  return list;
}

function renderTable() {
  tbody.innerHTML = '';
  const sorted = getSortedPlants();
  sorted.forEach((plant, i) => {
    const originalIndex = plants.indexOf(plant);
    tbody.appendChild(renderRow(plant, originalIndex));
  });
  emptyMessage.classList.toggle('hidden', plants.length > 0);
}

function deletePlant(index) {
  plants.splice(index, 1);
  savePlants(plants);
  renderTable();
}

function setSort(field) {
  if (sortBy === field) sortAsc = !sortAsc;
  else { sortBy = field; sortAsc = true; }
  renderTable();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('plant-name').value.trim();
  const plantDate = document.getElementById('plant-date').value;
  const growthDays = parseInt(document.getElementById('growth-days').value, 10);
  if (!name || !plantDate || !growthDays || growthDays < 1) return;
  plants.push({ name, plantDate, growthDays });
  savePlants(plants);
  document.getElementById('plant-name').value = '';
  document.getElementById('plant-date').value = '';
  document.getElementById('growth-days').value = '';
  renderTable();
});

sortPlantDate.addEventListener('click', () => setSort('plantDate'));
sortHarvestDate.addEventListener('click', () => setSort('harvestDate'));

renderTable();
