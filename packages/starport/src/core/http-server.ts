import { type Server } from "bun";
import Utils from "../utils/utils";
import axios, { type AxiosInstance } from 'axios';

import type TerraServerManager from "./terra-server-manager";
import type TerraServerClient from "./terra-server-client";
import type ServerConfiguration from "./configuration/server-configuration";


export const CORS_ALLOWED_ORIGINS = new Set<string>(["http://localhost:9000", "https://pixelportal.org"]);
export const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


export default class HttpServer {
  terraServerManager: TerraServerManager;
  terraServerClient: TerraServerClient;

  server: Server;
  client: AxiosInstance;

  constructor (configuration: ServerConfiguration, terraServerManager: TerraServerManager, terraServerClient: TerraServerClient) {
    this.terraServerManager = terraServerManager;
    this.terraServerClient = terraServerClient;
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
    this.client = axios.create();

    console.log(`Started HTTP server on port ${configuration.httpPort}`);
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
    else if (req.method === "POST" && pathname === "/ping/terra") {
      return await this.handleTerraPing(req, server);
    }

    return new Response("", { status: 404 });
  }

  async handlePlayerRegiser (req: Request, server: Server): Promise<Response> {
    const corsHeaders = this.determineCorsHeaders(req);
    if (!corsHeaders) {
      return new Response("", { status: 404 });
    }

    const formData = await req.json();
    const userId = formData['uid'];
    if (!userId) {
      return Response.json({ code: 100 }, { headers: corsHeaders, status: 400 });
    }

    const terraServer = this.terraServerManager.find();
    if (!terraServer) {
      return Response.json({ code: 110 }, { headers: corsHeaders, status: 400 });
    }

    const token = Utils.uuid();
    const playerId = Utils.uuid();
    const name = `Guest_${playerId.substring(0, 6)}`;

    const registered = await this.terraServerClient.register(terraServer.url, token, userId, playerId, name);
    if (!registered) {
      return Response.json({ code: 120 }, { headers: corsHeaders, status: 400 });
    }

    return Response.json({
      socketUrl: server.url,
      token: token,
      player: {
        uid: userId,
        pid: playerId,
        name: name
      }
    }, {
      headers: corsHeaders,
      status: 200,
    });
  }

  async handleTerraPing (req: Request, server: Server): Promise<Response> {
    const clientIp = server.requestIP(req);
    const formData = await req.json();

    const clientPort = formData['clientPort'];
    const clientId = formData['clientId'];
    const clientRegion = formData['clientRegion'];

    if (!clientIp?.address) {
      return new Response("", { status: 404 });
    }

    const address = clientIp.family === "IPv6" ? `[${clientIp.address}]` : clientIp.address;
    const terraServer = this.terraServerManager.update(address, clientPort, clientId, clientRegion, {
      gameId: formData['gameId'],
      mapId: formData['mapId'],

      gameStart: formData['gameStart'],
      gameEnd: formData['gameEnd'],

      lastTick: formData['lastTick'],
      lastTickTime: formData['lastTickTime'],

      engineTime: formData['engineTime'],

      totalCount: formData['totalCount'],
      currentCount: formData['currentCount'],
    });

    console.log(`Received ping from terra service [${terraServer.clientRegion}][${terraServer.url}][${terraServer.status}][${terraServer.currentCount} of ${terraServer.totalCount}]`);
    return new Response("", { status: 200 });
  }

}
