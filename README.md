# GardenCycle Pro

Professioneller Windows-Desktop-Planer für Garten und Anbau: Saisonplanung, Beete, Pflanzendatenbank, Kalender und Fruchtfolge – vollständig offline, Daten in AppData als JSON.

## Anforderungen

- Node.js (z. B. LTS)
- Windows 10/11 (Zielplattform)

## Entwicklung

```bash
npm install
npm start
```

## Build (NSIS-Installer)

```bash
npm run build
```

Die **Setup.exe** liegt im Ordner `dist/`. Die App startet ohne Developer-Konsole.

## Funktionen

- **Pflanzendatenbank:** Name, Kategorie, Vorkultur, Keim-/Wachstumsdauer, Abstände, Erntezeitraum, Saison; 30 Standard-Pflanzen beim ersten Start
- **Beete:** Name, Länge, Breite, Typ (Freiland, Gewächshaus, Hochbeet); Gesamtfläche und Belegung
- **Saisonplanung:** Pflanze + Beet + Pflanzdatum; automatisch Keimdatum, Umpflanzdatum, Erntestart, Ernteende
- **Kalender:** Monatsansicht und Liste, Filter nach Pflanze/Beet/Kategorie
- **Fruchtfolge:** Warnung bei gleicher Pflanze oder Familie hintereinander im selben Beet
- **Export:** Saison als CSV oder PDF
- **Speicherung:** Eine JSON-Datei im User-AppData-Ordner, automatisch geladen und gespeichert

## Projektstruktur

- `main.js` – Electron Main, Fenster, IPC (Storage, Export)
- `preload.js` – Bridge für Renderer
- `index.html`, `style.css`, `app.js` – UI
- `modules/` – plants, beds, planner, calendar, storage
- `data/defaultPlants.json` – Standard-Pflanzenliste
