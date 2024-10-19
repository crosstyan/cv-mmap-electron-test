import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { FrameReceiver as NativeFrameReceiver, FrameInfo } from './addon'
import addon from "@resources/addon.node"
import EventEmitter from 'events'

interface OnFrameSetEvent {
  index: number
}

const FrameSetEmitter = new EventEmitter()
let tmpFrame: FrameInfo | null = null

const SHM_NAME_LEFT = "/fl"
const ZMQ_ADDR_LEFT = "ipc:///tmp/fl"
const SHM_NAME_RIGHT = "/fr"
const ZMQ_ADDR_RIGHT = "ipc:///tmp/fr"
const frameReceivers: NativeFrameReceiver[] = []

function setupFrameReceiver(cb: (index: number, frames: FrameInfo) => void): void {
  if (frameReceivers.length > 0) {
    return
  }
  frameReceivers.push(new addon.FrameReceiver(SHM_NAME_LEFT, ZMQ_ADDR_LEFT))
  frameReceivers.push(new addon.FrameReceiver(SHM_NAME_RIGHT, ZMQ_ADDR_RIGHT))
  for (const [idx, frameReceiver] of frameReceivers.entries()) {
    const inner = (frame: FrameInfo): void => {
      cb(idx, frame)
    }
    frameReceiver.setOnFrame(inner)
    frameReceiver.start()
  }
}

function cleanupFrameReceiver(): void {
  for (const frameReceiver of frameReceivers) {
    frameReceiver.setOnFrame(() => { })
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

  const mainWindow = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  setupFrameReceiver((idx, frame) => {
    tmpFrame = frame
    FrameSetEmitter.emit('frame', { index: idx })
  })
  FrameSetEmitter.on('frame', (event: OnFrameSetEvent) => {
    mainWindow.webContents.send(`frame${event.index}`, tmpFrame)
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
