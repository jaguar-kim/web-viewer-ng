import { mat4 } from "gl-matrix";

export class SetupToothTrans {
  private _Rw: number;
  private _Rx: number;
  private _Ry: number;
  private _Rz: number;

  private _Dx: number;
  private _Dy: number;
  private _Dz: number;

  //  ............................................
  constructor(Rw: number, Rx: number, Ry: number, Rz: number, Dx: number, Dy: number, Dz: number) {
    this._Rw = Rw;
    this._Rx = Rx;
    this._Ry = Ry;
    this._Rz = Rz;

    this._Dx = Dx;
    this._Dy = Dy;
    this._Dz = Dz;
  }

  //  ............................................
  get affineMatrix() {
    const Rw = this._Rw;
    const Rx = this._Rx;
    const Ry = this._Ry;
    const Rz = this._Rz;

    const Dx = this._Dx;
    const Dy = this._Dy;
    const Dz = this._Dz;

    let matrix = mat4.create();

    // mat4.set(matrix, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
    matrix[0] = 1 - 2 * Ry * Ry - 2 * Rz * Rz; //  (1, 1) ; Row1
    matrix[4] = 2 * Rx * Ry - 2 * Rw * Rz; //  (1, 2)
    matrix[8] = 2 * Rx * Rz + 2 * Rw * Ry; //  (1, 3)
    matrix[12] = Dx; //  Dx : (1, 4)

    matrix[1] = 2 * Rx * Ry + 2 * Rw * Rz; //  (2, 1) ; Row2
    matrix[5] = 1 - 2 * Rx * Rx - 2 * Rz * Rz; //  (2, 2)
    matrix[9] = 2 * Ry * Rz - 2 * Rw * Rx; //  (2, 3)
    matrix[13] = Dy; //  Dy : (2, 4)

    matrix[2] = 2 * Rx * Rz - 2 * Rw * Ry; //  (3, 1) ; Row3
    matrix[6] = 2 * Ry * Rz + 2 * Rw * Rx; //  (3, 2)
    matrix[10] = 1 - 2 * Rx * Rx - 2 * Ry * Ry; //  (3, 3)
    matrix[14] = Dz; //  Dz : (3, 4)

    matrix[3] = 0.0; //  (4, 1) ; Row4
    matrix[7] = 0.0; //  (4, 2)
    matrix[11] = 0.0; // (4, 3)
    matrix[15] = 1.0; // (4, 4)

    return matrix;
  }
}
