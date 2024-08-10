import axios, { AxiosError, type AxiosInstance } from "axios";

import type GameState from "../../state/game-state";
import type PlayerManager from "../../player/player-manager";


export default class StarportServerClient {
  starportEndpoint: string;

  clientPort: number;
  clientId: string;
  clientRegion: string;
  gameState: GameState;
  playerManager: PlayerManager;

  client: AxiosInstance;

  constructor (starportEndpoint: string, clientPort: number, clientId: string, clientRegion: string, gameState: GameState, playerManager: PlayerManager) {
    this.starportEndpoint = starportEndpoint;
    this.clientPort = clientPort;
    this.clientId = clientId;
    this.clientRegion = clientRegion;
    this.gameState = gameState;
    this.playerManager = playerManager;
    this.client = axios.create();
  }

  async ping (): Promise<void> {
    try {
      await this.client.post(`${this.starportEndpoint}/ping/terra`, {
        clientPort: this.clientPort,
        clientId: this.clientId,
        clientRegion: this.clientRegion,

        gameId: this.gameState.gameId,

        mapId: this.gameState.mapId,

        gameStart: this.gameState.gameStart,
        gameEnd: this.gameState.gameEnd,

        lastTick: this.gameState.lastTick,
        lastTickTime: this.gameState.lastTickTime,

        engineTime: 0,

        totalCount: this.playerManager.totalCount,
        currentCount: this.playerManager.connectedCount,
      });
    }
    catch (err: any | AxiosError) {
      console.error("Unable to update status with starport", err?.cause);
    }
  }
}
