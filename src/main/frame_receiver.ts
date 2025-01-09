import type { FrameReceiver as NativeFrameReceiver, FrameInfo } from './addon'
import addon from "@resources/addon.node"
import EventEmitter from 'events'


const createFrameReceiver = (shmName: string, zmqAddr: string): NativeFrameReceiver => {
  return new addon.FrameReceiver(shmName, zmqAddr)
}

interface FrameReceiverEventMap {
  update: [{ label: string }],
}

class FrameReceiver {
  private _label: string
  private _receiver: NativeFrameReceiver

  private static _sharedBuffer: FrameInfo | null = null
  private static _emmiter: EventEmitter<FrameReceiverEventMap> = new EventEmitter()

  constructor(label: string, shmName: string, zmqAddr: string) {
    this._label = label
    this._receiver = createFrameReceiver(shmName, zmqAddr)
    this._receiver.setOnFrame(this._onFrameUpdate.bind(this))
  }

  private _setSharedBuffer(frame: FrameInfo): void {
    FrameReceiver._sharedBuffer = frame
  }

  // consumer expects to subscribe to the "update" event
  // and fetch the `buffer` property to get the latest frame
  private _onFrameUpdate(info: FrameInfo): void {
    this._setSharedBuffer(info)
    FrameReceiver._emmiter.emit("update", { label: this.label })
  }

  public get label(): string {
    return this._label
  }

  // @note this is a shared emitter for all instances of FrameReceiver (static)
  public static get emitter(): EventEmitter<FrameReceiverEventMap> {
    return FrameReceiver._emmiter
  }

  // @note this is a shared buffer for all instances of FrameReceiver (static)
  public static get buffer(): FrameInfo {
    if (FrameReceiver._sharedBuffer === null) {
      throw new Error("frame buffer is not set")
    }
    return FrameReceiver._sharedBuffer
  }

  public start(): boolean {
    return this._receiver.start()
  }

  public stop(): void {
    this._receiver.stop()
  }

  public setScaleFactor(scale: number): void {
    if (scale <= 0) {
      throw new Error("scale factor must be greater than 0")
    }
    if (scale > 1) {
      throw new Error("scale factor must be less than or equal to 1")
    }
    this._receiver.setScaleFactor(scale)
  }
}

export default FrameReceiver
