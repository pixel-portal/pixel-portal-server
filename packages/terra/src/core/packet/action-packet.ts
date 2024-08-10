import type PlayerState from "../../state/game/player-state";

export default class ActionPacket {

  static length (): number {
    return 4 // tick
      + 1 // actions
      + 16; // orientation
  }

  static fromBuffer(offset: number, buffer: DataView, player: PlayerState | undefined): number {
    const tick = buffer.getFloat32(offset);
    offset += 4;

    if (!player || tick <= player.renderTick) {
      offset += 1 + 16;
      return offset;
    }

    player.renderTick = tick;

    player.actions = buffer.getUint8(offset);
    offset += 1;

    player.orientation.x = buffer.getFloat32(offset);
    offset += 4;
    player.orientation.y = buffer.getFloat32(offset);
    offset += 4;
    player.orientation.z = buffer.getFloat32(offset);
    offset += 4;
    player.orientation.w = buffer.getFloat32(offset);
    offset += 4;

    return offset;
  }
}

