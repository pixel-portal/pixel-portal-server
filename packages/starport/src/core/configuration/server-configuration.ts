

const DEFAULT_DEV_PORT = 9050;

interface HttpCredentials {
  keyPath: string;
  certPath: string;
}

export default class ServerConfiguration {

  devMode: boolean;

  httpPort: number;
  httpCredentials: HttpCredentials | undefined;

  constructor (devMode: boolean, httpPort: number, httpCredentials: HttpCredentials | undefined) {
    this.devMode = devMode;
    this.httpPort = httpPort;
    this.httpCredentials = httpCredentials;
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
      json.httpPort ?? (devMode ? DEFAULT_DEV_PORT : (credentials ? 443 : 80)),
      credentials
    );
  }

}

