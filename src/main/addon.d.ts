import { Buffer } from "node:buffer"

export declare interface FrameInfo {
    frame_count: number
    width: number
    height: number
    channels: number
    data: Buffer
}

export type OnFrameCallback = (frame: FrameInfo) => void

export declare class FrameReceiver {
    constructor(shm_name: string, zmq_addr: string)

    // Returns true if the receiver was started successfully,
    // otherwise throws an exception.
    start(): boolean

    stop(): void

    setOnFrame(onFrame: OnFrameCallback): void

    setScaleFactor(scale: number): void
}
