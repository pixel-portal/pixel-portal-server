import type Player from "../player/player";
import { publish, releaseLock, TYPE_ACTIONS, TYPE_CONNECT, TYPE_DISCONNECT, TYPE_STOP } from "./worker-event";
import { WORKER_BUFFER_SIZE, type WorkerSharedState } from "./worker-state";


export default class WorkerEventPublisher {
  sharedState: WorkerSharedState;

  constructor (sharedState: WorkerSharedState) {
    this.sharedState = sharedState;
  }

  stop (): void {
    publish(this.sharedState.workerView, this.sharedState.worker, 1, WORKER_BUFFER_SIZE, (existingOffset) => {
      this.sharedState.workerView.setUint8(existingOffset, TYPE_STOP);
      existingOffset += 1;

      return existingOffset;
    }, undefined);
  }

  connect (player: Player, socketId: number): void {
    publish(this.sharedState.workerView, this.sharedState.worker, 4 + player.playerId.length + player.name.length, WORKER_BUFFER_SIZE, (existingOffset) => {
      this.sharedState.workerView.setUint8(existingOffset, TYPE_CONNECT);
      existingOffset += 1;

      this.sharedState.workerView.setUint8(existingOffset, socketId);
      existingOffset += 1;

      this.sharedState.workerView.setUint8(existingOffset, player.playerId.length);
      existingOffset += 1;

      for (let i = 0; i < player.playerId.length; i++) {
        this.sharedState.workerView.setUint8(existingOffset, player.playerId.charCodeAt(i));
        existingOffset += 1;
      }

      this.sharedState.workerView.setUint8(existingOffset, player.name.length);
      existingOffset += 1;

      for (let i = 0; i < player.name.length; i++) {
        this.sharedState.workerView.setUint8(existingOffset, player.name.charCodeAt(i));
        existingOffset += 1;
      }

      return existingOffset;
    }, undefined);
  }

  disconnect (playerSocketId: number): void {
    publish(this.sharedState.workerView, this.sharedState.worker, 2, WORKER_BUFFER_SIZE, (existingOffset) => {
      this.sharedState.workerView.setUint8(existingOffset, TYPE_DISCONNECT);
      existingOffset += 1;

      this.sharedState.workerView.setUint8(existingOffset, playerSocketId);
      existingOffset += 1;

      return existingOffset;
    }, undefined);
  }

  publishActions (playerSocketId: number, buffer: Buffer): void {
    publish(this.sharedState.workerView, this.sharedState.worker, buffer.byteLength, WORKER_BUFFER_SIZE, (existingOffset) => {
      this.sharedState.worker.set(buffer, existingOffset);
      this.sharedState.workerView.setUint8(existingOffset, TYPE_ACTIONS);
      this.sharedState.workerView.setUint8(existingOffset + 1, playerSocketId);
      existingOffset += buffer.byteLength;

      return existingOffset;
    }, undefined);
  }

}
