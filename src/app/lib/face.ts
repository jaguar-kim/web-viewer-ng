export class Face {
  private _I: Array<number>;

  //  ............................................
  constructor(INT_ARRAY: Uint32Array | Array<number>) {
    this._I = [...INT_ARRAY];
  }

  //  ............................................
  get I(): Array<number> {
    return this._I;
  }
}
