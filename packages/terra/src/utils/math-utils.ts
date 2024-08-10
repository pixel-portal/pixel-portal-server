import type { Quaternion, Vector3 } from "@dimforge/rapier3d-compat";

export default class MathUtils {



  static rotate (quaternion: Quaternion, source: Vector3, target: Vector3): void {
    // var x = source.x, y = source.y, z = source.z;
    // var qx = quaternion.x, qy = quaternion.y, qz = quaternion.z, qw = quaternion.w;

    // // Calculate the quaternion rotation
    // var ix = qw * x + qy * z - qz * y;
    // var iy = qw * y + qz * x - qx * z;
    // var iz = qw * z + qx * y - qy * x;
    // var iw = -qx * x - qy * y - qz * z;

    // // Update the vector with the rotated values
    // target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    // target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    // target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    const ix = quaternion.w * source.x + quaternion.y * source.z - quaternion.z * source.y;
    const iy = quaternion.w * source.y + quaternion.z * source.x - quaternion.x * source.z;
    const iz = quaternion.w * source.z + quaternion.x * source.y - quaternion.y * source.x;
    const iw = -quaternion.x * source.x - quaternion.y * source.y - quaternion.z * source.z;

    target.x = ix * quaternion.w + iw * -quaternion.x + iy * -quaternion.z - iz * -quaternion.y;
    target.y = iy * quaternion.w + iw * -quaternion.y + iz * -quaternion.x - ix * -quaternion.z;
    target.z = iz * quaternion.w + iw * -quaternion.z + ix * -quaternion.y - iy * -quaternion.x;
  }

}
