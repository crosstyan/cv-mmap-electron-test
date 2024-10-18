import { useRef, useEffect } from 'react'
import type { FrameInfo } from './addon'
import EventEmitter from 'events'

const ipcRenderer = window.electron.ipcRenderer
type FrameFormat = "RGB" | "BGR"
const frameFormat: FrameFormat = "BGR"

let tmpFrameInfo: FrameInfo | null = null
let tmpFrameBuf: Uint8Array | null = null

const setCanvas = (canvas: HTMLCanvasElement, frame: FrameInfo): void => {
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }
  const ctx = canvas.getContext("2d")
  tmpFrameBuf = new Uint8Array(frame.data.buffer)
  const img = new ImageData(frame.width, frame.height)
  for (let i = 0, j = 0; i < tmpFrameBuf.length; i += 3, j += 4) {
    if (frameFormat === "BGR") {
      img.data[j] = tmpFrameBuf[i + 2]
      img.data[j + 1] = tmpFrameBuf[i + 1]
      img.data[j + 2] = tmpFrameBuf[i]
    } else if (frameFormat === "RGB") {
      img.data[j] = tmpFrameBuf[i]
      img.data[j + 1] = tmpFrameBuf[i + 1]
      img.data[j + 2] = tmpFrameBuf[i + 2]
    } else {
      throw new Error("Unsupported frame format")
    }
    // image data is always 4 bytes per pixel (the last byte is alpha channel, set to 255 for opaque image)
    img.data[j + 3] = 255
  }
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
