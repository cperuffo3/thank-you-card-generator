import { app, BrowserWindow, dialog, screen } from "electron";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { ipcMain } from "electron/main";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS } from "./constants";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

const inDevelopment = process.env.NODE_ENV === "development";

// Store the file path to open (for file association)
let filePathToOpen: string | null = null;

// Check for .card file in command line args (Windows file association)
if (process.platform === "win32") {
  const cardFile = process.argv.find((arg) => arg.endsWith(".card"));
  if (cardFile) {
    filePathToOpen = cardFile;
  }
}

// Track if we're force closing (user chose to discard or already saved)
let isForceClosing = false;

function createWindow() {
  const preload = path.join(__dirname, "preload.js");

  // Get the primary display's work area for proper scaling on Retina displays
  const { workAreaSize } = screen.getPrimaryDisplay();

  // Use 80% of the available screen size, capped at reasonable maximums
  const width = Math.min(Math.round(workAreaSize.width * 0.8), 1400);
  const height = Math.min(Math.round(workAreaSize.height * 0.85), 900);

  const mainWindow = new BrowserWindow({
    width,
    height,
    icon: path.join(__dirname, "../images/icon.png"),
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });
  ipcContext.setMainWindow(mainWindow);

  // Handle close event - always show save reminder
  mainWindow.on("close", async (e) => {
    if (isForceClosing) {
      isForceClosing = false;
      return; // Allow close
    }

    // Prevent default close and show confirmation dialog
    e.preventDefault();

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Save", "Don't Save", "Cancel"],
      defaultId: 0,
      cancelId: 2,
      title: "Save Your Work?",
      message: "Do you want to save before closing?",
      detail: "Your work will be lost if you don't save.",
    });

    if (response === 0) {
      // Save - tell renderer to save, then close
      mainWindow.webContents.send(IPC_CHANNELS.CLOSE_CONFIRMED, "save");
    } else if (response === 1) {
      // Don't Save - close without saving
      isForceClosing = true;
      mainWindow.close();
    }
    // Cancel (response === 2) - do nothing, keep window open
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

function checkForUpdates() {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "cperuffo3/thank-you-card-generator",
    },
  });
}

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

// macOS: Handle file open events (when user double-clicks .card file)
app.on("open-file", (event, filePath) => {
  event.preventDefault();

  if (filePath.endsWith(".card")) {
    filePathToOpen = filePath;

    // If app is already running, send to renderer
    const mainWindow = ipcContext.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send("open-card-file", filePath);
    }
  }
});

// Handle second-instance for Windows (when app is already running and user opens a file)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    // Someone tried to run a second instance, focus our window
    const mainWindow = ipcContext.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Check for .card file in command line
      const cardFile = commandLine.find((arg) => arg.endsWith(".card"));
      if (cardFile) {
        mainWindow.webContents.send("open-card-file", cardFile);
      }
    }
  });
}

app
  .whenReady()
  .then(createWindow)
  .then(installExtensions)
  .then(checkForUpdates)
  .then(setupORPC)
  .then(() => {
    // Send file path to open after window is ready (if launched with file)
    if (filePathToOpen) {
      const mainWindow = ipcContext.getMainWindow();
      if (mainWindow) {
        // Wait for renderer to be ready
        mainWindow.webContents.on("did-finish-load", () => {
          mainWindow.webContents.send("open-card-file", filePathToOpen);
        });
      }
    }
  });

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
