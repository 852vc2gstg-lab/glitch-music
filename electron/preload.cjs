const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('novaPlayer', {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  setPresence: (presence) => ipcRenderer.send('presence:update', presence),
  updateAppSettings: (settings) => ipcRenderer.send('settings:update', settings),
  setWindowFullscreen: (nextState) => ipcRenderer.invoke('window:set-fullscreen', nextState),
  getWindowLayoutState: () => ipcRenderer.invoke('window:get-layout-state'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleWindowMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onWindowLayoutState: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, state) => callback(state)
    ipcRenderer.on('window:layout-state', listener)
    return () => ipcRenderer.removeListener('window:layout-state', listener)
  },
  onMediaControl: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, command) => callback(command)
    ipcRenderer.on('media-control', listener)
    return () => ipcRenderer.removeListener('media-control', listener)
  },
  onLibraryDownloadProgress: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, payload) => callback(payload)
    ipcRenderer.on('library:download-progress', listener)
    return () => ipcRenderer.removeListener('library:download-progress', listener)
  },
  exportLibrary: (payload) => ipcRenderer.invoke('library:export', payload),
  downloadRemoteAsset: (payload) => ipcRenderer.invoke('library:download-remote', payload),
  downloadRemoteAssetToLibrary: (payload) => ipcRenderer.invoke('library:download-remote-to-library', payload),
  controlDownload: (payload) => ipcRenderer.invoke('library:control-download', payload),
  getUpdaterState: () => ipcRenderer.invoke('updater:get-state'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdaterEvent: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, payload) => callback(payload)
    ipcRenderer.on('updater:event', listener)
    return () => ipcRenderer.removeListener('updater:event', listener)
  },
})



