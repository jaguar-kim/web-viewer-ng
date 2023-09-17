import { E_APP_STATUS } from "../app-status";

export class SceneController {
  //  ............................................
  private _CANVAS: HTMLCanvasElement;

  private _PAN_X: number;
  private _PAN_Y: number;
  private _SIZE: number;

  //  ............................................
  private _panning: boolean = false;
  private _zooming: boolean = false;

  private _x: number = 0;
  private _y: number = 0;
  private _lastX: number = 0;
  private _lastY: number = 0;

  //  ........................
  private _panX: number = 0.0;
  private _panY: number = 0.0;
  private _zoomScale: number = 1.0;

  //  ............................................
  constructor(CANVAS: HTMLCanvasElement, PAN_X: number, PAN_Y: number, SIZE: number) {
    this._CANVAS = CANVAS;

    this._PAN_X = PAN_X;
    this._PAN_Y = PAN_Y;
    this._SIZE = SIZE;

    //  ......................
    this._panning = false;
    this._zooming = false;

    this._x = 0;
    this._y = 0;
    this._lastX = 0;
    this._lastY = 0;

    this.reset();
  }

  reset() {
    this._zoomScale = 1.0;
    this._panX = this._PAN_X;
    this._panY = this._PAN_Y;
  }

  //  ............................................
  get CANVAS(): HTMLCanvasElement {
    return this._CANVAS;
  }

  get isPanning() {
    return this._panning;
  }

  get isZooming() {
    return this._zooming;
  }

  get WIDTH() {
    return this._CANVAS.width;
  }

  get HEIGHT() {
    return this._CANVAS.height;
  }

  //  ............................................
  set zoomScale(ZOOM_SCALE: number) {
    if (ZOOM_SCALE <= 0.0) return;
    if (ZOOM_SCALE > 40.0) return; //  Too large for Zoom in
    if (ZOOM_SCALE < 0.025) return; //  Too small for Zoom out

    const OLD_ZOOM_SCALE = this._zoomScale;

    this._zoomScale = ZOOM_SCALE;
    this._panX *= ZOOM_SCALE / OLD_ZOOM_SCALE;
    this._panY *= ZOOM_SCALE / OLD_ZOOM_SCALE;
  }

  //  ........................
  zoom(RATIO: number) {
    if (RATIO <= 0.0) return;
    if (RATIO > 1.0 && this._zoomScale > 40.0) return; //  Too large for Zoom in
    if (RATIO < 1.0 && this._zoomScale < 0.025) return; //  Too small for Zoom out

    this._zoomScale *= RATIO;
    this._panX *= RATIO;
    this._panY *= RATIO;
  }

  pan(DX: number, DY: number) {
    this._panX += DX;
    this._panY += DY;
  }

  //  ............................................
  private get _aspectRatioOfViewport() {
    const WIDTH = this._CANVAS.width;
    const HEIGHT = this._CANVAS.height;

    if (WIDTH > HEIGHT) {
      return [HEIGHT == 0.0 ? 1.0 : WIDTH / HEIGHT, 1.0];
    } else {
      return [1.0, WIDTH == 0.0 ? 1.0 : HEIGHT / WIDTH];
    }
  }

  get bgViewRectangle() {
    const [RX, RY] = this._aspectRatioOfViewport;

    const HALF_WIDTH = this._SIZE * RX;
    const HALF_HEIGHT = this._SIZE * RY;

    return {
      half_width: HALF_WIDTH,
      half_height: HALF_HEIGHT,
    };
  }

  get viewRectangle() {
    const [RX, RY] = this._aspectRatioOfViewport;

    const LEFT = (-this._SIZE * RX) / this._zoomScale - this._panX;
    const RIGHT = (this._SIZE * RX) / this._zoomScale - this._panX;
    const TOP = (this._SIZE * RY) / this._zoomScale - this._panY;
    const BOTTOM = (-this._SIZE * RY) / this._zoomScale - this._panY;

    return {
      left: LEFT,
      right: RIGHT,
      top: TOP,
      bottom: BOTTOM,
    };
  }

