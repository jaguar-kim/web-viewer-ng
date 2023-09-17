import { AdjacentVertexIndices } from "./adjacent-vertex-indices";

export class GlobalBoneWeights {
  private _DATA: Float32Array;

  //  ............................................
  constructor(
    VERTEX_COUNT: number,
    ADJ_VERTEX_INDICES: any,
    TABLE_HOLE_VERTEX_INDICES: any,
    INDICES_BONE_BASE: any
  ) {
    this._DATA = new Float32Array(VERTEX_COUNT);
    this._DATA.fill(0.75);

    if (TABLE_HOLE_VERTEX_INDICES === undefined) return;

    if (INDICES_BONE_BASE === undefined) return;

    for (const _VALUE of Object.values(TABLE_HOLE_VERTEX_INDICES)) {
      const VALUE = _VALUE as Array<number>;
      const START: number = VALUE[0];
      const OFFSET: number = VALUE[1];

      this._DATA.fill(1.0, START, START + OFFSET);
    }

    for (const INDEX of INDICES_BONE_BASE) {
      this._DATA[INDEX] = 0.0;
    }

    if (ADJ_VERTEX_INDICES === undefined) {
      console.log("ADJ is undefined.");
      return;
    }

    for (let iCount = 0; iCount < 200; iCount++) {
      this.smoothWeights(ADJ_VERTEX_INDICES);
    }

    //  ......................
    for (let i = 0; 2 < 1; i++) {
      for (const INDEX of INDICES_BONE_BASE) {
        this._DATA[INDEX] = 0.0;
      }
      this.smoothWeights(ADJ_VERTEX_INDICES);
    }

    for (const INDEX of INDICES_BONE_BASE) {
      this._DATA[INDEX] = 0.0;
    }
  }

  //  ............................................
  smoothWeights(ADJ_VERTEX_INDICES: AdjacentVertexIndices) {
    if (ADJ_VERTEX_INDICES === undefined) return;

    const ORG_WEIGHTS = [...this._DATA];

    const VERTEX_COUNT = ADJ_VERTEX_INDICES.length;

    for (let index = 0; index < VERTEX_COUNT; index++) {
      const INDICES = ADJ_VERTEX_INDICES.data[index];

      if (INDICES === undefined) continue;

      if (ORG_WEIGHTS[index] === 1.0) {
        this._DATA[index] = 1.0;
        continue;
      }

      let theWeightSum = ORG_WEIGHTS[index];

      const ADJ_VERTEX_COUNT = INDICES.length;
      for (let j = 0; j < ADJ_VERTEX_COUNT; j++) {
        theWeightSum += ORG_WEIGHTS[INDICES[j]];
      }

      const N = ADJ_VERTEX_COUNT + 1;
      this._DATA[index] = theWeightSum / N;
    }
  }

  //  ............................................
  get data() {
    return this._DATA;
  }
}
