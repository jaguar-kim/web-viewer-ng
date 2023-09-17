import { Injectable } from "@angular/core";
import { mat4, vec4 } from "gl-matrix";

import { Program } from "../lib/web-gl/program";
import { Scene } from "../lib/web-gl/scene";

import { SceneController } from "../lib/web-gl/scene-controller";
import { TrackBall } from "../lib/web-gl/track-ball";

import { SetupToothTrans } from "../lib/setup-tooth-trans";
import { SetupSteps } from "../lib/setup-steps";

import { ABDShapes } from "../lib/abdshapes";

import { AdjacentVertexIndices } from "../lib/adjacent-vertex-indices";
import { GlobalBoneWeights } from "../lib/global-bone-weights";
import { WarpWeightsTable } from "../lib/warp-weights";

import { getBG } from "../lib/bg";

import { E_APP_STATUS, E_VIEW_PART } from "../lib/app-status";

@Injectable({
  providedIn: "root",
})
export class GlViewerService {
  //  ........................
  private _TABLE_MX_HOLE_VERTEX_INDICES = {
    T17: [28768, 249],
    T16: [29017, 249],
    T15: [29266, 249],
    T14: [29515, 249],
    T13: [29764, 249],
    T12: [30013, 249],
    T11: [30262, 249],
    T21: [30511, 249],
    T22: [30760, 249],
    T23: [31009, 249],
    T24: [31258, 249],
    T25: [31507, 249],
    T26: [31756, 249],
    T27: [32005, 249],
  };

  private _TABLE_MD_HOLE_VERTEX_INDICES = {
    T47: [21071, 249],
    T46: [21320, 249],
    T45: [21569, 249],
    T44: [21818, 121],
    T43: [21939, 249],
    T42: [22188, 249],
    T41: [22437, 249],
    T31: [22686, 249],
    T32: [22935, 249],
    T33: [23184, 249],
    T34: [23433, 249],
    T35: [23682, 249],
    T36: [23931, 249],
    T37: [24180, 249],
  };

  //  ........................
  private _viewPart: E_VIEW_PART = E_VIEW_PART.BOTH;

  //  ........................
  private _CANVAS: HTMLCanvasElement | undefined;

  //  ........................
  private _renderingContext: WebGL2RenderingContext | null = null;
  private _program: Program | undefined;
  private _sceneModel: Scene | undefined;
  private _sceneController: SceneController | undefined;
  private _trackBall: TrackBall | undefined;

  //  ........................
  private _projectionMatrix: mat4 = mat4.create();
  private _normalMatrix: mat4 = mat4.create();

  private _transMatrix: mat4 = mat4.create();

  //  ........................
  private _bg: any = undefined;

  //  ........................
  private _abdShapes: ABDShapes | undefined = undefined;

  private _ORG_shapeVertices_MDBone: Float32Array | undefined = undefined;
  private _ORG_shapeVertices_MXBone: Float32Array | undefined = undefined;

  private _shapeMDBone: any = undefined;
  private _shapeMDBoneBase: any = undefined;
  private _shapeMXBone: any = undefined;
  private _shapeMXBoneBase: any = undefined;

  private _adjIndicesMXBone: AdjacentVertexIndices | undefined = undefined;
  private _adjIndicesMDBone: AdjacentVertexIndices | undefined = undefined;

  private _warpWeightsTable_MXBone: WarpWeightsTable | undefined = undefined;
  private _warpWeightsTable_MDBone: WarpWeightsTable | undefined = undefined;

  private _globalWarpWeights_MXBone: GlobalBoneWeights | undefined = undefined;
  private _globalWarpWeights_MDBone: GlobalBoneWeights | undefined = undefined;

  //  ........................
  private _tableSetupTrans: { [key: string]: SetupToothTrans } = {};
  private _tableInverseSetupMX: { [key: string]: mat4 } = {};

  private _tableSetupSteps: SetupSteps | undefined = undefined;

  //  ............................................
  private get gl(): WebGL2RenderingContext | null {
    return this._renderingContext;
  }

  get isMoving(): boolean {
    if (this._trackBall === undefined) return false;
    if (this._sceneController === undefined) return false;

    if (this._trackBall.isTrackBalling === true) return true;
    if (this._sceneController.isPanning === true) return true;

    return false;
  }

  get stepCount(): number {
    return this._tableSetupSteps === undefined ? 0 : this._tableSetupSteps.stepCount;
  }

  get selectedStepIndex(): number {
    if (this._tableSetupSteps === undefined) return 0;

    const STEP_INDEX = this._tableSetupSteps.selectedStepIndex;

    return STEP_INDEX <= 0 ? 1 : STEP_INDEX + 1;
  }