  getGL2DCoords(LAYER_X: number, LAYER_Y: number) {
    const HEIGHT = this._CANVAS.height;

    return {
      x: LAYER_X,
      y: HEIGHT - LAYER_Y,
    };
  }

  getPositionFromDevicePosition(LAYER_X: number, LAYER_Y: number) {
    const WIDTH = this._CANVAS.width;
    const HEIGHT = this._CANVAS.height;

    const { x, y } = this.getGL2DCoords(LAYER_X, LAYER_Y);

    const VIEW_RECTANGLE = this.viewRectangle;

    const Xout = (x / WIDTH) * (VIEW_RECTANGLE.right - VIEW_RECTANGLE.left) + VIEW_RECTANGLE.left;
    const Yout = (y / HEIGHT) * (VIEW_RECTANGLE.top - VIEW_RECTANGLE.bottom) + VIEW_RECTANGLE.bottom;

    return { x: Xout, y: Yout, z: 0.0 };
  }

  //  ............................................
  //  Pointer events for Panning.
  onPointerDownForPanning() {
    this._panning = true;
  }

  onPointerMoveForPanning(EVENT: any) {
    if (this._panning === false) return;

    const BUTTONS = EVENT.buttons;
    if ((BUTTONS & 1) !== 1) return;

    const POSITION_ON_PLANE_LAST = this.getPositionFromDevicePosition(this._lastX, this._lastY);
    const POSITION_ON_PLANE_MOUSE_MOVE = this.getPositionFromDevicePosition(this._x, this._y);

    const DX = POSITION_ON_PLANE_MOUSE_MOVE.x - POSITION_ON_PLANE_LAST.x;
    const DY = POSITION_ON_PLANE_MOUSE_MOVE.y - POSITION_ON_PLANE_LAST.y;

    this.pan(DX, DY);
  }

  onPointerUpForPanning() {
    this._panning = false;
  }

  //  ............................................
  //  Pointer events for Zooming.
  onPointerDownForZooming() {
    this._zooming = true;
  }

  onPointerMoveForZooming(EVENT: any) {
    if (this._zooming === false) return;

    const DY = this._y - this._lastY;

    const BUTTONS = EVENT.buttons;
    if ((BUTTONS & 1) !== 1) return;

    const UNIT_ZOOM_RATIO = 1.012;
    let zoomRatio = 1.0;

    if (DY < 0) zoomRatio = Math.pow(UNIT_ZOOM_RATIO, Math.abs(DY));
    else if (DY > 0) zoomRatio = Math.pow(1.0 / UNIT_ZOOM_RATIO, DY);

    this.zoom(zoomRatio);
  }

  onPointerUpForZooming() {
    this._zooming = false;
  }

  ////////////////////////////////////////////////
  //  Pointer events.
  onPointerDown(APP_STATUS: E_APP_STATUS, EVENT: PointerEvent) {
    this._x = EVENT.offsetX;
    this._y = EVENT.offsetY;

    switch (APP_STATUS) {
      case E_APP_STATUS.PAN:
        this.onPointerDownForPanning();
        break;
      // case E_APP_STATUS.ZOOM:
      //   this.onPointerDownForZooming();
      //   break;
    }
  }

  onPointerMove(APP_STATUS: E_APP_STATUS, EVENT: PointerEvent) {
    this._lastX = this._x;
    this._lastY = this._y;

    this._x = EVENT.offsetX;
    this._y = EVENT.offsetY;

    switch (APP_STATUS) {
      case E_APP_STATUS.PAN:
        this.onPointerMoveForPanning(EVENT);
        break;
      // case E_APP_STATUS.ZOOM:
      //   this.onPointerMoveForZooming(EVENT);
      //   break;
    }
  }

  onPointerUp(APP_STATUS: E_APP_STATUS) {
    switch (APP_STATUS) {
      case E_APP_STATUS.PAN:
        this.onPointerUpForPanning();
        break;
      // case E_APP_STATUS.ZOOM:
      //   this.onPointerUpForZooming();
      //   break;
    }
  }
}
