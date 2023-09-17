// Program constructor that takes a WebGL context and script tag IDs
// to extract vertex and fragment shader source code from the page
export type attributes = { [key: string]: number };
export type uniforms = { [key: string]: WebGLUniformLocation };

export class Program {
  private _gl: WebGL2RenderingContext;
  private _program: WebGLProgram;

  private _attributes: attributes = {};
  private _uniforms: uniforms = {};

  ////////////////////////////////////////////////
  //  ............................................
  //  Sets the WebGL context to use current program
  private _useProgram() {
    this._gl.useProgram(this._program);
  }

  //  ........................
  private get _vertexShader(): WebGLShader | null {
    const SHADER_STRING: string = `\
      #version 300 es
      precision mediump float;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uNormalMatrix;

      //  Lights
      uniform vec3 uLightPosition;
      uniform vec4 uLightAmbient;
      uniform vec4 uLightDiffuse;
      uniform vec4 uLightSpecular;

      uniform float uShininess;

      uniform mat4 uTransMatrix;

      uniform bool uIsBackground;

      in vec3 aVertexPosition;
      in vec3 aVertexNormal;
      in vec4 aVertexColor;

      out vec4 vVertexColor;

      void main(void) {
        vec4 VERTEX = uModelViewMatrix * uTransMatrix * vec4(aVertexPosition, 1.0);

        if(uIsBackground == true) {
          vVertexColor = aVertexColor;
        } else {
          vec3 N = vec3(uNormalMatrix * uTransMatrix * vec4(aVertexNormal, 0.0));  //  Normal
          vec3 L = normalize(uLightPosition);  //  Normalized light position

          float LAMBERTIAN_VALUE = dot(N, L);
          if (LAMBERTIAN_VALUE <= 0.00) LAMBERTIAN_VALUE = 0.00;

          vec4 Ia = uLightAmbient;  //  Ambient
          vec4 Id = vec4(0.0, 0.0, 0.0, 1.0); //  Diffuse
          vec4 Is = vec4(0.0, 0.0, 0.0, 1.0); //  Specular

          if(LAMBERTIAN_VALUE > 0.0) {
            Id = uLightDiffuse * LAMBERTIAN_VALUE;

            vec3 EYE_VEC = normalize(-vec3(VERTEX.xyz));
            vec3 R = reflect(L, N);
            float SPECULAR = pow(max(dot(R, EYE_VEC), 0.0), uShininess);
            Is = uLightSpecular * SPECULAR;
          }

          vVertexColor = vec4(vec3(Ia + Id + Is), 1.0);
        }

        gl_Position = uProjectionMatrix * VERTEX;
      }`.trim();

    let shader: WebGLShader | null = this._gl.createShader(this._gl.VERTEX_SHADER);
    if (shader === null) return null;

    this._gl.shaderSource(shader, SHADER_STRING);
    this._gl.compileShader(shader);

    if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
      console.error(this._gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  private get _fragmentShader(): WebGLShader | null {
    const SHADER_STRING: string = `\
      #version 300 es
      precision mediump float;

      uniform bool uIsBackground;

      uniform sampler2D uSampler;

      in vec4 vVertexColor;

      out vec4 fragColor;

      void main(void) {
        fragColor = vVertexColor;
      }`.trim();

    let shader: WebGLShader | null = this._gl.createShader(this._gl.FRAGMENT_SHADER);
    if (shader === null) return null;

    this._gl.shaderSource(shader, SHADER_STRING);
    this._gl.compileShader(shader);

    if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
      console.error(this._gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  //  ........................
  public get attributes(): attributes {
    return this._attributes;
  }

  public get uniforms(): uniforms {
    return this._uniforms;
  }

  //  ............................................
  constructor(GL: WebGL2RenderingContext) {
    this._gl = GL;
    this._program = GL.createProgram()!;

    const VERTEX_SHADER: any = this._vertexShader;
    const FRAGMENT_SHADER: any = this._fragmentShader;

    if (VERTEX_SHADER === null) return;
    if (FRAGMENT_SHADER === null) return;

    GL.attachShader(this._program, VERTEX_SHADER);
    GL.attachShader(this._program, FRAGMENT_SHADER);
    GL.linkProgram(this._program);

    if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS)) {
      console.error("Could not initialize shaders.");
      return;
    }

    this._useProgram();
  }

  //  Load up the given attributes and uniforms from the given values
  load(ATTRIBUTES: Array<string>, UNIFORMS: Array<string>) {
    this._useProgram();

    //  Set references to ATTRIBUTES onto the program instance.
    for (const ATTRIBUTE of ATTRIBUTES) {
      this._attributes[ATTRIBUTE] = this._gl.getAttribLocation(this._program, ATTRIBUTE);
    }

    //  Set references to UNIFORMS onto the program instance.
    for (const UNIFORM of UNIFORMS) {
      this._uniforms[UNIFORM] = this._gl.getUniformLocation(this._program, UNIFORM)!;
    }
  }
}
