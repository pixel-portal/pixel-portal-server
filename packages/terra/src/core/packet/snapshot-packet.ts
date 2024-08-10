import type GameState from "../../state/game-state";
import type WorldState from "../../state/game/world-state";
import { PACKET_TYPE_SNAPSHOT_UPDATE } from "./packet";

export default class SnapshotPacket {

  static toBuffer(buffer: DataView, state: GameState, worldState: WorldState): number {
    let size = 0;

    buffer.setUint8(size, PACKET_TYPE_SNAPSHOT_UPDATE);
    size += 1;
    buffer.setUint32(size, state.lastTick);
    size += 4;
    buffer.setUint32(size, state.lastTickTime);
    size += 4;

    buffer.setUint8(size, worldState.playerCount);
    size += 1

    for (const player of worldState.players) {
      buffer.setUint8(size, player.socketId);
      size += 1

      buffer.setUint8(size,
        ((player.moveForward ? 1 : 0) << 7) |
        ((player.moveBackward ? 1 : 0) << 6) |
        ((player.moveLeft ? 1 : 0) << 5) |
        ((player.moveRight ? 1 : 0) << 4) |
        ((player.hustle ? 1 : 0) << 3) |
        ((player.crouch ? 1 : 0) << 2) |
        ((player.kneel ? 1 : 0) << 1) |
        ((player.prone ? 1 : 0) << 0));
      size += 1

      const position = player.character.translation();
      buffer.setFloat32(size, Math.fround(position.x));
      size += 4;
      buffer.setFloat32(size, Math.fround(position.y));
      size += 4;
      buffer.setFloat32(size, Math.fround(position.z));
      size += 4;

      // const rotation = player.character.rotation();
      buffer.setFloat32(size, Math.fround(player.orientation.x));
      size += 4;
      buffer.setFloat32(size, Math.fround(player.orientation.y));
      size += 4;
      buffer.setFloat32(size, Math.fround(player.orientation.z));
      size += 4;
      buffer.setFloat32(size, Math.fround(player.orientation.w));
      size += 4;
    }

    return size;
  }
}

