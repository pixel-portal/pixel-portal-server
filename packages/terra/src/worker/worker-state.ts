import GameState from "../state/game-state";
import PlayersState from "../state/players-state";
import WorldState from "../state/game/world-state";

export const WORKER_BUFFER_SIZE = 4096;
export const GAME_BUFFER_SIZE = 1024;
export const SNAPSHOT_BUFFER_SIZE = 1024;

export interface WorkerSharedState {
  workerView: DataView;
  worker: Uint8Array;

  gameView: DataView;
  game: Uint8Array;

  snapshotView: DataView;
  snapshot: Uint8Array;
}

export default class WorkerState {
  gameState: GameState;
  playersState: PlayersState;
  worldState: WorldState;
  sharedState: WorkerSharedState;

  constructor (workerBuffer: SharedArrayBuffer, gameBuffer: SharedArrayBuffer, snapshotBuffer: SharedArrayBuffer) {
    this.gameState = new GameState();
    this.playersState = new PlayersState();
    this.worldState = new WorldState(this.gameState, this.playersState);

    this.sharedState = {
      worker: new Uint8Array(workerBuffer),
      workerView: new DataView(workerBuffer),
      game: new Uint8Array(gameBuffer),
      gameView: new DataView(gameBuffer),
      snapshot: new Uint8Array(snapshotBuffer),
      snapshotView: new DataView(snapshotBuffer),
    };
  }

  reset (): void {
    this.gameState.reset();
    this.playersState.reset();
    this.worldState.reset();
  }

  tick (tickTime: number): void {
    this.gameState.lastTick++;
    this.gameState.lastTickTime = tickTime;
  }
}
