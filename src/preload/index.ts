import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { EventEmitter } from 'events'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  window.globalFrameInfo = null
  window.globalFrameEmitter = new EventEmitter()
  const setGlobalFrame = (idx: number, frame) => {
    window.globalFrameInfo = frame
    window.globalFrameEmitter.emit('frame', {
      index: idx,
      width: frame.width,
      height: frame.height,
      channels: frame.channels,
      frame_count: frame.frame_count,
    })
  }
  ipcRenderer.on('frame0', (event, frame) => {
    setGlobalFrame(0, frame)
  })
  ipcRenderer.on('frame1', (event, frame) => {
    setGlobalFrame(1, frame)
  })
}
