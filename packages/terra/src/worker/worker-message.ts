
export enum WorkerMessageType {
  INITIALIZE_ENGINE = "IE",
  INITIALIZE_GAME = "IG",
  RESET_GAME = "RG",

  GAME_PACKET_UPDATE = "GPU",
  SNAPSHOT_PACKET_UPDATE = "SPU",
}

export default interface WorkerMessage {
  t: WorkerMessageType; // message type
}

export interface WorkerInitizeEngineMessage extends WorkerMessage {
  wb: SharedArrayBuffer; // worker buffer
  gb: SharedArrayBuffer; // game update buffer
  sb: SharedArrayBuffer; // snapshot update buffer
}

export interface WorkerInitializeGameMessage extends WorkerMessage {
  m: number; // map ID
  gs: number; // game start
  ge: number; // game end
  gr: number; // game reset
}

export interface WorkerGamePacketUpdateMessage extends WorkerMessage {
  s: number; // packet size
}

export interface WorkerSnapshotUpdateMessage extends WorkerMessage {
  s: number; // packet size
}
