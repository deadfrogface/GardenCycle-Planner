# GardenCycle Planner

Windows-Desktop-Programm zur Planung von Pflanz- und Erntezyklen ohne Cloud. Alle Daten werden lokal gespeichert (LocalStorage).

## Anforderungen

- Node.js (z. B. LTS)
- Windows (Zielplattform)

## Entwicklung

```bash
npm install
npm start
```

## Build (NSIS-Installer)

Node.js muss installiert und im PATH verfügbar sein. Dann:

```bash
npm install
npm run build
```

Die **Setup.exe** liegt anschließend im Ordner `dist/` (NSIS-Installer für Windows).

## Funktionen

- Pflanzen anlegen (Name, Pflanzdatum, Wachstumsdauer in Tagen)
- Automatische Berechnung des Erntedatums
- Übersicht aller Pflanzen in einer sortierbaren Tabelle
- Persistente lokale Speicherung, App läuft offline
