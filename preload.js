const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', { key, value }),
  
  // Social media posting
  postContent: ({ text, platforms }) => ipcRenderer.invoke('post:social', { text, platforms }),
}); 