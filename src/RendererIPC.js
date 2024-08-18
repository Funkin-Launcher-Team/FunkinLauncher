const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  loadGame: (engineID) => ipcRenderer.send('load-game', engineID),
  downloadEngine: (engineID) => ipcRenderer.send('download-engine', engineID),
  loadMM: (engineID) => ipcRenderer.send('load-mm', engineID),
  removeEngine: (engineID, deleteFiles) => ipcRenderer.send('remove-engine', engineID, deleteFiles),
  openEngineFolder: () => ipcRenderer.send('open-engine-folder'),
  openLogsFolder: () => ipcRenderer.send('open-logs-folder'),
  settings: () => ipcRenderer.send('open-settings'),
  installMod: (url, ed, ft) => ipcRenderer.send('install-mod', url, ed, ft),
  importEngine: (engineID) => ipcRenderer.send('import-engine', engineID),
  reloadLauncher: () => ipcRenderer.send('reload-launcher'),
  reloadSettings: () => ipcRenderer.send('reload-settings'),
  log: (message) => ipcRenderer.send('log', message),
  securityAlert: (setHost, host) => ipcRenderer.send('security-alert', setHost, host),
  closedSettings: () => ipcRenderer.send('closed-settings'),
  removeMod: (mod, engine) => ipcRenderer.send('remove-mod', mod, engine),
})