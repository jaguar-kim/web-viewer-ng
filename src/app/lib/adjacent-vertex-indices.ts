import { Face } from "./face";

export class AdjacentVertexIndices {
  private _DATA: Array<Uint32Array> = [];

  //  ............................................
  constructor(SOURCE_INDICES: Uint32Array, VERTEX_COUNT: number) {
    this._DATA = [];

    //  ......................
    let arrData1: Array<Array<number>> = new Array(VERTEX_COUNT);
    let arrData2: Array<Uint32Array> = [];

    const FACE_COUNT = SOURCE_INDICES.length / 3;

    for (let index = 0; index < FACE_COUNT; index++) {
      const FACE = new Face(SOURCE_INDICES.subarray(index * 3, index * 3 + 3));

      if (arrData1[FACE.I[0]] === undefined) arrData1[FACE.I[0]] = new Array();
      if (arrData1[FACE.I[1]] === undefined) arrData1[FACE.I[1]] = new Array();
      if (arrData1[FACE.I[2]] === undefined) arrData1[FACE.I[2]] = new Array();

      arrData1[FACE.I[0]].push(FACE.I[1]);
      arrData1[FACE.I[0]].push(FACE.I[2]);
      arrData1[FACE.I[1]].push(FACE.I[0]);
      arrData1[FACE.I[1]].push(FACE.I[2]);
      arrData1[FACE.I[2]].push(FACE.I[0]);
      arrData1[FACE.I[2]].push(FACE.I[1]);
    }

    for (let index = 0; index < VERTEX_COUNT; index++) {
      arrData2[index] = new Uint32Array(new Set(arrData1[index])).sort();
    }

    //  ......................
    this._DATA = arrData2;
  }

  //  ............................................
  get data(): Array<Uint32Array> {
    return this._DATA;
  }

  get length(): number {
    return this._DATA.length;
  }
}
