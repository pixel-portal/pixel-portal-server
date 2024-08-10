import ActionPacket from "../core/packet/action-packet";
import GamePacket from "../core/packet/game-packet";
import SnapshotPacket from "../core/packet/snapshot-packet";
import { aquireLock, releaseLock, TYPE_ACTIONS, TYPE_CONNECT, TYPE_DISCONNECT, TYPE_STOP } from "./worker-event";
import { WorkerMessageType } from "./worker-message";
import type WorkerState from "./worker-state";

export default class WorkerEventQueue {
  worker: Worker;
  workerState: WorkerState;

  onStop: (() => void) | undefined = undefined;

  constructor (worker: Worker, workerState: WorkerState) {
    this.worker = worker;
    this.workerState = workerState;
  }

  notifyResetGame (): void {
    this.worker.postMessage({
      t: WorkerMessageType.RESET_GAME,
    });
  }

  notifySnapshotUpdate (): void {
    this.worker.postMessage({
      t: WorkerMessageType.SNAPSHOT_PACKET_UPDATE,
      s: SnapshotPacket.toBuffer(this.workerState.sharedState.snapshotView, this.workerState.gameState, this.workerState.worldState)
    });
  }

  notifyGameUpdate (): void {
    this.worker.postMessage({
      t: WorkerMessageType.GAME_PACKET_UPDATE,
      s: GamePacket.toBuffer(this.workerState.sharedState.gameView, this.workerState.gameState, this.workerState.playersState)
    });
  }

  notifyGameInitialized (): void {
    this.worker.postMessage({
      t: WorkerMessageType.INITIALIZE_GAME,
      m: this.workerState.gameState.mapId,
      gs: this.workerState.gameState.gameStart,
      ge: this.workerState.gameState.gameEnd,
      gh: this.workerState.gameState.gameShutdown,
    });
  }

  // publish (maxPackSize: number, callback: (offset: number) => number): void {
  //   publish(this.workerState.sharedState.gameView, this.workerState.sharedState.game, maxPackSize, GAME_BUFFER_SIZE, callback);
  // }


  processQueue (): void {
    if (aquireLock(this.workerState.sharedState.worker)) {
      try {
        const existingOffset = this.workerState.sharedState.workerView.getUint16(1);
        let offset = 3;
        while (offset < existingOffset) {
          const eventType = this.workerState.sharedState.workerView.getUint8(offset);
          offset++;

          if (eventType === TYPE_STOP) {
            if (this.onStop) {
              this.onStop();
            }
          }

          else if (eventType === TYPE_CONNECT) {
            const socketId = this.workerState.sharedState.workerView.getUint8(offset);
            offset++;

            const pidLength = this.workerState.sharedState.workerView.getUint8(offset);
            offset++;

            let pidBytes: number[] = [];
            for (let i = 0; i < pidLength; i++) {
              pidBytes.push(this.workerState.sharedState.workerView.getUint8(offset));
              offset++;
            }

            const nameLength = this.workerState.sharedState.workerView.getUint8(offset);
            offset++;

            let nameBytes: number[] = [];
            for (let i = 0; i < nameLength; i++) {
              nameBytes.push(this.workerState.sharedState.workerView.getUint8(offset));
              offset++;
            }

            if (!this.workerState.gameState.gamePlanned) {
              this.workerState.gameState.scheduleGame();
              this.workerState.worldState.initializeLobby();
              this.workerState.worldState.initializeGame();
              this.notifyGameInitialized();
              console.log(`Starting game ${this.workerState.gameState.gameId}`);
            }
            else if (this.workerState.gameState.gameShutdown > 0) {
              this.workerState.gameState.gameShutdown = 0;
              this.notifyGameInitialized();
              console.log(`Canceled shutdown for game ${this.workerState.gameState.gameId}`);
            }

            this.workerState.playersState.connectPlayer(socketId, String.fromCharCode(...pidBytes), String.fromCharCode(...nameBytes));
            this.workerState.worldState.addPlayer(socketId);
            console.log(`Player ${socketId} joined simulation`);

            this.notifyGameUpdate();
          }

          else if (eventType === TYPE_DISCONNECT) {
            const socketId = this.workerState.sharedState.workerView.getUint8(offset);
            offset++;

            this.workerState.playersState.disconnectPlayer(socketId);
            this.workerState.worldState.removePlayer(socketId);
            console.log(`Player ${socketId} left simulation`);

            if (this.workerState.worldState.playersState.connectedPlayerSocketIds.size === 0) {
              this.workerState.gameState.unscheduleGame();
              console.log(`Scheduling game ${this.workerState.gameState.gameId} for shutdown`);
            }
            else {
              this.notifyGameUpdate();
            }
          }

          else if (eventType === TYPE_ACTIONS) {
            const socketId = this.workerState.sharedState.workerView.getUint8(offset);
            offset++;

            const player = this.workerState.worldState.getPlayer(socketId);
            offset = ActionPacket.fromBuffer(offset, this.workerState.sharedState.workerView, player);
          }
        }

        if (offset > 3) {
          this.workerState.sharedState.workerView.setUint16(1, 3);
        }
      }
      finally {
        releaseLock(this.workerState.sharedState.worker);
      }
    }
  }
}

