const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  loadGame: (engineID) => ipcRenderer.send('load-game', engineID),
  downloadEngine: (engineID) => ipcRenderer.send('download-engine', engineID),
  loadMM: (engineID) => ipcRenderer.send('load-mm', engineID),
  removeEngine: (engineID) => ipcRenderer.send('remove-engine', engineID),
  openEngineFolder: () => ipcRenderer.send('open-engine-folder'),
  openLogsFolder: () => ipcRenderer.send('open-logs-folder'),
  settings: () => ipcRenderer.send('open-settings'),
  installMod: (url, ed) => ipcRenderer.send('install-mod', url, ed),
  importEngine: (engineID) => ipcRenderer.send('import-engine', engineID),
  reloadLauncher: () => ipcRenderer.send('reload-launcher'),
  reloadSettings: () => ipcRenderer.send('reload-settings'),
  log: (message) => ipcRenderer.send('log', message)
})