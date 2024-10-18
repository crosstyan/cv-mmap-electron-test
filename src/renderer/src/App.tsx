import { useRef, useEffect } from 'react'
import type { FrameInfo } from './addon'
import EventEmitter from 'events'

type FrameFormat = "RGB" | "BGR"
const ipcRenderer = window.electron.ipcRenderer
const frameFormat: FrameFormat = "BGR"

let tmpFrameInfo: FrameInfo | null = null

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
  useEffect(() => {
    const emitter: EventEmitter = window.globalFrameEmitter
    emitter.on("frame", (ev: any) => {
      if (ev.index === 0) {
        tmpFrameInfo = window.globalFrameInfo
        setCanvas(canvas0Ref.current!, tmpFrameInfo!)
      } else if (ev.index === 1) {
        tmpFrameInfo = window.globalFrameInfo
        setCanvas(canvas1Ref.current!, tmpFrameInfo!)
      }
    })
    return () => {
      const emitter: EventEmitter = window.globalFrameEmitter
      emitter.removeAllListeners()
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
