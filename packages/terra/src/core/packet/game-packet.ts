import type GameState from "../../state/game-state";
import type PlayersState from "../../state/players-state";
import { PACKET_TYPE_GAME_UPDATE } from "./packet";


export default class GamePacket {

  static toBuffer(buffer: DataView, gameState: GameState, playersState: PlayersState): number {
    let size = 0;

    buffer.setUint8(size, PACKET_TYPE_GAME_UPDATE);
    size += 1;

    buffer.setUint8(size, gameState.mapId);
    size += 1;

    buffer.setFloat32(size, gameState.gameStart);
    size += 4;

    buffer.setFloat32(size, gameState.gameEnd);
    size += 4;

    buffer.setUint8(size, playersState.detailsBySocket.size);
    size += 1;

    for (const [socketId, player] of playersState.detailsBySocket) {
      buffer.setUint8(size, socketId);
      size += 1;

      buffer.setUint8(size, playersState.connectedPlayerSocketIds.has(socketId) ? 1 : 0);
      size += 1;

      buffer.setUint8(size, player.pid.length);
      size += 1;

      for (let i = 0; i < player.pid.length; i++) {
        buffer.setUint8(size, player.pid.charCodeAt(i));
        size += 1;
      }

      buffer.setUint8(size, player.name.length);
      size += 1;

      for (let i = 0; i < player.name.length; i++) {
        buffer.setUint8(size, player.name.charCodeAt(i));
        size += 1;
      }

      // TODO: other per-player attributes
    }

    return size;
  }

}
