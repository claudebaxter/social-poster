const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', { key, value }),
  
  // Social media posting
  postContent: ({ text, platforms }) => ipcRenderer.invoke('post:social', { text, platforms }),
  
  // OAuth operations
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  exchangeMetaCode: (code) => ipcRenderer.invoke('exchange-meta-code', code),
  
  // OAuth callback listener
  onMetaOAuthCallback: (callback) => ipcRenderer.on('meta-oauth-callback', callback),
  removeMetaOAuthListener: (callback) => ipcRenderer.removeListener('meta-oauth-callback', callback),
}); 