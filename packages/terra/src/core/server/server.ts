import PacketServer from "./packet-server";
import HttpServer from "./http-server";

import type PlayerManager from "../../player/player-manager";
import type WorkerEventPublisher from "../../worker/worker-event-publisher";
import type ServerConfiguration from "../configuration/server-configuration";

export const CORS_ALLOWED_ORIGINS = new Set<string>(["http://localhost:9000", "https://pixelportal.org"]);
export const CORS_HEADERS = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default class Server {
  packetServer: PacketServer;
  httpServer: HttpServer;

  constructor (packetServer: PacketServer, httpServer: HttpServer) {
    this.packetServer = packetServer;
    this.httpServer = httpServer;
  }

  stop (): void {
    this.packetServer.stop();
    this.httpServer.stop();
  }

  static create (configuration: ServerConfiguration, playerManager: PlayerManager, workerEventPublisher: WorkerEventPublisher): Server {
    return new Server(new PacketServer(configuration, playerManager, workerEventPublisher), new HttpServer(configuration, playerManager));
  }
}
