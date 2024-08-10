import { MAP_LOBBY } from "../core/constants";
import Utils from "../utils/utils";

const PREGAME_LENGTH_MS = 1000 * 45;
const GAME_LENGTH_MS = 1000 * 15;
const GAME_SHUTODWN_MS = 1000 * 15;

export default class GameState {

  gameId: string | undefined  = undefined;

  mapId: number = MAP_LOBBY;

  gameStart: number = 0;
  gameEnd: number = 0;
  gameShutdown: number = 0;

  pendingStart: boolean = true;

  lastTick: number = 0;
  lastTickTime: number = 0;

  reset (): void {
    this.mapId = MAP_LOBBY;
    this.gameStart = 0;
    this.gameEnd = 0;
    this.gameShutdown = 0;
    this.pendingStart = true;
    this.lastTick = 0;
    this.lastTickTime = 0;
  }

  get gamePlanned (): boolean {
    return this.gameStart > 0;
  }

  get isLobby (): boolean {
    return performance.now() < this.gameStart;
  }
  get isGame (): boolean {
    const now = performance.now();
    return now >= this.gameStart && now < this.gameEnd;
  }

  scheduleGame (): void {
    this.gameId = Utils.uuid();
    this.gameStart = performance.now() + PREGAME_LENGTH_MS;
    this.gameEnd = this.gameStart + GAME_LENGTH_MS;
    this.gameShutdown = 0;
  }

  unscheduleGame (): void {
    if (this.gameShutdown === 0) {
      this.gameShutdown = performance.now() + GAME_SHUTODWN_MS;
    }
  }

  shouldFinish (time: number): boolean {
    return this.gameEnd > 0 && time > this.gameEnd || this.gameShutdown > 0 && time > this.gameShutdown;
  }
}
