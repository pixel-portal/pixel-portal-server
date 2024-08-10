import { type Server } from "bun";

import { CORS_ALLOWED_ORIGINS, CORS_HEADERS } from "./server";
import type PlayerManager from "../../player/player-manager";
import Player from "../../player/player";
import type ServerConfiguration from "../configuration/server-configuration";


export default class HttpServer {
  playerManager: PlayerManager;

  server: Server;

  constructor (configuration: ServerConfiguration, playerManager: PlayerManager) {
    this.playerManager = playerManager;
    this.server = Bun.serve({
      development: configuration.devMode,
      port: configuration.httpPort,
      tls: configuration.httpCredentials ? {
        key: Bun.file(configuration.httpCredentials.keyPath),
        cert: Bun.file(configuration.httpCredentials.certPath)
        // serverName: "",
      } : undefined,
      fetch: (req: Request, server: Server) => this.handleFetch(req, server),
      error (error) {
        console.error(error);
        return Response.json({
          message: error,
          stack: error.stack
        }, {});
      },
    });
  }

  stop (): void {
    this.server.stop();
  }

  determineCorsHeaders (req: Request): Record<string, string> | undefined {
    const origin = req.headers.get("Origin");
    if (origin && CORS_ALLOWED_ORIGINS.has(origin)) {
      return {
        ...CORS_HEADERS,
        "Access-Control-Allow-Origin": origin,
      };
    }
    return undefined;
  }

  async handleFetch (req: Request, server: Server) {
    const { pathname } = new URL(req.url);

    if (req.method === "OPTIONS") {
      const corsHeaders = this.determineCorsHeaders(req);
      return new Response("", {
        headers: corsHeaders ?? {},
        status: !!corsHeaders ? 200 : 404,
      });
    }
    else if (req.method === "POST" && pathname === "/register") {
      return await this.handlePlayerRegiser(req, server);
    }
    else if (req.method === "GET" && pathname === "/status") {
      const corsHeaders = this.determineCorsHeaders(req);
      if (!corsHeaders) {
        return new Response("", { status: 404 });
      }

      return Response.json({

      }, corsHeaders);
    }

    return new Response("", { status: 404 });
  }

  async handlePlayerRegiser (req: Request, server: Server): Promise<Response> {
    const formData = await req.json();
    const token = formData['token'];
    const playerJson = formData['player'];

    if (!token || !Player.isValidJson(playerJson)) {
      return new Response("", { status: 400 });
    }

    const player = Player.fromJson(playerJson);
    if (!this.playerManager.register(token, player)) {
      return new Response("", { status: 400 });
    }

    return Response.json({}, { status: 200 });
  }
}
