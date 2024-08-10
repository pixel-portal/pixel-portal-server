
interface PlayerDetails {
  pid: string;
  name: string;
}

export default class PlayersState {

  detailsBySocket: Map<number, PlayerDetails> = new Map();
  connectedPlayerSocketIds: Set<number> = new Set();


  reset (): void {
    this.detailsBySocket.clear();
    this.connectedPlayerSocketIds.clear();
  }

  connectPlayer (socketId: number, pid: string, name: string): void {
    this.connectedPlayerSocketIds.add(socketId);

    this.detailsBySocket.set(socketId, {
      pid: pid,
      name: name,
    });
  }

  disconnectPlayer (socketId: number): void {
    this.connectedPlayerSocketIds.delete(socketId);
  }

}