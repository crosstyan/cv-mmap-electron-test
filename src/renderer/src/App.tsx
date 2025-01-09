import { videoEventName, VideoCanvas, FrameInfo } from './components/VideoCanvas'
import { useState } from "react"

function App(): JSX.Element {
  const [frameCount, setFrameCount] = useState<number>(0)
  const onFrame = (info: FrameInfo): void => {
    setFrameCount(info.frame_count)
  }
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <VideoCanvas channel={videoEventName("local")} style={{ width: "80%" }} onFrame={onFrame} />
          <h3>Frame Count: {frameCount}</h3>
        </div>
      </div>
    </div>
  )
}

export default App
