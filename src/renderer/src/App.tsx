import { useRef, useEffect } from 'react'
import type { FrameInfo } from './addon'

const ipcRenderer = window.electron.ipcRenderer
type FrameFormat = "RGB" | "BGR"
const frameFormat: FrameFormat = "BGR"

function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    ipcRenderer.on("frame", (event, frame: FrameInfo) => {
      // console.info("frame", frame)
      const canvas = canvasRef.current
      if (canvas) {
        if (canvas.width !== frame.width || canvas.height !== frame.height) {
          canvas.width = frame.width
          canvas.height = frame.height
        }
        const ctx = canvas?.getContext("2d")
        const buf: Uint8Array = frame.data
        const img = new ImageData(frame.width, frame.height)
        for (let i = 0, j = 0; i < buf.length; i += 3, j += 4) {
          if (frameFormat === "BGR") {
            img.data[j] = buf[i + 2]
            img.data[j + 1] = buf[i + 1]
            img.data[j + 2] = buf[i]
          } else if (frameFormat === "RGB") {
            img.data[j] = buf[i]
            img.data[j + 1] = buf[i + 1]
            img.data[j + 2] = buf[i + 2]
          } else {
            throw new Error("Unsupported frame format")
          }
          // image data is always 4 bytes per pixel (the last byte is alpha channel, set to 255 for opaque image)
          img.data[j + 3] = 255
        }
        ctx?.putImageData(img, 0, 0)
      }
    })
    return () => {
      ipcRenderer.removeAllListeners("frame")
    }
  })
  return (
    <>
      <canvas ref={canvasRef} width="640" height="480"></canvas>
    </>
  )
}

export default App
