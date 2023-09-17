import { Vertex } from "./vertex";
import { Boundary } from "./boundary";
import { AdjacentVertexIndices } from "./adjacent-vertex-indices";

//////////////////////////////////////////////////
export class WarpWeights {
  #DATA;

  //  ............................................
  constructor(
    VERTICES: Array<number>,
    HOLE_VERTEX_INDICES: Array<number>,
    ADJ_VERTEX_INDICES: AdjacentVertexIndices,
    POS_CENTER: Vertex
  ) {
    //  ......................
    const VERTEX_COUNT = VERTICES.length / 3;

    this.#DATA = new Float32Array(VERTEX_COUNT);
    this.#DATA.fill(0.0);

    if (HOLE_VERTEX_INDICES === undefined) return;

    //  ......................
    const BASE_R = 9;
    const BASE_R_SQUARE = BASE_R * BASE_R;

    const Xo = POS_CENTER.x;
    const Yo = POS_CENTER.y;
    const Zo = POS_CENTER.z;

    for (let index = 0; index < VERTEX_COUNT; index++) {
      const DX = VERTICES[3 * index] - Xo;
      const DY = VERTICES[3 * index + 1] - Yo;
      const DZ = VERTICES[3 * index + 2] - Zo;

      const R_SQUARE = DX * DX + DY * DY + DZ * DZ;
      if (R_SQUARE < BASE_R_SQUARE) {
        this.#DATA[index] = 0.4;
      }
    }

    //  ......................
    const [START, OFFSET] = HOLE_VERTEX_INDICES;
    this.#DATA.fill(1.0, START, START + OFFSET);

    //  ......................
    if (ADJ_VERTEX_INDICES === undefined) return;

    for (let iCount = 0; iCount < 40; iCount++) {
      this.smoothWeights(ADJ_VERTEX_INDICES, true);
    }

    this.smoothWeights(ADJ_VERTEX_INDICES, false);

    //  ......................
    //  Square weights.
    for (let index = 0; index < VERTEX_COUNT; index++) {
      const W = this.#DATA[index];
      this.#DATA[index] = W * W;
    }
  }

  //  ........................
  smoothWeights(ADJ_VERTEX_INDICES: AdjacentVertexIndices | undefined, IS_FIX_1: boolean) {
    if (ADJ_VERTEX_INDICES === undefined) return;

    const ORG_WEIGHTS = [...this.#DATA];

    const VERTEX_COUNT = ADJ_VERTEX_INDICES.length;

    for (let index = 0; index < VERTEX_COUNT; index++) {
      const INDICES = ADJ_VERTEX_INDICES.data[index];

      if (INDICES === undefined) continue;

      if (IS_FIX_1 === true) {
        if (ORG_WEIGHTS[index] === 1.0) {
          this.#DATA[index] = 1.0;
          continue;
        }
      }

      let theWeightSum = ORG_WEIGHTS[index];

      const ADJ_VERTEX_COUNT = INDICES.length;
      for (let j = 0; j < ADJ_VERTEX_COUNT; j++) {
        theWeightSum += ORG_WEIGHTS[INDICES[j]];
      }

      const N = ADJ_VERTEX_COUNT + 1;
      this.#DATA[index] = theWeightSum / N;
    }
  }

  //  ............................................
  get data() {
    return this.#DATA;
  }
}

//////////////////////////////////////////////////
export class WarpWeightsTable {
  private _TABLE: { [key: string]: WarpWeights } = {};

  //  ............................................
  static async create(
    BONE_SHAPE: any,
    TABLE_HOLE_VERTEX_INDICES: { [key: string]: Array<number> },
    ADJ_INDICES: AdjacentVertexIndices,
    BOUNDARIES: { [key: string]: Boundary }
  ) {
    return new WarpWeightsTable(BONE_SHAPE, TABLE_HOLE_VERTEX_INDICES, ADJ_INDICES, BOUNDARIES);
  }

  //  ............................................
  constructor(
    BONE_SHAPE: any,
    TABLE_HOLE_VERTEX_INDICES: { [key: string]: Array<number> },
    ADJ_INDICES: AdjacentVertexIndices,
    BOUNDARIES: { [key: string]: Boundary }
  ) {
    this._TABLE = {};

    //  ......................
    if (BONE_SHAPE === undefined) return;

    //  ......................
    const BONE_VERTICES: Array<number> = BONE_SHAPE.vertices;
    if (BONE_VERTICES === undefined || BONE_VERTICES.length === 0) return;

    for (const ENTRIES of Object.entries(TABLE_HOLE_VERTEX_INDICES)) {
      const ALIAS = ENTRIES[0];

      const HOLE_VERTEX_INDICES = ENTRIES[1];
      const BOUNDARY = BOUNDARIES[ALIAS];

      this._TABLE[ALIAS] = new WarpWeights(
        BONE_VERTICES,
        HOLE_VERTEX_INDICES,
        ADJ_INDICES,
        BOUNDARY.wCenterVertex!
      );
    }

    //  ......................
    //  Normalize weights.
    const ALIASES = Object.keys(this._TABLE);
    const TOOTH_COUNT = ALIASES.length;
    if (TOOTH_COUNT === 0) return;

    const WEIGHTS = this._TABLE[ALIASES[0]].data;
    const VERTEX_COUNT = WEIGHTS.length;

    for (let index = 0; index < VERTEX_COUNT; index++) {
      let countExistone = 0;
      for (const ALIAS of ALIASES) {
        const WEIGHT = this._TABLE[ALIAS].data[index];
        if (WEIGHT === 1.0) countExistone++;
      }

      if (countExistone >= 1) {
        for (const ALIAS of ALIASES) {
          const WEIGHT = this._TABLE[ALIAS].data[index];
          this._TABLE[ALIAS].data[index] = WEIGHT === 1.0 ? WEIGHT / countExistone : 0.0;
        }
      } else {
        let weightSum = 0.0;
        for (const ALIAS of ALIASES) {
          const WEIGHT = this._TABLE[ALIAS].data[index];
          weightSum += WEIGHT;
        }

        for (const ALIAS of ALIASES) {
          this._TABLE[ALIAS].data[index] /= weightSum;
        }
      }
    }

    // console.log(`>>> TABLE count : ${TOOTH_COUNT} : ${VERTEX_COUNT}`);
  }

  //  ............................................
  getVertexWeights(ALIAS: string) {
    return this._TABLE[ALIAS];
  }

  //  ........................
  get table() {
    return this._TABLE;
  }
}
