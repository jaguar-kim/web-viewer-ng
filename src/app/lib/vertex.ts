import { vec4 } from "gl-matrix";

export class Vertex {
  private _X: number;
  private _Y: number;
  private _Z: number;

  //  ............................................
  constructor(FLOAT_ARRAY: Array<number> | Float32Array) {
    this._X = FLOAT_ARRAY[0];
    this._Y = FLOAT_ARRAY[1];
    this._Z = FLOAT_ARRAY[2];
  }

  //  ............................................
  get x(): number {
    return this._X;
  }

  //  ........................
  get y(): number {
    return this._Y;
  }

  //  ........................
  get z(): number {
    return this._Z;
  }

  get vec4(): vec4 {
    return vec4.fromValues(this._X, this._Y, this._Z, 1.0);
  }

  //  ........................
  set pos(XYZ: Array<number>) {
    this._X = XYZ[0];
    this._Y = XYZ[1];
    this._Z = XYZ[2];
  }
}
