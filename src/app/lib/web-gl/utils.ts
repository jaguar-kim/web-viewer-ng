import { vec3 } from "gl-matrix";

export class Utils {
  static calculateNormals(VS: Array<number>, INDICES: Array<number>) {
    const X: number = 0;
    const Y: number = 1;
    const Z: number = 2;
    const ns: Array<number> = [];

    // For each vertex, initialize normal X, normal Y, normal Z
    for (let i = 0; i < VS.length; i += 3) {
      ns[i + X] = 0.0;
      ns[i + Y] = 0.0;
      ns[i + Z] = 0.0;
    }

    // We work on triads of vertices to calculate
    for (let i = 0; i < INDICES.length; i += 3) {
      // Normals so i = i+3 (i = indices index)
      const v1: Array<number> = [];
      const v2: Array<number> = [];
      const normal: Array<number> = [];

      // p2 - p1
      v1[X] = VS[3 * INDICES[i + 2] + X] - VS[3 * INDICES[i + 1] + X];
      v1[Y] = VS[3 * INDICES[i + 2] + Y] - VS[3 * INDICES[i + 1] + Y];
      v1[Z] = VS[3 * INDICES[i + 2] + Z] - VS[3 * INDICES[i + 1] + Z];

      // p0 - p1
      v2[X] = VS[3 * INDICES[i] + X] - VS[3 * INDICES[i + 1] + X];
      v2[Y] = VS[3 * INDICES[i] + Y] - VS[3 * INDICES[i + 1] + Y];
      v2[Z] = VS[3 * INDICES[i] + Z] - VS[3 * INDICES[i + 1] + Z];

      // Cross product by Sarrus Rule
      normal[X] = v1[Y] * v2[Z] - v1[Z] * v2[Y];
      normal[Y] = v1[Z] * v2[X] - v1[X] * v2[Z];
      normal[Z] = v1[X] * v2[Y] - v1[Y] * v2[X];

      // Update the normals of that triangle: sum of vectors
      for (let j = 0; j < 3; j++) {
        ns[3 * INDICES[i + j] + X] = ns[3 * INDICES[i + j] + X] + normal[X];
        ns[3 * INDICES[i + j] + Y] = ns[3 * INDICES[i + j] + Y] + normal[Y];
        ns[3 * INDICES[i + j] + Z] = ns[3 * INDICES[i + j] + Z] + normal[Z];
      }
    }

    // Normalize the result.
    // The increment here is because each vertex occurs.
    for (let i = 0; i < VS.length; i += 3) {
      // With an offset of 3 in the array (due to X, Y, Z contiguous values)
      const nn = [];
      nn[X] = ns[i + X];
      nn[Y] = ns[i + Y];
      nn[Z] = ns[i + Z];

      let len = Math.sqrt(nn[X] * nn[X] + nn[Y] * nn[Y] + nn[Z] * nn[Z]);
      if (len === 0) len = 1.0;

      nn[X] = nn[X] / len;
      nn[Y] = nn[Y] / len;
      nn[Z] = nn[Z] / len;

      ns[i + X] = nn[X];
      ns[i + Y] = nn[Y];
      ns[i + Z] = nn[Z];
    }

    return ns;
  }

  static calculateTangents(VS: Array<number>, TC: Array<number>, INDICES: Array<number>) {
    const tangents: Array<vec3> = [];

    for (let i = 0; i < VS.length / 3; i++) {
      tangents[i] = [0, 0, 0];
    }

    let a: vec3 = [0, 0, 0];
    let b: vec3 = [0, 0, 0];
    let triTangent: vec3 = [0, 0, 0];

    for (let i = 0; i < INDICES.length; i += 3) {
      const i0 = INDICES[i];
      const i1 = INDICES[i + 1];
      const i2 = INDICES[i + 2];

      const pos0: vec3 = [VS[i0 * 3], VS[i0 * 3 + 1], VS[i0 * 3 + 2]];
      const pos1: vec3 = [VS[i1 * 3], VS[i1 * 3 + 1], VS[i1 * 3 + 2]];
      const pos2: vec3 = [VS[i2 * 3], VS[i2 * 3 + 1], VS[i2 * 3 + 2]];

      const tex0 = [TC[i0 * 2], TC[i0 * 2 + 1]];
      const tex1 = [TC[i1 * 2], TC[i1 * 2 + 1]];
      const tex2 = [TC[i2 * 2], TC[i2 * 2 + 1]];

      vec3.subtract(a, pos1, pos0);
      vec3.subtract(b, pos2, pos0);

      const c2c1b = tex1[1] - tex0[1];
      const c3c1b = tex2[0] - tex0[1];

      triTangent = [c3c1b * a[0] - c2c1b * b[0], c3c1b * a[1] - c2c1b * b[1], c3c1b * a[2] - c2c1b * b[2]];

      vec3.add(triTangent, tangents[i0], triTangent);
      vec3.add(triTangent, tangents[i1], triTangent);
      vec3.add(triTangent, tangents[i2], triTangent);
    }

    // Normalize tangents
    const ts: Array<number> = [];
    tangents.forEach((tan) => {
      vec3.normalize(tan, tan);
      ts.push(tan[0]);
      ts.push(tan[1]);
      ts.push(tan[2]);
    });

    return ts;
  }
}
