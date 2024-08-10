import { ColliderDesc, World } from "@dimforge/rapier3d-compat";
import PlayerState from "./player-state";
import type GameState from "../game-state";
import type PlayersState from "../players-state";

export const GRAVITY = { x: 0.0, y: -9.81, z: 0.0 };


export default class WorldState {
  gameState: GameState;
  playersState: PlayersState;

  worldLobby: World = new World(GRAVITY);
  worldGame: World = new World(GRAVITY);

  playerLobby: Map<number, PlayerState> = new Map();
  playerGame: Map<number, PlayerState> = new Map();


  constructor (gameState: GameState, playersState: PlayersState) {
    this.gameState = gameState;
    this.playersState = playersState;
  }

  reset (): void {
    this.playerLobby.clear();
    this.playerGame.clear();

    this.worldLobby?.free();
    this.worldLobby = new World(GRAVITY);

    this.worldGame?.free();
    this.worldGame = new World(GRAVITY);
  }

  get playerCount (): number {
    return this.gameState.isLobby ? this.playerLobby.size : this.gameState.isGame ? this.playerGame.size : 0;
  }

  get players (): IterableIterator<PlayerState> {
    return this.gameState.isLobby ? this.playerLobby.values() : this.gameState.isGame ? this.playerGame.values() : [].values();
  }

  initializeLobby (): void {
    const groundCollider = ColliderDesc.cuboid(30.0, 0.5, 40.0);
    groundCollider.translation.y = -0.5;
    this.worldLobby.createCollider(groundCollider);
  }

  initializeGame (): void {
    const groundCollider = ColliderDesc.cuboid(30.0, 0.5, 40.0);
    groundCollider.translation.y = -0.5;
    this.worldGame.createCollider(groundCollider);
  }

  getPlayer (socketId: number): PlayerState | undefined {
    return this.gameState.isLobby ? this.playerLobby.get(socketId) : this.gameState.isGame ? this.playerGame.get(socketId) : undefined;
  }

  addPlayer (socketId: number): void {
    this.playerLobby.set(socketId, new PlayerState(this.worldLobby, socketId));
    this.playerGame.set(socketId, new PlayerState(this.worldGame, socketId));
  }

  removePlayer (socketId: number): void {
    const lobbyPlayer = this.playerLobby.get(socketId);
    if (lobbyPlayer) {
      this.worldLobby.removeCollider(lobbyPlayer.characterCollider, true);
      this.worldLobby.removeRigidBody(lobbyPlayer.character);
      this.worldLobby.removeCharacterController(lobbyPlayer.characterController);

      lobbyPlayer.characterController.free();
      this.playerLobby.delete(socketId);
    }

    const gamePlayer = this.playerGame.get(socketId);
    if (gamePlayer) {
      this.worldGame.removeCollider(gamePlayer.characterCollider, true);
      this.worldGame.removeRigidBody(gamePlayer.character);
      this.worldGame.removeCharacterController(gamePlayer.characterController);

      gamePlayer.characterController.free();
      this.playerGame.delete(socketId);
    }
  }
}