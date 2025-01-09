import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import FrameReceiver from './frame_receiver'
import icon from '../../resources/icon.png?asset'


const VIDEO_CHANNEL_PREFIX = "video_ch_"
const SHM_NAME = "/tmp_vid"
const ZMQ_ADDR = "ipc:///tmp/tmp_vid"
const frameReceivers: FrameReceiver[] = []

function setupFrameReceiver(): void {
  const frameReceiver = new FrameReceiver("local", SHM_NAME, ZMQ_ADDR)
  frameReceiver.start()
  frameReceivers.push(frameReceiver)
}

function cleanupFrameReceiver(): void {
  for (const frameReceiver of frameReceivers) {
    frameReceiver.stop()
  }
  frameReceivers.length = 0
}

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.webContents.reload()

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) { createWindow() }
  })

  setupFrameReceiver()
  const mainWindow = createWindow()
  FrameReceiver.emitter.on("update", (event) => {
    mainWindow.webContents.send(`${VIDEO_CHANNEL_PREFIX}${event.label}`, FrameReceiver.buffer)
  })
  mainWindow.on("closed", () => {
    FrameReceiver.emitter.removeAllListeners("update")
  })
  app.on("before-quit", cleanupFrameReceiver)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
