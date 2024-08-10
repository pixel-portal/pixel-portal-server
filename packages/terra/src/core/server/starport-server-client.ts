import axios, { AxiosError, type AxiosInstance } from "axios";

import type GameState from "../../state/game-state";
import type PlayerManager from "../../player/player-manager";
import type ServerConfiguration from "../configuration/server-configuration";


export default class StarportServerClient {
  configuration: ServerConfiguration;

  gameState: GameState;
  playerManager: PlayerManager;

  client: AxiosInstance;

  constructor (configuration: ServerConfiguration, gameState: GameState, playerManager: PlayerManager) {
    this.configuration = configuration;
    this.gameState = gameState;
    this.playerManager = playerManager;
    this.client = axios.create();
  }

  async ping (): Promise<void> {
    try {
      await this.client.post(`${this.configuration.starportEndpoint}/ping/terra`, {
        clientHttpPort: this.configuration.httpPort,
        clientPacketPort: this.configuration.packetPort,
        clientId: this.configuration.id,
        clientRegion: this.configuration.region,

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
