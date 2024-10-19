import { useRef, useEffect } from 'react'
import type { FrameInfo } from './addon'
import EventEmitter from 'events'

type FrameFormat = "RGB" | "BGR"
const ipcRenderer = window.electron.ipcRenderer

const setCanvas = (canvas: HTMLCanvasElement, frame: FrameInfo): void => {
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }
  const ctx = canvas.getContext("2d")
  const img = new ImageData(Uint8ClampedArray.from(frame.data), frame.width, frame.height)
  ctx?.putImageData(img, 0, 0)
}

function App(): JSX.Element {
  const canvas0Ref = useRef<HTMLCanvasElement>(null)
  const canvas1Ref = useRef<HTMLCanvasElement>(null)
  const ch0 = "frame0"
  const ch1 = "frame1"
  useEffect(() => {
    ipcRenderer.on(ch0, (event, frame: FrameInfo) => {
      setCanvas(canvas0Ref.current!, frame)
    })
    ipcRenderer.on(ch1, (event, frame: FrameInfo) => {
      setCanvas(canvas1Ref.current!, frame)
    })
    return () => {
      ipcRenderer.removeAllListeners(ch0)
      ipcRenderer.removeAllListeners(ch1)
    }
  })
  return (
    <>
      <canvas ref={canvas0Ref} width="640" height="480" style={{ "maxWidth": "80%" }}></canvas>
      <canvas ref={canvas1Ref} width="640" height="480" style={{ "maxWidth": "80%" }}></canvas>
    </>
  )
}

export default App
