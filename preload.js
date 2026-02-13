const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gardenCycleAPI', {
  storageRead: () => ipcRenderer.invoke('storage:read'),
  storageWrite: (data) => ipcRenderer.invoke('storage:write', data),
  exportSaveFile: (content, defaultName) => ipcRenderer.invoke('export:saveFile', content, defaultName),
  getDefaultPlantsJson: () => ipcRenderer.invoke('data:defaultPlants')
});
