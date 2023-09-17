import { Program } from "./program";
import { Utils } from "./utils";

//  Manages Objects in a 3D scene
export class Scene {
  private _gl: WebGL2RenderingContext;
  private _program: Program;
  private _objects: Array<any> = [];

  ////////////////////////////////////////////////
  constructor(GL: WebGL2RenderingContext, PROGRAM: Program) {
    this._gl = GL;
    this._program = PROGRAM;

    this._objects = []; //  Manages Objects in a 3D Scene.
  }

  ////////////////////////////////////////////////
  //  Add Object to scene, by settings default and configuring all necessary
  //  buffers and textures
  clear() {
    this._objects = [];
  }

  add(OBJECT: any, ALIAS: string) {
    //////////////////////////////////////////////
    OBJECT.alias = ALIAS ?? OBJECT.alias;
    OBJECT.diffuse = OBJECT.diffuse ?? [1.0, 1.0, 1.0, 1.0];
    OBJECT.materialDiffuse = OBJECT.materialDiffuse ?? [1.0, 1.0, 1.0, 1.0];
    OBJECT.ambient = OBJECT.ambient ?? [0.0, 0.0, 0.0, 1.0];
    OBJECT.specular = OBJECT.specular ?? [0.0, 0.0, 0.0, 1.0];
    OBJECT.specularExponent = OBJECT.specularExponent ?? 0;

    //////////////////////////////////////////////
    const GL = this._gl;
    const PROGRAM = this._program;

    //////////////////////////////////////////////
    //  Positions
    //  Attach a new VAO instance
    if (OBJECT.VAO === undefined) OBJECT.VAO = GL.createVertexArray();

    if (PROGRAM.attributes["aVertexPosition"] >= 0) {
      if (OBJECT.vertices !== undefined) {
        //  Enable it to start working on it
        GL.bindVertexArray(OBJECT.VAO);

        if (OBJECT.VBO === undefined) OBJECT.VBO = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, OBJECT.VBO);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(OBJECT.vertices), GL.STATIC_DRAW);
        GL.enableVertexAttribArray(PROGRAM.attributes["aVertexPosition"]);
        GL.vertexAttribPointer(PROGRAM.attributes["aVertexPosition"], 3, GL.FLOAT, false, 0, 0);

        GL.bindVertexArray(null);
        GL.bindBuffer(GL.ARRAY_BUFFER, null);
      }
    }

    //  Indices
    if (OBJECT.indices !== undefined) {
      if (OBJECT.IBO === undefined) OBJECT.IBO = GL.createBuffer();
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, OBJECT.IBO);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint32Array(OBJECT.indices), GL.STATIC_DRAW);
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    }

    //  Normals
    if (PROGRAM.attributes["aVertexNormal"] >= 0) {
      if (OBJECT.vertices !== undefined && OBJECT.indices !== undefined) {
        OBJECT.vertexNormals = new Float32Array(Utils.calculateNormals(OBJECT.vertices, OBJECT.indices));

        GL.bindVertexArray(OBJECT.VAO);

        GL.enableVertexAttribArray(PROGRAM.attributes["aVertexNormal"]);
        if (OBJECT.VNBO === undefined) OBJECT.VNBO = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, OBJECT.VNBO);
        GL.bufferData(GL.ARRAY_BUFFER, OBJECT.vertexNormals, GL.STATIC_DRAW);
        GL.vertexAttribPointer(PROGRAM.attributes["aVertexNormal"], 3, GL.FLOAT, false, 0, 0);
        GL.bindVertexArray(null);
        GL.bindBuffer(GL.ARRAY_BUFFER, null);
      }
    }

    //  Vertex color Scalars
    if (PROGRAM.attributes["aVertexColor"] >= 0) {
      if (OBJECT.vertexColors !== undefined) {
        console.log(`aVertexColor : ${OBJECT.vertexColors.length}`);

        GL.bindVertexArray(OBJECT.VAO);
        const colorBufferObject = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, colorBufferObject);
        GL.bufferData(GL.ARRAY_BUFFER, OBJECT.vertexColors, GL.STATIC_DRAW);
        GL.enableVertexAttribArray(PROGRAM.attributes["aVertexColor"]);
        GL.vertexAttribPointer(PROGRAM.attributes["aVertexColor"], 4, GL.FLOAT, false, 0, 0);
        GL.bindVertexArray(null);
        GL.bindBuffer(GL.ARRAY_BUFFER, null);
      }
    }

    //  Vertex weights
    if (PROGRAM.attributes["aVertexWeight"] >= 0) {
      GL.bindVertexArray(OBJECT.VAO);
      if (OBJECT.VWBO === undefined) OBJECT.VWBO = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, OBJECT.VWBO);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(OBJECT.vertices.length), GL.STATIC_DRAW);
      GL.enableVertexAttribArray(PROGRAM.attributes["aVertexWeight"]);
      GL.vertexAttribPointer(PROGRAM.attributes["aVertexWeight"], 1, GL.FLOAT, false, 0, 0);
      GL.bindVertexArray(null);
      GL.bindBuffer(GL.ARRAY_BUFFER, null);
    }

    //  Textures coordinates
    if (OBJECT.textureCoords && PROGRAM.attributes["aVertexTextureCoords"] >= 0) {
      const textureBufferObject = GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, textureBufferObject);
      GL.bufferData(GL.ARRAY_BUFFER, OBJECT.textureCoords, GL.STATIC_DRAW);
      GL.enableVertexAttribArray(PROGRAM.attributes["aVertexTextureCoords"]);
      GL.vertexAttribPointer(PROGRAM.attributes["aVertexTextureCoords"], 2, GL.FLOAT, false, 0, 0);

      //  Tangents
      if (PROGRAM.attributes["aVertexTangent"] >= 0) {
        const tangentBufferObject = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, tangentBufferObject);
        GL.bufferData(
          GL.ARRAY_BUFFER,
          new Float32Array(Utils.calculateTangents(OBJECT.vertices, OBJECT.textureCoords, OBJECT.indices)),
          GL.STATIC_DRAW
        );
        GL.enableVertexAttribArray(PROGRAM.attributes["aVertexTangent"]);
        GL.vertexAttribPointer(PROGRAM.attributes["aVertexTangent"], 3, GL.FLOAT, false, 0, 0);
        GL.bindBuffer(GL.ARRAY_BUFFER, null);
      }
    }

    // if (OBJECT.image) {
    //   // OBJECT.texture = new Texture(GL, OBJECT.image); //  Image texture
    // }

    this._objects.push(OBJECT);
  }

  ////////////////////////////////////////////////
  //  Traverse over every item in the scene.
  traverse(callBack: Function) {
    for (const OBJECT of this._objects) {
      callBack(OBJECT);
    }
  }
}
