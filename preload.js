const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    selectGGUFFile: () => ipcRenderer.invoke('select-gguf-file'),
    readGGUFFile: (filePath) => ipcRenderer.invoke('read-gguf-file', filePath),
    saveFile: (options) => ipcRenderer.invoke('save-file', options),
    openFile: (filters) => ipcRenderer.invoke('open-file', filters),
    
    // Model management
    scanModelsFolder: () => ipcRenderer.invoke('scan-models-folder'),
    openModelsFolder: () => ipcRenderer.invoke('open-models-folder'),
    
    // GGUF Model operations
    loadModel: (modelPath, options) => ipcRenderer.invoke('load-model', modelPath, options),
    unloadModel: () => ipcRenderer.invoke('unload-model'),
    generateText: (prompt, options) => ipcRenderer.invoke('generate-text', prompt, options),
    isModelLoaded: () => ipcRenderer.invoke('is-model-loaded'),
    
    // Listen for streaming generation progress
    onGenerationProgress: (callback) => {
        ipcRenderer.on('generation-progress', (event, token) => callback(token));
    },
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    
    // Check if running in Electron
    isElectron: true
});
