import { geckos, type GeckosServer, type RawMessage, type ServerChannel } from "@geckos.io/server";
import http from "http";

import { CORS_ALLOWED_ORIGINS } from "./server";
import type PlayerManager from "../../player/player-manager";
import type Player from "../../player/player";
import type WorkerEventPublisher from "../../worker/worker-event-publisher";
import type ServerConfiguration from "../configuration/server-configuration";

export default class PacketServer {
  server: http.Server;
  ioServer: GeckosServer;

  playerManager: PlayerManager;
  workerEventPublisher: WorkerEventPublisher;

  constructor (configuration: ServerConfiguration, playerManager: PlayerManager, workerEventPublisher: WorkerEventPublisher) {
    this.playerManager = playerManager;
    this.workerEventPublisher = workerEventPublisher;

    this.server = http.createServer();
    this.ioServer = geckos({
      authorization: async (auth: string | undefined, _request: http.IncomingMessage, _response: http.OutgoingMessage) => this.handleAuthorization(auth),
      cors: {
        allowAuthorization: true,
        origin: (req: http.IncomingMessage) => {
          const originHeader = req.headers.origin;
          return originHeader && CORS_ALLOWED_ORIGINS.has(originHeader) ? originHeader : '';
        }
      },
      iceServers: [],
    });

    this.ioServer.addServer(this.server);
    this.ioServer.onConnection(async (channel: ServerChannel) => {
      channel.onDisconnect(connectionState => this.handleDisconnect(connectionState, channel.userData.player));
      channel.onRaw((rawMessage: RawMessage) => this.handleMessage(channel.userData.player, rawMessage));

      await this.handleConnect(channel, channel.userData.player);
    });

    this.server.listen(configuration.packetPort, () => {});
  }

  stop (): void {
    this.server.close();
  }

  handleAuthorization (auth: string | undefined) {
    if (!auth) {
      return false;
    }

    const player = this.playerManager.getPlayerForAuthToken(auth);
    if (!player) {
      return false;
    }

    return {
      player: player
    };
  }

  async handleConnect (channel: ServerChannel, player: Player): Promise<void> {
    const socketId = this.playerManager.connect(player);
    if (!socketId) {
      await channel.close();
      return;
    }

    this.workerEventPublisher.connect(player, socketId);
  }

  handleDisconnect (_connectionState: string, player: Player): void {
    const socketId = this.playerManager.disconnect(player);
    if (!socketId) {
      return;
    }

    this.workerEventPublisher.disconnect(socketId);
  }

  handleMessage (player: Player, rawMessage: RawMessage): void {
    const socketId = this.playerManager.socketIdByPlayerId.get(player.playerId);
    if (!(rawMessage instanceof Buffer) || !socketId) {
      return;
    }

    this.workerEventPublisher.publishActions(socketId, rawMessage);
  }

  updateChannels (message: ArrayBufferView): void {
    this.ioServer.raw.emit(message);
  }

  disconnectAll (): void {
    for (const [_id, connection] of this.ioServer.connectionsManager.connections) {
      connection.close();
    }
  }

}
