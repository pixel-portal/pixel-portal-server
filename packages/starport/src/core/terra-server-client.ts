import axios, { type AxiosInstance } from "axios";


export default class TerraServerClient {
  client: AxiosInstance;

  constructor () {
    this.client = axios.create();
  }

  async register (url: string, token: string, userId: string, playerId: string, name: string): Promise<boolean> {
    return (await this.client.post(`${url}/register`, {
      token: token,
      player: {
        uid: userId,
        pid: playerId,
        name: name,
      },
    })).status === 200;
  }

}
