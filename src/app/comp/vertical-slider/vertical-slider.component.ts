import { CdkDragEnd, CdkDragMove } from "@angular/cdk/drag-drop";
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconRegistry, MatIconModule } from "@angular/material/icon";
import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "vertical-slider",
  templateUrl: "./vertical-slider.component.html",
  styleUrls: ["./vertical-slider.component.css"],
})
export class VerticalSliderComponent {
  ICON_ZOOM_IN: string = `\
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect y="7.5" width="20" height="5" fill="white"/>
    <rect x="12.5" width="20" height="5" transform="rotate(90 12.5 0)" fill="white"/>
  </svg>`;

  ICON_ZOOM_OUT: string = `\
  <svg width="20" height="5" viewBox="0 0 20 5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="5" fill="white"/>
  </svg>`;

  //  ........................
  private _FULL_HEIGHT = 242;

  //  ........................
  isZoomingIn = false;
  isZoomingOut = false;

  //  ........................
  @Input("zoom-steps-count") zoomStepsCount: number = 10;

  dragPosition;

  private _currentStep: number;

  @Output("current-step") eventCurrentStep = new EventEmitter<number>();

  //  ........................
  get halfLength(): number {
    return this._FULL_HEIGHT / 2;
  }

  resetCurrentStep() {
    this._currentStep = 0;
    const Y = this._stepToPosition(0);
    this.dragPosition = { x: 0, y: Y };
  }

  //  ............................................
  private _positionToStep(position: number): number {
    const HALF_LENGTH = this._FULL_HEIGHT;
    if (position < 0) position = 0;

    const STEP = Math.round((2 * (this.zoomStepsCount * position)) / this._FULL_HEIGHT) - this.zoomStepsCount;

    return -STEP;
  }

  private _stepToPosition(step: number): number {
    const STEP = step + this.zoomStepsCount;
    const POSITION = (STEP * this._FULL_HEIGHT) / (2 * this.zoomStepsCount);
    return this._FULL_HEIGHT - POSITION;
  }

  //  ............................................
  constructor(public iconRegistry: MatIconRegistry, private sanitizer: DomSanitizer) {
    iconRegistry.addSvgIconLiteral("zoom-in", sanitizer.bypassSecurityTrustHtml(this.ICON_ZOOM_IN));
    iconRegistry.addSvgIconLiteral("zoom-out", sanitizer.bypassSecurityTrustHtml(this.ICON_ZOOM_OUT));

    this._currentStep = 0;
    this.dragPosition = { x: 0, y: this.halfLength };
  }

  ////////////////////////////////////////////////
  //  ........................
  onDragMoved(EVENT: CdkDragMove<any>) {
    const DRAG_POSITION = EVENT.source.getFreeDragPosition();
    const Y: number = DRAG_POSITION.y;

    const CURRENT_STEP = this._positionToStep(DRAG_POSITION.y);
    const Y2: number = this._stepToPosition(CURRENT_STEP);

    if (this._currentStep !== CURRENT_STEP) {
      this._currentStep = CURRENT_STEP;
      this.eventCurrentStep.emit(this._currentStep);
    }
  }

  onDragEnded(EVENT: CdkDragEnd<any>) {
    const DRAG_POSITION = EVENT.source.getFreeDragPosition();
    const Y: number = DRAG_POSITION.y;

    const CURRENT_STEP = this._positionToStep(DRAG_POSITION.y);
    const Y2: number = this._stepToPosition(CURRENT_STEP);

    this._currentStep = CURRENT_STEP;
    this.dragPosition = { x: 0, y: Y2 };
  }

  //  ........................
  onClickZoomIn(EVENT: MouseEvent): void {
    if (this._currentStep >= this.zoomStepsCount) return;
    this._currentStep += 1;
    this.eventCurrentStep.emit(this._currentStep);

    const NEW_Y: number = this._stepToPosition(this._currentStep);
    this.dragPosition = { x: 0, y: NEW_Y };
  }

  onClickZoomOut(EVENT: MouseEvent): void {
    if (this._currentStep <= -this.zoomStepsCount) return;
    this._currentStep -= 1;
    this.eventCurrentStep.emit(this._currentStep);

    const NEW_Y: number = this._stepToPosition(this._currentStep);
    this.dragPosition = { x: 0, y: NEW_Y };
  }
}
