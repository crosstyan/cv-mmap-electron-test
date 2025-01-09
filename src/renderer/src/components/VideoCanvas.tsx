import type { FrameInfo } from '../addon'
import { useEffect, useRef } from 'react'

const DEFAULT_VIDEO_CHANNEL_PREFIX = "video_ch_"
const ipcRenderer = window.electron.ipcRenderer

const videoEventName = (label: number | string): string => {
  return `${DEFAULT_VIDEO_CHANNEL_PREFIX}${label}`
}

const setCanvas = (canvas: HTMLCanvasElement, frame: FrameInfo): void => {
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width
    canvas.height = frame.height
  }
  const ctx = canvas.getContext("2d")
  const img = new ImageData(Uint8ClampedArray.from(frame.data), frame.width, frame.height)
  ctx?.putImageData(img, 0, 0)
}

const VideoCanvas = (props: { channel: string, style?: React.CSSProperties }): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    ipcRenderer.on(props.channel, (event, frame: FrameInfo) => {
      setCanvas(canvasRef.current!, frame)
    })
    return (): void => {
      ipcRenderer.removeAllListeners(props.channel)
    }
  })
  return (
    <>
      <canvas ref={canvasRef} width="640" height="480" style={props.style}></canvas>
    </>
  )
}

export { VideoCanvas, videoEventName }
export default VideoCanvas

