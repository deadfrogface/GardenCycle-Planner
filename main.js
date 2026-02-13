const { app, BrowserWindow, ipcMain: ipc, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = 'gardencycle-data.json';

function getDataPath() {
  return path.join(app.getPath('userData'), DATA_FILE);
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev
    },
    show: false
  });

  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());
}

ipc.handle('storage:read', () => {
  try {
    const p = getDataPath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return { plants: [], beds: [], planEntries: [], bedHistory: [] };
});

ipc.handle('storage:write', (_event, data) => {
  try {
    const p = getDataPath();
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
});

ipc.handle('data:defaultPlants', () => {
  try {
    const p = path.join(__dirname, 'data', 'defaultPlants.json');
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  } catch (e) {}
  return '[]';
});

ipc.handle('export:saveFile', async (_event, content, defaultName) => {
  const win = BrowserWindow.getFocusedWindow();
  const ext = defaultName.endsWith('.pdf') ? 'pdf' : 'csv';
  const { filePath } = await dialog.showSaveDialog(win || BrowserWindow.getAllWindows()[0], {
    defaultPath: defaultName,
    filters: ext === 'pdf' ? [{ name: 'PDF', extensions: ['pdf'] }] : [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (!filePath) return { ok: false };
  try {
    const data = ext === 'pdf' && typeof content === 'string' && content.startsWith('data:') ? Buffer.from(content.split(',')[1], 'base64') : content;
    fs.writeFileSync(filePath, data, ext === 'pdf' ? undefined : 'utf8');
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
