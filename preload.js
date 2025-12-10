const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Model management
    loadModel: (modelPath, options) => ipcRenderer.invoke('load-model', modelPath, options),
    unloadModel: () => ipcRenderer.invoke('unload-model'),
    isModelLoaded: () => ipcRenderer.invoke('is-model-loaded'),
    
    // Inference
    generateText: (prompt, options) => ipcRenderer.invoke('generate-text', prompt, options),
    
    // Progress updates
    onGenerationProgress: (callback) => {
        // Remove any existing listeners first to prevent accumulation
        ipcRenderer.removeAllListeners('generation-progress');
        ipcRenderer.on('generation-progress', (event, data) => callback(data));
    },
    
    // File operations
    selectGGUFFile: () => ipcRenderer.invoke('select-gguf-file'),
    readGgufFile: (filePath) => ipcRenderer.invoke('read-gguf-file', filePath),
    openModelsFolder: () => ipcRenderer.invoke('open-models-folder'),
    scanModelsFolder: () => ipcRenderer.invoke('scan-models-folder'),
    saveFile: (options) => ipcRenderer.invoke('save-file', options),
    openFile: (filters) => ipcRenderer.invoke('open-file', filters),
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path')
});
