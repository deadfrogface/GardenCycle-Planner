(function () {
  'use strict';

  const API = typeof window !== 'undefined' && window.gardenCycleAPI;

  function read() {
    if (!API || !API.storageRead) return Promise.resolve({ plants: [], beds: [], planEntries: [], bedHistory: [] });
    return API.storageRead();
  }

  function write(data) {
    if (!API || !API.storageWrite) return Promise.resolve(false);
    return API.storageWrite(data);
  }

  function saveFile(content, defaultName) {
    if (!API || !API.exportSaveFile) return Promise.resolve({ ok: false });
    return API.exportSaveFile(content, defaultName);
  }

  function getDefaultPlantsJson() {
    if (!API || !API.getDefaultPlantsJson) return Promise.resolve('[]');
    return API.getDefaultPlantsJson();
  }

  window.GardenCycleStorage = { read, write, saveFile, getDefaultPlantsJson };
})();
