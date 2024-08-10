import Engine from "../engine/engine";
import Physics from "../engine/physics";
import WorkerEventSubscriber from "./worker-event-subscriber";
import type WorkerMessage from "./worker-message";
import { WorkerMessageType, type WorkerInitizeEngineMessage } from "./worker-message";
import WorkerState from "./worker-state";

declare var self: Worker;

function initialize (message: WorkerInitizeEngineMessage): void {
  Physics.init()
    .then(() => {
      const workerState = new WorkerState(message.wb, message.gb, message.sb);
      const workerSubscriber = new WorkerEventSubscriber(self, workerState);

      const physics = new Physics(workerState.gameState, workerState.worldState);
      const engine = new Engine(workerSubscriber, workerState, physics);

      workerSubscriber.onStop = () => {
        engine.stop();
        process.exit(0);
      };

      console.log("Worker simulation started");
      engine.start();
    });
}

self.addEventListener("message", (rawEvent: MessageEvent) => {
  const workerEvent = rawEvent.data as WorkerMessage;
  if (workerEvent.t === WorkerMessageType.INITIALIZE_ENGINE) {
    initialize(workerEvent as WorkerInitizeEngineMessage);
  }
});
