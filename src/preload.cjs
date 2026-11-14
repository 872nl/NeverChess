const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('neverChess', {
  login: (mode, values) => ipcRenderer.invoke('auth:login', { mode, values })
});
