import EngineStatistics from "./engine-statistics.ts";
import Physics from "./physics.ts";
import type WorkerEventQueue from "../worker/worker-event-subscriber.ts";
import type WorkerState from "../worker/worker-state.ts";


export default class Engine {
  workerEventQueue: WorkerEventQueue;
  workerState: WorkerState;
  physics: Physics;

  timing: EngineStatistics = new EngineStatistics();

  running: boolean = true;
  mainLoopCallback: IdleRequestCallback = (_deadline: IdleDeadline): void => this.mainLoop();

  constructor (workerEventQueue: WorkerEventQueue, workerState: WorkerState, physics: Physics) {
    this.workerEventQueue = workerEventQueue;
    this.workerState = workerState;
    this.physics = physics;
  }

  start (): void {
    this.running = true;
    this.mainLoop();
  }

  stop (): void {
    this.running = false;
  }

  mainLoop (): void {
    let lastMetrics = 0;
    while (this.running) {
      try {
        this.timing.start();

        // retrieve and process worker events
        this.workerEventQueue.processQueue();

        if (this.workerState.gameState.gameStart === 0) {
          // no game scheduled, presumably nothing to do
          continue;
        }

        if (this.workerState.gameState.shouldFinish(this.timing.startTime)) {
          if (this.timing.startTime > this.workerState.gameState.gameStart) {
            // TODO: send results
            console.log(`Sending results for game ${this.workerState.gameState.gameId}`);
          }

          console.log(`Finished game ${this.workerState.gameState.gameId}`);
          this.workerState.reset();
          this.workerEventQueue.notifyResetGame();
          console.log('after reset');
          continue;
        }

        if (this.workerState.gameState.pendingStart && this.timing.startTime > this.workerState.gameState.gameStart) {
          // TODO: swap from lobby to mapId

          this.workerState.gameState.pendingStart = false;
        }

        this.physics.tick();

        this.workerState.tick(this.timing.startTime);
        this.workerEventQueue.notifySnapshotUpdate();
      }
      catch (err) {
        console.log('Failure in main loop', err);
      }
      finally {
        this.timing.finish();

        if (lastMetrics === 0 || (lastMetrics + 60000) < this.timing.endTime) {
          console.log("Engine", this.timing.message);
          lastMetrics = this.timing.endTime;
        }
      }
    }
  }

}
