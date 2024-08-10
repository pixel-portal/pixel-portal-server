import { INTERVAL_MS } from "../core/constants";
import LoopStatistics from "../utils/loop-statistics";

export default class EngineStatistics {

  startTime: number = 0;
  endTime: number = 0;

  loop: LoopStatistics = new LoopStatistics();
  innerLoop: LoopStatistics = new LoopStatistics();
  outerLoop: LoopStatistics = new LoopStatistics();
  overhead: LoopStatistics = new LoopStatistics();

  get message (): string {
    return `${this.innerLoop.mean.toFixed(4)} ${this.outerLoop.mean.toFixed(4)} ${this.loop.mean.toFixed(4)} ${this.overhead.mean.toFixed(4)}`;
  }

  start (): void {
    this.startTime = performance.now();
    this.loop.mark(this.startTime);
    this.outerLoop.begin(this.startTime);
    this.innerLoop.begin(this.startTime);
  }

  finish (): void {
    this.innerLoop.add(performance.now() - this.startTime);

    while (performance.now() < this.startTime + (INTERVAL_MS - this.overhead.mean)) {
      // sleep for remainder of interval
    }

    this.endTime = performance.now();
    this.outerLoop.add(this.endTime - this.startTime);
    this.overhead.add(Math.max(0, this.loop.mean - this.outerLoop.mean));
  }
}