  set selectedStepIndex(INDEX: number) {
    if (this._tableSetupSteps === undefined) return;

    const NEW_INDEX = INDEX - 1;
    if (this._tableSetupSteps.selectedStepIndex === NEW_INDEX) return;

    if (NEW_INDEX >= 0 && NEW_INDEX < this._tableSetupSteps.stepCount) {
      this._tableSetupSteps.selectedStepIndex = NEW_INDEX;
      this._applyStepToBoneShape();
      this.render();
    }
  }

  //  ............................................
  constructor() {}

  ////////////////////////////////////////////////
  //  ............................................
  initialize(CANVAS: HTMLCanvasElement) {
    this._CANVAS = CANVAS;

    //  ......................
    this._renderingContext = this._CANVAS === undefined ? null : this._CANVAS.getContext("webgl2");

    //  ......................
    if (this.gl === null) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      return;
    }

    //  ......................
    this._setWebGLCanvasDimensions();
    this._initWebGLCanvas();
    this._initProgram();
    this._configureLights();

    this._initTransforms();

    //  ......................
    (async () => {
      const JSON_PATH: string = "./models/setup-2.json"; //  "http://web-viewer.istudy.pe.kr/models/setup-2.json"

      await this._loadSetupJSON(JSON_PATH);

      this._abdShapes = await ABDShapes.fromURI("./models/3D.zip");

      await this._createScene();

      //  ......................
      if (this._shapeMXBone !== undefined) {
        const VERTEX_COUNT = this._shapeMXBone.vertices.length / 3;
        this._adjIndicesMXBone = new AdjacentVertexIndices(this._shapeMXBone.indices, VERTEX_COUNT);

        if (this._ORG_shapeVertices_MXBone !== undefined && this._adjIndicesMXBone !== undefined) {
          if (this._globalWarpWeights_MXBone === undefined) {
            this._globalWarpWeights_MXBone = new GlobalBoneWeights(
              this._ORG_shapeVertices_MXBone.length / 3,
              this._adjIndicesMXBone,
              this._TABLE_MX_HOLE_VERTEX_INDICES,
              this._shapeMXBoneBase.indices
            );
          }
          if (this._warpWeightsTable_MXBone === undefined) {
            WarpWeightsTable.create(
              this._shapeMXBone,
              this._TABLE_MX_HOLE_VERTEX_INDICES,
              this._adjIndicesMXBone,
              this._abdShapes!.boundaries
            ).then((RESULT) => {
              this._warpWeightsTable_MXBone = RESULT;
              if (this._warpWeightsTable_MDBone !== undefined) this.render();
            });
          }
        }
      }

      if (this._shapeMDBone !== undefined) {
        const VERTEX_COUNT = this._shapeMDBone.vertices.length / 3;
        this._adjIndicesMDBone = new AdjacentVertexIndices(this._shapeMDBone.indices, VERTEX_COUNT);

        if (this._ORG_shapeVertices_MDBone !== undefined && this._adjIndicesMDBone !== undefined) {
          if (this._globalWarpWeights_MDBone === undefined) {
            this._globalWarpWeights_MDBone = new GlobalBoneWeights(
              this._ORG_shapeVertices_MDBone.length / 3,
              this._adjIndicesMDBone,
              this._TABLE_MD_HOLE_VERTEX_INDICES,
              this._shapeMDBoneBase.indices
            );
          }
          if (this._warpWeightsTable_MDBone === undefined) {
            WarpWeightsTable.create(
              this._shapeMDBone,
              this._TABLE_MD_HOLE_VERTEX_INDICES,
              this._adjIndicesMDBone,
              this._abdShapes!.boundaries
            ).then((RESULT) => {
              this._warpWeightsTable_MDBone = RESULT;
              if (this._warpWeightsTable_MXBone !== undefined) this.render();
            });
          }
        }
      }

      //  ......................
      this.render();
    })();
  }

  //  ........................
  private _setWebGLCanvasDimensions() {
    if (this._CANVAS === undefined) return;

    const gl = this.gl;
    if (gl === null) return;

    gl.canvas.width = this._CANVAS.clientWidth;
    gl.canvas.height = this._CANVAS.clientHeight;
  }

  private _initWebGLCanvas() {
    const gl = this.gl;
    if (gl === null) return;

    gl.clearColor(0.223, 0.223, 0.223, 1.0); //  Set clear color.
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  private _initProgram() {
    //  Uniforms to be set
    const UNIFORMS = [
      "uProjectionMatrix",
      "uModelViewMatrix",
      "uNormalMatrix",
      // "uMaterialDiffuse",
      "uLightAmbient",
      "uLightDiffuse",
      "uLightSpecular",
      "uShininess",
      "uLightPosition",
      "uTransMatrix",
      "uIsBackground",
      "uSampler",
    ];

    const ATTRIBUTES = ["aVertexPosition", "aVertexNormal", "aVertexColor"]; //  Attributes.

    const gl = this.gl;
    if (gl === null) return;
    if (this._CANVAS === undefined) return;

    //  ......................
    //  Load uniforms and attributes
    this._program = new Program(gl);
    this._program.load(ATTRIBUTES, UNIFORMS);

    this._sceneModel = new Scene(gl, this._program);

    this._sceneController = new SceneController(this._CANVAS, 0.0, 0.0, 35.0); //  SceneController.
    this._trackBall = new TrackBall(this._sceneController); //  TrackBall
    this._trackBall.goFront();
  }

  private _configureLights() {
    if (this._program === undefined) return;

    const gl = this.gl;
    if (gl === null) return;

    const UNIFORMS = this._program.uniforms;

    //  Configure lights
    gl.uniform4fv(UNIFORMS["uLightAmbient"], [0.1, 0.1, 0.1, 1]);
    gl.uniform3fv(UNIFORMS["uLightPosition"], [0, 0, 5000]);
    gl.uniform4fv(UNIFORMS["uLightDiffuse"], [0.8, 0.8, 0.85, 1]);
    gl.uniform4fv(UNIFORMS["uLightSpecular"], [0.0, 0.0, 0.0, 1]);
    gl.uniform1f(UNIFORMS["uShininess"], 10);
  }

  private _setViewVolume() {
    if (this._sceneController === undefined) return;

    const VIEW_RECTANGLE = this._sceneController.viewRectangle;
    mat4.ortho(
      this._projectionMatrix,
      VIEW_RECTANGLE.left,
      VIEW_RECTANGLE.right,
      VIEW_RECTANGLE.bottom,
      VIEW_RECTANGLE.top,
      -500,
      500
    );
  }

  private _initTransforms() {
    this._setViewVolume();
  }

  //  ............................................
  render() {
    this._draw();
  }

  //  ........................
  private _draw() {
    const _isUpperPart = (ALIAS: string): boolean => {
      if (ALIAS === "MxBone_BASE") return true;
      if (ALIAS === "MxBone") return true;

      if (ALIAS === "MdBone") return false;
      if (ALIAS === "MdBone_BASE") return false;

      const NUMBER: number = Number(ALIAS.substring(1, 2));

      if (NUMBER === 1 || NUMBER === 2) return true;

      return false;
    };

    const _isLowerPart = (ALIAS: string): boolean => {
      if (ALIAS === "MdBone") return true;
      if (ALIAS === "MdBone_BASE") return true;

      if (ALIAS === "MxBone_BASE") return false;
      if (ALIAS === "MxBone") return false;

      const NUMBER: number = Number(ALIAS.substring(1, 2));

      if (NUMBER === 3 || NUMBER === 4) return true;

      return false;
    };

    const _drawBackground = () => {
      const gl = this.gl;
      if (gl === null) return;

      if (this._program === undefined) return;

      if (this._sceneController === undefined) return;

      const BG_RECT = this._sceneController.bgViewRectangle;

      let uProjectionMatrix: mat4 = mat4.create();
      mat4.ortho(
        uProjectionMatrix,
        -BG_RECT.half_width,
        BG_RECT.half_width,
        -BG_RECT.half_height,
        BG_RECT.half_height,
        -500,
        500
      );

      //  ....................
      //  Init the matrix uniforms
      const UNIFORMS = this._program.uniforms;

      const MX_MODEL_VIEW: mat4 = mat4.create();

      gl.uniformMatrix4fv(UNIFORMS["uModelViewMatrix"], false, MX_MODEL_VIEW);
      gl.uniformMatrix4fv(UNIFORMS["uProjectionMatrix"], false, uProjectionMatrix);
      gl.uniformMatrix4fv(UNIFORMS["uNormalMatrix"], false, MX_MODEL_VIEW);
      gl.uniform1i(UNIFORMS["uIsBackground"], 0);

      //  ....................
      let _sceneBG = new Scene(gl, this._program);

      this._bg = getBG(BG_RECT.half_width * 0.97, BG_RECT.half_height * 0.97, 16);

      _sceneBG.add(this._bg, "bg");

      //  ....................
      _sceneBG.traverse((OBJECT: any) => {
        if (this._program === undefined) return;

        const UNIFORMS = this._program.uniforms;

        gl.uniformMatrix4fv(UNIFORMS["uTransMatrix"], false, mat4.create());
        gl.uniform1i(UNIFORMS["uIsBackground"], 1);

        //  Bind
        gl.bindVertexArray(OBJECT.VAO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, OBJECT.IBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, OBJECT.indices, gl.STATIC_DRAW);

        // Draw
        gl.drawElements(gl.TRIANGLES, OBJECT.indices.length, gl.UNSIGNED_INT, 0);

        //  Clean
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      });
    };

    const _setModelUniforms = () => {
      const gl = this.gl;
      if (gl === null) return;

      if (this._program === undefined) return;
      if (this._trackBall === undefined) return;

      //  Set the matrix uniforms
      const UNIFORMS = this._program.uniforms;

      gl.uniformMatrix4fv(UNIFORMS["uModelViewMatrix"], false, this._trackBall.modelViewMatrix);
      gl.uniformMatrix4fv(UNIFORMS["uProjectionMatrix"], false, this._projectionMatrix);
      mat4.transpose(this._normalMatrix, this._trackBall.matrix);
      gl.uniformMatrix4fv(UNIFORMS["uNormalMatrix"], false, this._normalMatrix);
      gl.uniform1i(UNIFORMS["uIsBackground"], 0);
    };

    //  ......................................
    const gl = this.gl;
    if (gl === null) return;

    if (this._program === undefined) return;
    if (this._trackBall === undefined) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    try {
      //  ....................
      //  draw background.
      _drawBackground();
      gl.clear(gl.DEPTH_BUFFER_BIT);

      //  ....................
      //  start scene drawing.
      this._setViewVolume();

      let theTable = this._tableSetupTrans;

      if (this._tableSetupSteps !== undefined) theTable = this._tableSetupSteps.selectedStep;

      if (this._program === undefined) return;
      const UNIFORMS = this._program.uniforms;

      _setModelUniforms();

      //  Iterate over every OBJECT in the scene.
      if (this._sceneModel !== undefined) {
        this._sceneModel.traverse((OBJECT: any) => {
          const ALIAS = OBJECT.alias;
          if (ALIAS === undefined) return;

          if (this._viewPart === E_VIEW_PART.MAND && _isUpperPart(ALIAS) === true) return;
          if (this._viewPart === E_VIEW_PART.MAXI && _isLowerPart(ALIAS) === true) return;

          const ALIAS_PARTS = ALIAS.split(".");

          mat4.identity(this._transMatrix);
          if (ALIAS !== "MxBone" && ALIAS !== "MdBone") {
            const SETUP = theTable[ALIAS];
            if (SETUP !== undefined) this._transMatrix = SETUP.affineMatrix;
          }

          gl.uniformMatrix4fv(UNIFORMS["uTransMatrix"], false, this._transMatrix);
          // gl.uniform4fv(UNIFORMS["uMaterialDiffuse"], OBJECT.materialDiffuse);
          gl.uniform4fv(UNIFORMS["uLightAmbient"], OBJECT.ambient);
          gl.uniform4fv(UNIFORMS["uLightDiffuse"], OBJECT.diffuse);
          gl.uniform4fv(UNIFORMS["uLightSpecular"], OBJECT.specular);
          gl.uniform1f(UNIFORMS["uShininess"], OBJECT.shininess);
          gl.uniform1i(UNIFORMS["uIsBackground"], 0);

          //  Bind
          gl.bindVertexArray(OBJECT.VAO);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, OBJECT.IBO);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, OBJECT.indices, gl.STATIC_DRAW);

          gl.drawElements(gl.TRIANGLES, OBJECT.indices.length, gl.UNSIGNED_INT, 0); //  Draw

          //  Clean
          gl.bindVertexArray(null);
          // gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        });
      }
      //  the end of traverse.
    } catch (error) {
      console.error(error);
    }
  }

  ////////////////////////////////////////////////
  private async _loadSetupJSON(JSON_PATH: string) {
    const _setSetupTrans = (SOURCE_ARRAY: any) => {
      for (const TRANS of SOURCE_ARRAY) {
        const {
          ToothNum: TOOTH_ID,
          Rot_w: Rw,
          Rot_x: Rx,
          Rot_y: Ry,
          Rot_z: Rz,
          Trans_x: Dx,
          Trans_y: Dy,
          Trans_z: Dz,
        } = TRANS;

        const ALIAS: string = `T${TOOTH_ID}`;
        this._tableSetupTrans[ALIAS] = new SetupToothTrans(Rw, Rx, Ry, Rz, Dx, Dy, Dz);

        let theMx = this._tableSetupTrans[ALIAS].affineMatrix;
        let invMx = mat4.create();
        invMx = mat4.invert(invMx, theMx);
        this._tableInverseSetupMX[ALIAS] = invMx;
      }
    };

    //  ......................
    const _setStepTrans = (SOURCE_TABLE: any) => {
      this._tableSetupSteps = new SetupSteps(SOURCE_TABLE);
    };

    //  ......................
    const RESPONSE: Response = await fetch(JSON_PATH);
    // console.log(`"${JSON_PATH}" >>> ${RESPONSE.ok} : ${RESPONSE.status}`);

    const SETUP_JSON = await RESPONSE.json();

    const MD_TRANS_ARRAY = SETUP_JSON.md.Trans;
    const MX_TRANS_ARRAY = SETUP_JSON.mx.Trans;
    const STEPS_TABLE = SETUP_JSON.prj;

    _setSetupTrans(MD_TRANS_ARRAY);
    _setSetupTrans(MX_TRANS_ARRAY);
    _setStepTrans(STEPS_TABLE);
  }

  ////////////////////////////////////////////////
  private _applyStepToBoneShape() {
    //  ........................
    const _getDeltaMX = (SETUP_TRANS_TABLE: any) => {
      let deltaMXs: { [key: string]: any } = {};

      for (let ALIAS of Object.keys(SETUP_TRANS_TABLE)) {
        let theMX = mat4.create();

        const tran_a = SETUP_TRANS_TABLE[ALIAS];
        if (tran_a === undefined) {
          deltaMXs[ALIAS] = theMX;
          continue;
        }

        const a = tran_a.affineMatrix;
        const b = this._tableInverseSetupMX[ALIAS];
        if (b === undefined) {
          deltaMXs[ALIAS] = theMX;
          continue;
        }

        mat4.multiply(theMX, a, b); //  theMX = a * b (matrix multiply).
        deltaMXs[ALIAS] = theMX;
      }

      return deltaMXs;
    };

    //  ........................
    const _doWarp = (
      ALIASES: any,
      ORG_VERTICES: any,
      WEIGHT_TABLE: any,
      GLOBAL_WEIGHTS: any,
      DELTA_MX_TABLE: any
    ) => {
      const VERTEX_COUNT = ORG_VERTICES.length;
      let resultVertices = new Float32Array(VERTEX_COUNT * 3);

      for (let index = 0; index < VERTEX_COUNT; index++) {
        const ORG_VERTEX = ORG_VERTICES.subarray(index * 3, index * 3 + 3);
        let resultVertex = [...ORG_VERTEX];

        for (const ALIAS of ALIASES) {
          if (WEIGHT_TABLE[ALIAS] === undefined) continue;
          if (DELTA_MX_TABLE[ALIAS] === undefined) continue;

          const WEIGHT = WEIGHT_TABLE[ALIAS].data[index] * GLOBAL_WEIGHTS.data[index];
          if (WEIGHT > 0.0) {
            const DELTA_MX = DELTA_MX_TABLE[ALIAS];

            let position = vec4.fromValues(ORG_VERTEX[0], ORG_VERTEX[1], ORG_VERTEX[2], 1);
            let targetPosition = vec4.create();
            targetPosition = vec4.transformMat4(targetPosition, position, DELTA_MX);
            const DX = (targetPosition[0] - ORG_VERTEX[0]) * WEIGHT;
            const DY = (targetPosition[1] - ORG_VERTEX[1]) * WEIGHT;
            const DZ = (targetPosition[2] - ORG_VERTEX[2]) * WEIGHT;

            resultVertex[0] += DX;
            resultVertex[1] += DY;
            resultVertex[2] += DZ;
          }
        }

        resultVertices[index * 3] = resultVertex[0];
        resultVertices[index * 3 + 1] = resultVertex[1];
        resultVertices[index * 3 + 2] = resultVertex[2];
      }

      return resultVertices;
    };

    //  ........................
    const _applyMX = (SETUP_TRANS_TABLE: any) => {
      if (this._shapeMXBone === undefined) return;
      if (this._ORG_shapeVertices_MXBone === undefined) return;
      if (this._warpWeightsTable_MXBone === undefined) return;
      if (this._warpWeightsTable_MXBone.table === undefined) return;
      if (this._globalWarpWeights_MXBone === undefined) return;

      const ORG_VERTICES = this._ORG_shapeVertices_MXBone;
      if (ORG_VERTICES === undefined) return;

      const WEIGHT_TABLE = this._warpWeightsTable_MXBone.table;
      const DELTA_MX_TABLE = _getDeltaMX(SETUP_TRANS_TABLE);

      const ALIASES = Object.keys(SETUP_TRANS_TABLE);

      this._shapeMXBone.vertices = _doWarp(
        ALIASES,
        ORG_VERTICES,
        WEIGHT_TABLE,
        this._globalWarpWeights_MXBone,
        DELTA_MX_TABLE
      );
      this._shapeMXBoneBase.vertices = this._shapeMXBone.vertices;

      const gl = this.gl;
      if (gl === null) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, this._shapeMXBone.VBO);
      gl.bufferData(gl.ARRAY_BUFFER, this._shapeMXBone.vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._shapeMXBoneBase.VBO);
      gl.bufferData(gl.ARRAY_BUFFER, this._shapeMXBoneBase.vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    const _applyMD = (SETUP_TRANS_TABLE: any) => {
      if (this._shapeMDBone === undefined) return;
      if (this._ORG_shapeVertices_MDBone === undefined) return;
      if (this._warpWeightsTable_MDBone === undefined) return;
      if (this._warpWeightsTable_MDBone.table === undefined) return;
      if (this._globalWarpWeights_MDBone === undefined) return;

      const ORG_VERTICES = this._ORG_shapeVertices_MDBone;
      if (ORG_VERTICES === undefined) return;

      const WEIGHT_TABLE = this._warpWeightsTable_MDBone.table;
      const DELTA_MX_TABLE = _getDeltaMX(SETUP_TRANS_TABLE);

      const ALIASES = Object.keys(SETUP_TRANS_TABLE);

      this._shapeMDBone.vertices = _doWarp(
        ALIASES,
        ORG_VERTICES,
        WEIGHT_TABLE,
        this._globalWarpWeights_MDBone,
        DELTA_MX_TABLE
      );
      this._shapeMDBoneBase.vertices = this._shapeMDBone.vertices;

      const gl = this.gl;
      if (gl === null) return;

      gl.bindBuffer(gl.ARRAY_BUFFER, this._shapeMDBone.VBO);
      gl.bufferData(gl.ARRAY_BUFFER, this._shapeMDBone.vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this._shapeMDBoneBase.VBO);
      gl.bufferData(gl.ARRAY_BUFFER, this._shapeMDBoneBase.vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    //  ........................
    if (this._tableSetupSteps === undefined) return;

    const STEP_INDEX = this._tableSetupSteps.selectedStepIndex;
    if (STEP_INDEX === -1) return;

    const SELECTED_STEP = this._tableSetupSteps.selectedStep;
    if (SELECTED_STEP === undefined) return;

    _applyMX(this._getSetupMX(SELECTED_STEP));
    _applyMD(this._getSetupMD(SELECTED_STEP));
  }

  private _getSetupMX(SETUP_SET: any): { [key: string]: any } {
    let result: { [key: string]: any } = {};

    for (let ALIAS of Object.keys(SETUP_SET)) {
      if (ALIAS[1] === "1" || ALIAS[1] === "2") result[ALIAS] = SETUP_SET[ALIAS];
    }

    return result;
  }

  private _getSetupMD(SETUP_SET: any): { [key: string]: any } {
    let result: { [key: string]: any } = {};

    for (let ALIAS of Object.keys(SETUP_SET)) {
      if (ALIAS[1] === "3" || ALIAS[1] === "4") result[ALIAS] = SETUP_SET[ALIAS];
    }

    return result;
  }

  ////////////////////////////////////////////////
  private async _createScene() {
    const _departMXBone = (SHAPE: any) => {
      const VERTICES = SHAPE.vertices;
      const INDICES = SHAPE.indices;

      const VERTEX_COUNT = VERTICES.length / 3;
      let maxZ = -Infinity;
      for (let index = 0; index < VERTEX_COUNT; index++) {
        const Z = VERTICES[3 * index + 2];
        if (Z > maxZ) maxZ = Z;
      }

      //  ......................
      const FACE_COUNT = INDICES.length / 3;

      let indicesBone = new Array(FACE_COUNT * 3);
      let indicesBase = new Array(FACE_COUNT * 3);

      for (let index = 0; index < FACE_COUNT; index++) {
        const FACE = INDICES.subarray(index * 3, index * 3 + 3);

        let z = 0.0;

        for (let index of FACE) {
          z += VERTICES[index * 3 + 2];
        }

        z /= 3;
        if (maxZ - z < 0.1) {
          indicesBase[index * 3] = FACE[0];
          indicesBase[index * 3 + 1] = FACE[1];
          indicesBase[index * 3 + 2] = FACE[2];
        } else {
          indicesBone[index * 3] = FACE[0];
          indicesBone[index * 3 + 1] = FACE[1];
          indicesBone[index * 3 + 2] = FACE[2];
        }
      }

      let filter = (e: any) => e !== undefined;
      let indexArrayBone = new Uint32Array(indicesBone.filter(filter));
      let indexArrayBase = new Uint32Array(indicesBase.filter(filter));

      return [indexArrayBone, indexArrayBase];
    };

    const _departMDBone = (SHAPE: any) => {
      const VERTICES = SHAPE.vertices;
      const INDICES = SHAPE.indices;

      const VERTEX_COUNT = VERTICES.length / 3;
      let minZ = Infinity;
      for (let index = 0; index < VERTEX_COUNT; index++) {
        const Z = VERTICES[3 * index + 2];
        if (Z < minZ) minZ = Z;
      }

      //  ................
      const FACE_COUNT = INDICES.length / 3;

      let indicesBone = new Array(FACE_COUNT * 3);
      let indicesBase = new Array(FACE_COUNT * 3);

      for (let index = 0; index < FACE_COUNT; index++) {
        const FACE = INDICES.subarray(index * 3, index * 3 + 3);

        let z = 0.0;

        for (let index of FACE) {
          z += VERTICES[index * 3 + 2];
        }

        z /= 3;
        if (z - minZ < 0.1) {
          indicesBase[index * 3] = FACE[0];
          indicesBase[index * 3 + 1] = FACE[1];
          indicesBase[index * 3 + 2] = FACE[2];
        } else {
          indicesBone[index * 3] = FACE[0];
          indicesBone[index * 3 + 1] = FACE[1];
          indicesBone[index * 3 + 2] = FACE[2];
        }
      }

      let filter = (e: any) => e !== undefined;
      let indexArrayBone = new Uint32Array(indicesBone.filter(filter));
      let indexArrayBase = new Uint32Array(indicesBase.filter(filter));

      return [indexArrayBone, indexArrayBase];
    };

    if (this._sceneModel === undefined) return;
    if (this._abdShapes === undefined) return;

    //  ........................
    const SHAPES = this._abdShapes.shapes;
    for (let shape of SHAPES) {
      const ALIAS = shape.alias;

      if (ALIAS === "MxBone" || ALIAS === "MdBone") {
        const R: number = 0.92863;
        const G: number = 0.551373;
        const B: number = 0.523922;

        let [indicesBone, indicesBase] = ALIAS === "MxBone" ? _departMXBone(shape) : _departMDBone(shape);

        let shapeBone: any = {};
        shapeBone.indices = indicesBone;
        shapeBone.vertices = shape.vertices;
        shapeBone.weights = shape.weights;
        shapeBone.ambient = [R * 0.1 + 0.115, G * 0.1 + 0.115, B * 0.1 + 0.115, 1.0];
        shapeBone.diffuse = [R * 0.8, G * 0.8, B * 0.8, 1.0];
        shapeBone.specular = [0.115, 0.115, 0.115, 1.0];
        shapeBone.shininess = 5;

        this._sceneModel.add(shapeBone, ALIAS);

        let shapeBase: any = {};
        shapeBase.indices = indicesBase;
        shapeBase.vertices = shape.vertices;
        shapeBase.weights = shape.weights;
        shapeBase.ambient = [R * 0.1 + 0.54, G * 0.1 + 0.54, B * 0.1 + 0.54, 1.0];
        shapeBase.diffuse = [R * 0.15 + 0.15, G * 0.15 + 0.15, B * 0.15 + 0.15, 1.0];
        shapeBase.specular = [0.0, 0.0, 0.0, 1.0];
        shapeBase.shininess = 5;

        const ALIAS_BASE = `${ALIAS}_BASE`;
        this._sceneModel.add(shapeBase, ALIAS_BASE);

        {
          if (ALIAS === "MxBone") {
            this._ORG_shapeVertices_MXBone = new Float32Array([...shapeBone.vertices]);
            this._shapeMXBone = shapeBone;
            this._shapeMXBoneBase = shapeBase;
          } else if (ALIAS === "MdBone") {
            this._ORG_shapeVertices_MDBone = new Float32Array([...shapeBone.vertices]);
            this._shapeMDBone = shapeBone;
            this._shapeMDBoneBase = shapeBase;
          }
        }
      } else {
        shape.ambient = [0.515, 0.515, 0.515, 1.0];
        shape.diffuse = [0.362, 0.362, 0.362, 1.0];
        shape.specular = [0.125, 0.125, 0.125, 1.0];
        shape.shininess = 30;
        this._sceneModel.add(shape, ALIAS);
      }
    }
  }

  ////////////////////////////////////////////////
  get selectedStepCaption(): string {
    if (this._tableSetupSteps === undefined) return "";

    return `${this._tableSetupSteps.selectedStepIndex + 1} / ${this._tableSetupSteps.stepCount}`;
  }

  ////////////////////////////////////////////////
  onPointerDown(APP_STATUS: E_APP_STATUS, EVENT: PointerEvent) {
    if (this._trackBall === undefined) return;
    if (this._sceneController === undefined) return;

    switch (APP_STATUS) {
      case E_APP_STATUS.TRACK_BALL:
        this._trackBall.onPointerDown(EVENT);
        break;
      // case E_APP_STATUS.ZOOM:
      case E_APP_STATUS.PAN:
        this._sceneController.onPointerDown(APP_STATUS, EVENT);
        break;
    }
  }

  onPointerMove(APP_STATUS: E_APP_STATUS, EVENT: PointerEvent) {
    if (this._trackBall === undefined) return;
    if (this._sceneController === undefined) return;

    switch (APP_STATUS) {
      case E_APP_STATUS.TRACK_BALL:
        if (this._trackBall.isTrackBalling === true) {
          this._trackBall.onPointerMove(EVENT);
          this.render();
          return;
        }
        break;
      // case E_APP_STATUS.ZOOM:
      //   if (this._sceneController.isZooming === true) {
      //     this._sceneController.onPointerMove(APP_STATUS, EVENT);
      //     this.render();
      //     return;
      //   }
      //   break;
      case E_APP_STATUS.PAN:
        if (this._sceneController.isPanning === true) {
          this._sceneController.onPointerMove(APP_STATUS, EVENT);
          this.render();
          return;
        }
        break;
    }
  }

  onPointerUp(APP_STATUS: E_APP_STATUS) {
    if (this._trackBall === undefined) return;
    if (this._sceneController === undefined) return;

    this._trackBall.onPointerUp();
    this._sceneController.onPointerUp(APP_STATUS);
  }

  //  ............................................
  setHomeDirection() {
    this._viewPart = E_VIEW_PART.BOTH;

    if (this._trackBall === undefined) return;
    if (this._sceneController === undefined) return;

    this._trackBall.goFront();
    this._sceneController.reset();
    this.render();
  }

  setRightView() {
    this._viewPart = E_VIEW_PART.BOTH;

    if (this._trackBall === undefined) return;

    this._trackBall.goRight();
    this.render();
  }

  setLeftView() {
    this._viewPart = E_VIEW_PART.BOTH;

    if (this._trackBall === undefined) return;

    this._trackBall.goLeft();
    this.render();
  }

  setFrontView() {
    this._viewPart = E_VIEW_PART.BOTH;

    if (this._trackBall === undefined) return;

    this._trackBall.goFront();
    this.render();
  }

  setRearView() {
    this._viewPart = E_VIEW_PART.BOTH;

    if (this._trackBall === undefined) return;

    this._trackBall.goRear();
    this.render();
  }

  setTopView() {
    this._viewPart = E_VIEW_PART.MAXI;

    if (this._trackBall === undefined) return;

    this._trackBall.goTopView();
    this.render();
  }

  setBottomView() {
    this._viewPart = E_VIEW_PART.MAND;

    if (this._trackBall === undefined) return;

    this._trackBall.goBottomView();
    this.render();
  }

  setUpperHalfView() {
    this._viewPart = E_VIEW_PART.MAXI;

    if (this._trackBall === undefined) return;

    this._trackBall.goFront();
    this.render();
  }

  setLowerHalfView() {
    this._viewPart = E_VIEW_PART.MAND;

    if (this._trackBall === undefined) return;

    this._trackBall.goFront();
    this.render();
  }

  //  ............................................
  setZoomRationForStep(ZOOM_STEP: number): void {
    const _stepToScale = (ZOOM_STEP: number): number => {
      const ZOOM_BASE = 1.07;

      if (ZOOM_STEP > 0) {
        const ZOOM_POWER = ZOOM_STEP;
        const ZOOM_SCALE = Math.pow(ZOOM_BASE, ZOOM_POWER);
        return ZOOM_SCALE;
      } else if (ZOOM_STEP < 0) {
        const ZOOM_POWER = -ZOOM_STEP;
        const ZOOM_SCALE = Math.pow(ZOOM_BASE, ZOOM_POWER);
        return 1.0 / ZOOM_SCALE;
      } else return 1.0;
    };

    if (this._sceneController === undefined) return;

    const ZOOM_SCALE = _stepToScale(ZOOM_STEP);

    this._sceneController.zoomScale = ZOOM_SCALE;

    this.render();
  }
}
