import { vec4 } from "gl-matrix";
import { mat4 } from "gl-matrix";
import { Vertex } from "./vertex";

export class Boundary {
  private _minXVertex: Vertex | undefined = undefined;
  private _maxXVertex: Vertex | undefined = undefined;

  private _minYVertex: Vertex | undefined = undefined;
  private _maxYVertex: Vertex | undefined = undefined;

  private _minZVertex: Vertex | undefined = undefined;
  private _maxZVertex: Vertex | undefined = undefined;

  //  ........................
  private _centerVertex: Vertex | undefined = undefined;
  private _meanVertex: Vertex | undefined = undefined;
  private _wCenterVertex: Vertex | undefined = undefined;

  //  ........................
  private _vertices: Float32Array | undefined = undefined;
  private _indices: Uint32Array | undefined = undefined;

  //  ............................................
  constructor(VERTEX_BUFFER: Float32Array) {
    this._minXVertex = undefined;
    this._maxXVertex = undefined;

    this._minYVertex = undefined;
    this._maxYVertex = undefined;

    this._minZVertex = undefined;
    this._maxZVertex = undefined;

    //  ............
    this._vertices = undefined;
    this._indices = undefined;

    //  ......................
    let minXindex = -1;
    let maxXindex = -1;

    let minYindex = -1;
    let maxYindex = -1;

    let minZindex = -1;
    let maxZindex = -1;

    let minX = Infinity;
    let maxX = -Infinity;

    let minY = Infinity;
    let maxY = -Infinity;

    let minZ = Infinity;
    let maxZ = -Infinity;

    let accumX = 0.0;
    let accumY = 0.0;
    let accumZ = 0.0;

    const VERTEX_COUNT = VERTEX_BUFFER.length / 3;
    for (let index = 0; index < VERTEX_COUNT; index++) {
      const VERTEX = new Vertex(VERTEX_BUFFER.subarray(index * 3, index * 3 + 3));

      accumX += VERTEX.x;
      accumY += VERTEX.y;
      accumZ += VERTEX.z;

      if (VERTEX.x < minX) {
        minX = VERTEX.x;
        minXindex = index;
      }
      if (VERTEX.x > maxX) {
        maxX = VERTEX.x;
        maxXindex = index;
      }

      if (VERTEX.y < minY) {
        minY = VERTEX.y;
        minYindex = index;
      }
      if (VERTEX.y > maxY) {
        maxY = VERTEX.y;
        maxYindex = index;
      }

      if (VERTEX.z < minZ) {
        minZ = VERTEX.z;
        minZindex = index;
      }
      if (VERTEX.z > maxZ) {
        maxZ = VERTEX.z;
        maxZindex = index;
      }
    }

    if (minXindex === -1) return;
    if (maxXindex === -1) return;
    if (minYindex === -1) return;
    if (maxYindex === -1) return;
    if (minZindex === -1) return;
    if (maxZindex === -1) return;

    this._centerVertex = new Vertex([(minX + maxX) / 2.0, (minY + maxY) / 2.0, (minZ + maxZ) / 2.0]);
    this._meanVertex = new Vertex([accumX / VERTEX_COUNT, accumY / VERTEX_COUNT, accumZ / VERTEX_COUNT]);
    this._wCenterVertex = new Vertex([
      (this._centerVertex.x + this._meanVertex.x) / 2.0,
      (this._centerVertex.y + this._meanVertex.y) / 2.0,
      (this._centerVertex.z + this._meanVertex.z) / 2.0,
    ]);

    this._minXVertex = new Vertex(VERTEX_BUFFER.subarray(minXindex * 3, minXindex * 3 + 3));
    this._maxXVertex = new Vertex(VERTEX_BUFFER.subarray(maxXindex * 3, maxXindex * 3 + 3));
    this._minYVertex = new Vertex(VERTEX_BUFFER.subarray(minYindex * 3, minYindex * 3 + 3));
    this._maxYVertex = new Vertex(VERTEX_BUFFER.subarray(maxYindex * 3, maxYindex * 3 + 3));
    this._minZVertex = new Vertex(VERTEX_BUFFER.subarray(minZindex * 3, minZindex * 3 + 3));
    this._maxZVertex = new Vertex(VERTEX_BUFFER.subarray(maxZindex * 3, maxZindex * 3 + 3));

    this._vertices = new Float32Array(
      [
        [minX, minY, maxZ],
        [maxX, minY, maxZ],
        [maxX, maxY, maxZ],
        [minX, maxY, maxZ],
        [minX, minY, minZ],
        [maxX, minY, minZ],
        [maxX, maxY, minZ],
        [minX, maxY, minZ],
        [this._wCenterVertex.x, this._wCenterVertex.y, this._wCenterVertex.z],
        [this._centerVertex.x, this._centerVertex.y, this._centerVertex.z],
        [0.0, 0.0, 0.0],
      ].flat()
    );

    this._indices = new Uint32Array(
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ].flat()
    );
  }

  //  ............................................
  get vertices() {
    return this._vertices;
  }

  get indices() {
    return this._indices;
  }

  //  ........................
  get wCenterVertex() {
    return this._wCenterVertex;
  }

  //  ............................................
  transformMat4(TRANS_MX: mat4): undefined {
    if (this._vertices === undefined) return;

    const COUNT = this._vertices.length / 3;
    for (let index = 0; index < COUNT; index++) {
      const VERTEX = new Vertex(this._vertices.subarray(index * 3, index * 3 + 3));

      let vecOne = VERTEX.vec4;
      let vecTwo = vec4.create();
      vecTwo = vec4.transformMat4(vecTwo, vecOne, TRANS_MX);
      this._vertices[index * 3] = vecTwo[0];
      this._vertices[index * 3 + 1] = vecTwo[1];
      this._vertices[index * 3 + 2] = vecTwo[2];
    }

    if (this._wCenterVertex === undefined) return;
    let vecOne = this._wCenterVertex.vec4;
    let vecTwo = vec4.create();
    vecTwo = vec4.transformMat4(vecTwo, vecOne, TRANS_MX);
    this._wCenterVertex = new Vertex(vecTwo);
  }
}
