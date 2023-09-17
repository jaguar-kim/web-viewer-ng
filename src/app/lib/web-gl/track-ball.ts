import { vec3, mat4 } from "gl-matrix";

import { SceneController } from "./scene-controller";

export class TrackBall {
  //  ........................
  private _SCENE_CONTROLLER: SceneController;

  //  ........................
  private _theMX: mat4;
  private _modelViewMX: mat4;

  //  For mouse events .....
  private _trackBalling: boolean = false;

  private _x: number = 0;
  private _y: number = 0;
  private _lastX: number = 0;
  private _lastY: number = 0;

  //  ............................................
  constructor(SCENE_CONTROLLER: SceneController) {
    this._SCENE_CONTROLLER = SCENE_CONTROLLER;

    this._theMX = mat4.create();
    this._modelViewMX = mat4.create();

    //  For mouse events .....
    this._trackBalling = false;

    this._x = 0;
    this._y = 0;
    this._lastX = 0;
    this._lastY = 0;
  }

  //  ............................................
  goHome() {
    mat4.identity(this._theMX);
  }

  goRight() {
    mat4.fromXRotation(this._theMX, Math.PI / 2.0);
  }

  goLeft() {
    mat4.fromXRotation(this._theMX, Math.PI / 2.0);
    let mx: mat4 = mat4.create();
    mx = mat4.fromYRotation(mx, Math.PI);
    mat4.multiply(this._theMX, this._theMX, mx);
  }

  goFront() {
    mat4.fromXRotation(this._theMX, Math.PI / 2.0);
    let mx: mat4 = mat4.create();
    mx = mat4.fromYRotation(mx, Math.PI / 2.0);
    mat4.multiply(this._theMX, this._theMX, mx);
  }

  goRear() {
    mat4.fromXRotation(this._theMX, Math.PI / 2.0);
    let mx: mat4 = mat4.create();
    mx = mat4.fromYRotation(mx, -Math.PI / 2.0);
    mat4.multiply(this._theMX, this._theMX, mx);
  }

  goTopView() {
    mat4.fromZRotation(this._theMX, Math.PI / 2.0);
    let mx: mat4 = mat4.create();
    mx = mat4.fromXRotation(mx, -Math.PI);
    mat4.multiply(this._theMX, this._theMX, mx);
  }

  goBottomView() {
    mat4.fromZRotation(this._theMX, Math.PI / 2.0);
  }

  //  ............................................
  private _getTrackballVector(LAYER_X: number, LAYER_Y: number): vec3 {
    const WIDTH: number = this._SCENE_CONTROLLER.WIDTH;
    const HEIGHT: number = this._SCENE_CONTROLLER.HEIGHT;

    const R = (1.1 * Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT)) / 2.0;

    const Xc = WIDTH / 2.0;
    const Yc = HEIGHT / 2.0;

    const X: number = (LAYER_X - Xc) / R;
    const Y: number = (Yc - LAYER_Y) / R;

    let distanceSquared: number = X * X + Y * Y;
    if (distanceSquared > 1.0) distanceSquared = 1.0;
    const Z: number = Math.sqrt(1.0 - distanceSquared);

    return [X, Y, Z];
  }

  private _rotate(PREV_TRACKBALL_VECTOR: vec3, CURRENT_TRACKBALL_VECTOR: vec3) {
    const MOTION_FACTOR = 3.0;

    var normalVector: vec3 = [0, 0, 0];
    vec3.cross(normalVector, PREV_TRACKBALL_VECTOR, CURRENT_TRACKBALL_VECTOR);
    // vec3.normalize(normalVector, normalVector);  //  No needs nomalize.

    const DOT_PRODUCT = vec3.dot(PREV_TRACKBALL_VECTOR, CURRENT_TRACKBALL_VECTOR);
    if (DOT_PRODUCT >= 0.99999999) return;

    const RADIAN = -6.0 * Math.acos(DOT_PRODUCT); //  Tracball velocity factor = 6.0. Larger is Faster rotation.

    let rotateMX = mat4.create();
    rotateMX = mat4.fromRotation(rotateMX, RADIAN, normalVector);

    mat4.multiply(this._theMX, this._theMX, rotateMX);
  }

  //  ............................................
  //  Returns the view transform
  get matrix() {
    return this._theMX;
  }

  get modelViewMatrix() {
    return mat4.transpose(this._modelViewMX, this._theMX);
  }

  get isTrackBalling() {
    return this._trackBalling;
  }

  ////////////////////////////////////////////////
  onPointerDown(EVENT: PointerEvent) {
    this._trackBalling = true;

    this._x = EVENT.offsetX;
    this._y = EVENT.offsetY;
  }

  onPointerMove(EVENT: PointerEvent) {
    this._lastX = this._x;
    this._lastY = this._y;

    this._x = EVENT.offsetX;
    this._y = EVENT.offsetY;

    if (this._trackBalling === false) return;

    const BUTTONS = EVENT.buttons;
    if ((BUTTONS & 1) !== 1) return;

    const PREV_TRACKBALL_VECTOR = this._getTrackballVector(this._lastX, this._lastY);
    const CURRENT_TRACKBALL_VECTOR = this._getTrackballVector(this._x, this._y);

    this._rotate(PREV_TRACKBALL_VECTOR, CURRENT_TRACKBALL_VECTOR);
  }

  onPointerUp() {
    this._trackBalling = false;
  }
}
