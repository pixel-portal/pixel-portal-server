

const ONE_MINUTE_MS = 60 * 1000;

const LAST_SEEN_STALENESS = 5 * ONE_MINUTE_MS;
const MAX_PLAYER_COUNT = 16;
const REQUIRED_COUNTDOWN_SECONDS = 5;

export class ServerInformation {
  lastSeenTime: number = 0;

  clientIp: string;
  clientHttpPort: number;
  clientPacketPort: number;

  clientId: string;
  clientRegion: string;

  gameId: string | undefined = undefined;
  mapId: string | undefined = undefined;

  gameStart: number = 0;
  gameEnd: number = 0;

  lastTick: number = 0;
  lastTickTime: number = 0;

  engineTime: number = 0;

  totalCount: number = 0;
  currentCount: number = 0;

  constructor (clientIp: string, clientHttpPort: number, clientPacketPort: number, clientId: string, clientRegion: string) {
    this.clientIp = clientIp;
    this.clientHttpPort = clientHttpPort;
    this.clientPacketPort = clientPacketPort;
    this.clientId = clientId;
    this.clientRegion = clientRegion;
  }

  get httpUrl (): string {
    return `http://${this.clientIp}:${this.clientHttpPort}`;
  }

  get status (): string {
    if (this.gameStart === 0 || this.gameEnd === 0) {
      return 'IDLE';
    }
    else if (this.currentCount === 0) {
      return 'RESERVED';
    }
    else if (this.countdownGameStartSeconds > 0) {
      return 'STARTING';
    }
    else if (this.countdownGameEndSeconds > 0) {
      return 'RUNNING';
    }
    return 'CLEANUP';
  }

  get countdownGameStartSeconds (): number {
    return this.gameStart - this.lastTickTime;
  }
  get countdownGameEndSeconds (): number {
    return this.gameEnd - this.lastTickTime;
  }

  canJoin (): boolean {
    return this.totalCount < MAX_PLAYER_COUNT && (this.gameStart === 0 || this.countdownGameStartSeconds > REQUIRED_COUNTDOWN_SECONDS);
  }
}

export interface ServerAttributes {
  gameId: string | undefined;
  mapId: string | undefined;

  gameStart: number;
  gameEnd: number;

  lastTick: number;
  lastTickTime: number;

  engineTime: number;

  totalCount: number;
  currentCount: number;
}

export default class TerraServerManager {

  serverByUrl: Map<string, ServerInformation> = new Map();


  prune (): void {
    const now = new Date().getTime();
    const staleUrls = new Set<string>();
    for (const [url, server] of Object.entries(this.serverByUrl)) {
      if (now >= server.lastSeenTime + LAST_SEEN_STALENESS) {
        staleUrls.add(url);
      }
    }
    for (const url of staleUrls) {
      this.serverByUrl.delete(url);
    }
  }

  update (clientIp: string, clientHttpPort: number, clientPacketPort: number, clientId: string, clientRegion: string, attributes: ServerAttributes): ServerInformation {
    const url = `http://${clientIp}:${clientHttpPort}`;
    let info = this.serverByUrl.get(url);
    if (!info) {
      info = new ServerInformation(clientIp, clientHttpPort, clientPacketPort, clientId, clientRegion);
      this.serverByUrl.set(url, info);
    }

    info.gameId = attributes.gameId;
    info.mapId = attributes.mapId;

    info.gameStart = attributes.gameStart;
    info.gameEnd = attributes.gameEnd;

    info.lastTick = attributes.lastTick;
    info.lastTickTime = attributes.lastTickTime;

    info.engineTime = attributes.engineTime;

    info.totalCount = attributes.totalCount;
    info.currentCount = attributes.currentCount;

    info.lastSeenTime = new Date().getTime();

    return info;
  }

  find (): ServerInformation | undefined {
    for (const server of this.serverByUrl.values()) {
      if (server.canJoin()) {
        return server;
      }
    }
    return undefined;
  }

}
