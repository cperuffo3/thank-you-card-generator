import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./constants";

window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [serverPort]);
  }
});

// Expose file open handler to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  onOpenCardFile: (callback: (filePath: string) => void) => {
    ipcRenderer.on("open-card-file", (_event, filePath: string) => {
      callback(filePath);
    });
  },
  removeOpenCardFileListener: () => {
    ipcRenderer.removeAllListeners("open-card-file");
  },
  // Close confirmation handler
  onCloseConfirmed: (callback: (action: "save") => void) => {
    ipcRenderer.on(IPC_CHANNELS.CLOSE_CONFIRMED, (_event, action: "save") => {
      callback(action);
    });
  },
  removeCloseListeners: () => {
    ipcRenderer.removeAllListeners(IPC_CHANNELS.CLOSE_CONFIRMED);
  },
});
