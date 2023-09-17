import { Boundary } from "./boundary";
import * as JSZip from "jszip";

export class ABDShapes {
  //  ............................................
  private _SHAPES: Array<any> = [];

  private _BOUNDARIES: { [key: string]: Boundary } = {};

  //  ............................................
  static async fromURI(ZIP_FILE_URI: string): Promise<ABDShapes | undefined> {
    let zip: JSZip = new JSZip();
    const response = await fetch(ZIP_FILE_URI);

    if (response.status === 200) {
      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);

      let abdShapes = new ABDShapes();

      const ZIP_ENTRIES = Object.entries(zip.files);
      for (const [FILE_NAME, file] of ZIP_ENTRIES) {
        const SHAPE_DATA = await zip.file(FILE_NAME)!.async("uint8array");

        const ARRAY_FILE_NAME = FILE_NAME.split(".");
        if (ARRAY_FILE_NAME.length < 2) continue;

        const FILE_TITLE = ARRAY_FILE_NAME[0];
        const FILE_EXT = ARRAY_FILE_NAME[1];

        if (FILE_EXT.toUpperCase() !== "ABD") continue;
        if (FILE_TITLE === "Mx" || FILE_TITLE === "Md") continue;

        abdShapes.addShape(FILE_TITLE, SHAPE_DATA);
        abdShapes.addBoundary(FILE_TITLE);
      }

      return abdShapes;
    } else {
      console.log("Error");
      return undefined;
    }
  }

  //  ............................................
  constructor() {
    this._SHAPES = [];
    this._BOUNDARIES = {};
  }

  //  ............................................
  addShape(TITLE: string, SHAPE_DATA: any) {
    //  ................
    const BUFFER = SHAPE_DATA.buffer;

    const HEAD = SHAPE_DATA.subarray(0, 80);

    const VERTEX_COUNT_DATA = new Uint32Array(BUFFER, 80, 4);
    const VERTEX_COUNT = VERTEX_COUNT_DATA[0];

    const VERTICES = new Float32Array(BUFFER, 84, VERTEX_COUNT * 3);

    const INDICES_COUNT_DATA = new Uint32Array(BUFFER, 84 + VERTEX_COUNT * 4 * 3, 4);
    const INDICES_COUNT = INDICES_COUNT_DATA[0];
    const INDICES_OFFSET = 80 + 4 + VERTEX_COUNT * 4 * 3 + 4;
    const INDICES = new Uint32Array(BUFFER, INDICES_OFFSET);

    const CALCULATED_BUFFER_SIZE = 80 + 4 + VERTEX_COUNT * 4 * 3 + 4 + INDICES_COUNT * 4;

    const IS_OK = INDICES_COUNT === INDICES.length && CALCULATED_BUFFER_SIZE === SHAPE_DATA.length;
    if (IS_OK === true) {
      const VERTEX_COUNT = VERTICES.length / 3;
      const weights = new Float32Array(VERTEX_COUNT);
      this._SHAPES.push({ vertices: VERTICES, indices: INDICES, weights: weights, alias: TITLE });
    }
  }

  getShape(ALIAS: string): any {
    for (const SHAPE of this._SHAPES) {
      if (SHAPE.alias === ALIAS) return SHAPE;
    }

    return undefined;
  }

  addBoundary(ALIAS: string) {
    if (ALIAS === "MxBone" || ALIAS === "MdBone") return;

    const SHAPE = this.getShape(ALIAS);
    if (SHAPE === undefined) return;

    const BOUNDARY = new Boundary(SHAPE.vertices);

    this._BOUNDARIES[ALIAS] = BOUNDARY;
  }

  getBoundary(ALIAS: string) {
    return this._BOUNDARIES[ALIAS];
  }

  //  ............................................
  get boundaries() {
    return this._BOUNDARIES;
  }

  get shapes(): Array<any> {
    return this._SHAPES;
  }

  get shapeMDBone(): any {
    for (const SHAPE of this._SHAPES) {
      if (SHAPE.alias === "MdBone") return SHAPE;
    }

    return undefined;
  }

  get shapeMXBone(): any {
    for (const SHAPE of this._SHAPES) {
      if (SHAPE.alias === "MxBone") return SHAPE;
    }

    return undefined;
  }
}
