export function getBG(Lx: number, Ly: number, N: number): any {
  let x = 1;
  let y = 0;

  const THETA: number = (2 * Math.PI) / N;
  const COS: number = Math.cos(THETA);
  const SIN: number = Math.sin(THETA);

  //  ........................
  let vertexColors: Array<number> = new Array((N + 1) * 4);
  vertexColors[0] = 0.7;
  vertexColors[1] = 0.7;
  vertexColors[2] = 0.7;
  vertexColors[3] = 1.0;

  for (let i = 1; i <= N; i++) {
    vertexColors[i * 4 + 0] = 0.22;
    vertexColors[i * 4 + 1] = 0.22;
    vertexColors[i * 4 + 2] = 0.22;
    vertexColors[i * 4 + 3] = 1.0;
  }

  //  ........................
  let vertices: Array<number> = new Array((N + 1) * 3);
  vertices[0] = 0.0;
  vertices[1] = 0.0;
  vertices[2] = 0.0;

  vertices[1 * 3 + 0] = x * Lx;
  vertices[1 * 3 + 1] = y * Ly;
  vertices[1 * 3 + 2] = 0.0;

  for (let i = 2; i <= N; i++) {
    const Xn = COS * x - SIN * y;
    const Yn = SIN * x + COS * y;

    vertices[i * 3 + 0] = Xn * Lx;
    vertices[i * 3 + 1] = Yn * Ly;
    vertices[i * 3 + 2] = 0.0;

    x = Xn;
    y = Yn;
  }

  //  ........................
  let indices: Array<number> = new Array(N * 3);
  for (let i = 0; i < N - 1; i++) {
    indices[i * 3 + 0] = 0;
    indices[i * 3 + 1] = i + 1;
    indices[i * 3 + 2] = i + 2;
  }
  indices[(N - 1) * 3 + 0] = 0;
  indices[(N - 1) * 3 + 1] = N;
  indices[(N - 1) * 3 + 2] = 1;

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    vertexColors: new Float32Array(vertexColors),
  };
}
