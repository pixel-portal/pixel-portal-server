
export default class Player {

  userId: string;
  playerId: string;
  name: string;

  constructor (userId: string, playerId: string, name: string) {
    this.userId = userId;
    this.playerId = playerId;
    this.name = name;
  }

  static isValidJson (json: any): boolean {
    return json?.uid &&
      json?.pid &&
      json?.name;
  }

  static fromJson (json: any): Player {
    return new Player(
      json.uid,
      json.pid,
      json.name
    );
  }
}
