import RAPIER, { Collider, ColliderDesc, KinematicCharacterController, Quaternion, RigidBody, RigidBodyDesc, World } from "@dimforge/rapier3d-compat";
import type WorldState from "../state/game/world-state";
import MathUtils from "../utils/math-utils";
import { INTERVAL_MS } from "../core/constants";
import { GRAVITY } from "../state/game/world-state";
import type GameState from "../state/game-state";

const STEP_FACTOR = (INTERVAL_MS / 1000.0);

const SPEED = 2.0 * STEP_FACTOR;

export default class Physics {
  gameState: GameState;
  worldState: WorldState;

  constructor (gameState: GameState, worldState: WorldState) {
    this.gameState = gameState;
    this.worldState = worldState;
  }

  tick (): void {
    for (const player of this.worldState.players) {
      const moveSpeed = SPEED * (player.hustle ? 3 : 1);
      if (player.moveForward && player.moveBackward || !player.moveForward && !player.moveBackward) {
        player.velocity.z = 0;
      }
      else if (player.moveForward) {
        player.velocity.z = -moveSpeed;
      }
      else if (player.moveBackward) {
        player.velocity.z = moveSpeed;
      }

      if (player.moveLeft && player.moveRight || !player.moveLeft && !player.moveRight) {
        player.velocity.x = 0;
      }
      else if (player.moveLeft) {
        player.velocity.x = -moveSpeed;
      }
      else if (player.moveRight) {
        player.velocity.x = moveSpeed;
      }

      MathUtils.rotate(player.orientation, player.velocity, player.velocityRotated);
      player.velocityRotated.y = GRAVITY.y * STEP_FACTOR;
      // if (player.velocityRotated.x != 0 || player.velocityRotated.z != 0) {
      //   console.log('velocity', player.velocityRotated.x.toFixed(4), player.velocityRotated.z.toFixed(4));
      // }

      player.characterController.computeColliderMovement(
        player.characterCollider,
        player.velocityRotated,
      );

      const movement = player.characterController.computedMovement();
      const position = player.character.translation();
      position.x += movement.x;
      position.y += movement.y;
      position.z += movement.z;

      player.character.setNextKinematicTranslation(position);
    }

    if (this.gameState.isLobby) {
      this.worldState.worldLobby.step();
    }
    else if (this.gameState.isGame) {
      this.worldState.worldGame.step();
    }
  }

  static async init (): Promise<void> {
    try {
      await RAPIER.init();
    }
    catch (err) {
      console.error(err);
      throw err;
    }
  }
}
