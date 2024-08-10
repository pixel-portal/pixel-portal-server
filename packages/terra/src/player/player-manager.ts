import type GameState from "../state/game-state";
import type Player from "./player";


export const MAX_PLAYERS = 16;

export default class PlayerManager {

  playerIdByAuthToken: Map<string, string> = new Map();
  authTokenByPlayerId: Map<string, string> = new Map();

  playerById: Map<string, Player> = new Map();

  seenPlayerIds: Set<string> = new Set();
  connectedPlayerIds: Set<string> = new Set();
  socketIdCounter: number = 0;

  disconnectedSocketIdByPlayerId: Map<string, number> = new Map();
  socketIdByPlayerId: Map<string, number> = new Map();
  playerIdBySocketId: Map<number, string> = new Map();

  gameState: GameState;

  constructor (gameState: GameState) {
    this.gameState = gameState;
  }

  get totalCount (): number {
    return this.playerIdByAuthToken.size;
  }

  get connectedCount (): number {
    return this.connectedPlayerIds.size;
  }

  clear (): void {
    this.playerIdByAuthToken.clear();
    this.playerById.clear();
    this.seenPlayerIds.clear();
    this.connectedPlayerIds.clear();
    this.socketIdCounter = 0;
    this.disconnectedSocketIdByPlayerId.clear();
    this.socketIdByPlayerId.clear();
    this.playerIdBySocketId.clear();
  }

  getPlayerForAuthToken (authToken: string): Player | undefined {
    if (this.playerIdByAuthToken.has(authToken)) {
      return this.playerById.get(this.playerIdByAuthToken.get(authToken) as string);
    }
    return undefined;
  }

  register (authToken: string, player: Player): boolean {
    if (this.playerIdByAuthToken.has(authToken)) {
      return true;
    }

    if (this.totalCount >= MAX_PLAYERS) {
      return false;
    }

    if (this.gameState.gamePlanned && performance.now() > this.gameState.gameStart) {
      return false;
    }

    const previousToken = this.authTokenByPlayerId.get(player.playerId);
    if (previousToken) {
      this.playerIdByAuthToken.delete(previousToken);
    }

    this.authTokenByPlayerId.set(player.playerId, authToken);
    this.playerIdByAuthToken.set(authToken, player.playerId);
    this.playerById.set(player.playerId, player);
    return true;
  }

  connect (player: Player): number | undefined {
    if (this.connectedPlayerIds.has(player.playerId)) {
      if (!this.socketIdByPlayerId.has(player.playerId)) {
        console.error("Player in bad state with no socket");
        return undefined;
      }
      return this.socketIdByPlayerId.get(player.playerId);
    }
    else if (this.seenPlayerIds.has(player.playerId)) {
      const socketId = this.disconnectedSocketIdByPlayerId.get(player.playerId);
      if (!socketId) {
        console.error("Player in bad state with no previous socket");
        return undefined;
      }

      this.connectedPlayerIds.add(player.playerId);
      this.socketIdByPlayerId.set(player.playerId, socketId);
      this.playerIdBySocketId.set(socketId, player.playerId);
      console.log(`Player ${socketId}:${player.playerId}:${player.userId} reconnected`);
      return socketId;
    }
    else {
      const socketId = ++this.socketIdCounter;
      this.seenPlayerIds.add(player.playerId);
      this.connectedPlayerIds.add(player.playerId);
      this.socketIdByPlayerId.set(player.playerId, socketId);
      this.playerIdBySocketId.set(socketId, player.playerId);
      console.log(`Player ${socketId}:${player.playerId}:${player.userId} connected`);
      return socketId;
    }
  }

  disconnect (player: Player): number | undefined {
    const socketId = this.socketIdByPlayerId.get(player.playerId);
    if (socketId) {
      this.socketIdByPlayerId.delete(player.playerId);
      this.playerIdBySocketId.delete(socketId);
      this.disconnectedSocketIdByPlayerId.set(player.playerId, socketId);
    }
    this.connectedPlayerIds.delete(player.playerId);
    return socketId;
  }
}
