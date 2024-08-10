

const DEFAULT_HTTP_PORT = 9100;
const DEFAULT_PACKET_PORT = 9150;

const DEFAULT_STARPORT_URL = 'http://localhost:9050';

interface HttpCredentials {
  keyPath: string;
  certPath: string;
}

export default class ServerConfiguration {

  devMode: boolean;

  id: string;
  region: string;

  httpPort: number;
  httpCredentials: HttpCredentials | undefined;

  packetPort: number;

  starportEndpoint: string;


  constructor (devMode: boolean, id: string, region: string, httpPort: number, httpCredentials: HttpCredentials | undefined, packetPort: number, starportEndpoint: string) {
    this.devMode = devMode;
    this.id = id;
    this.region = region;
    this.httpPort = httpPort;
    this.httpCredentials = httpCredentials;
    this.packetPort = packetPort;
    this.starportEndpoint = starportEndpoint;
  }

  static async load (devMode: boolean, path: string): Promise<ServerConfiguration> {
    const file = Bun.file(path);
    const json = await file.json();

    const credentials = json.httpKey && json.httpCert ? {
      keyPath: json.httpKey,
      certPath: json.httpCert
    } : undefined;

    return new ServerConfiguration(
      devMode,
      json.id ?? 'server-id',
      json.region ?? 'server-region',
      json.httpPort ?? (devMode ? DEFAULT_HTTP_PORT : (credentials ? 443 : 80)),
      credentials,
      json.packetPort ?? DEFAULT_PACKET_PORT,
      json.starportEndpoint ?? DEFAULT_STARPORT_URL,
    );
  }

}

