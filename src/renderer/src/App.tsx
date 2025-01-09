import VideoCanvas from './components/VideoCanvas'
import { videoEventName } from './components/VideoCanvas'

function App(): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <VideoCanvas channel={videoEventName("local")} style={{ width: "80%" }} />
      </div>
    </div>
  )
}

export default App
