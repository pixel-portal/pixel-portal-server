import { Collider, ColliderDesc, KinematicCharacterController, Quaternion, RigidBody, RigidBodyDesc, Vector3, World } from "@dimforge/rapier3d-compat";
import type Player from "../../player/player";

const CHARACTER_OFFSET = 0.01;

export default class PlayerState {
  socketId: number;

  characterDescription: RigidBodyDesc;
  character: RigidBody;

  characterColliderDescription: ColliderDesc;
  characterCollider: Collider;

  characterController: KinematicCharacterController;

  renderTick: number = 0;

  orientation: Quaternion = new Quaternion(0, 0, 0, 0);

  velocity: Vector3 = new Vector3(0, 0, 0);
  velocityRotated: Vector3 = new Vector3(0, 0, 0);

  moveForward: boolean = false;
  moveBackward: boolean = false;
  moveLeft: boolean = false;
  moveRight: boolean = false;

  hustle: boolean = false;
  crouch: boolean = false;
  kneel: boolean = false;
  prone: boolean = false;

  constructor (world: World, socketId: number) {
    this.socketId = socketId;

    this.characterDescription = RigidBodyDesc.kinematicPositionBased().setTranslation(Math.random() * 60 - 30, 4.0, Math.random() * 80 - 40);
    this.character = world.createRigidBody(this.characterDescription);

    this.characterColliderDescription = ColliderDesc.cylinder(1.0, 0.2);
    this.characterCollider = world.createCollider(
      this.characterColliderDescription,
      this.character,
    );

    this.characterController = world.createCharacterController(CHARACTER_OFFSET);
    this.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180);
    this.characterController.enableAutostep(0.5, 0.2, true);
    this.characterController.enableSnapToGround(0.5);
  }

  get actions (): number {
    return ((this.moveForward ? 1 : 0) << 7) |
      ((this.moveBackward ? 1 : 0) << 6) |
      ((this.moveLeft ? 1 : 0) << 5) |
      ((this.moveRight ? 1 : 0) << 4) |
      ((this.hustle ? 1 : 0) << 3) |
      ((this.crouch ? 1 : 0) << 2) |
      ((this.kneel ? 1 : 0) << 1) |
      ((this.prone ? 1 : 0) << 0);
  }

  set actions (value: number) {
    this.moveForward = ((value >> 7) & 1) === 1;
    this.moveBackward = ((value >> 6) & 1) === 1;
    this.moveLeft = ((value >> 5) & 1) === 1;
    this.moveRight = ((value >> 4) & 1) === 1;
    this.hustle = ((value >> 3) & 1) === 1;
    this.crouch = ((value >> 2) & 1) === 1;
    this.kneel = ((value >> 1) & 1) === 1;
    this.prone = ((value >> 0) & 1) === 1;
  }
}
