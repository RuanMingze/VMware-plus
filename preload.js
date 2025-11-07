const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露受保护的方法，允许渲染进程使用ipcRenderer而不暴露整个对象
contextBridge.exposeInMainWorld('electronAPI', {
  browseDirectory: () => ipcRenderer.invoke('browse-directory'),
  findVmxFiles: (directory) => ipcRenderer.invoke('find-vmx-files', directory),
  modifyVmxFiles: (options) => ipcRenderer.invoke('modify-vmx-files', options),
  selectBackgroundImage: () => ipcRenderer.invoke('select-background-image'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window')
});

// 添加事件监听器
contextBridge.exposeInMainWorld('electronEvents', {
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// 添加安全日志功能
contextBridge.exposeInMainWorld('api', {
  log: (...args) => console.log('[Renderer]', ...args)
});