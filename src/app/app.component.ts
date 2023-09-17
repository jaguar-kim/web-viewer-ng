import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconRegistry, MatIconModule } from "@angular/material/icon";
import { GlViewerService } from "./services/gl-viewer.service";
import { E_APP_STATUS } from "./lib/app-status";
import * as SVGS from "./lib/svgs";
import { VerticalSliderComponent } from "./comp/vertical-slider/vertical-slider.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  private _pathOfSelectedModel: string = "The default path.";

  _appStatus: E_APP_STATUS = E_APP_STATUS.TRACK_BALL;

  selectedStepIndex: number = 1;

  //  ............................................
  @ViewChild("sceneCanvas") private canvas: any;

  //  ............................................
  get totalStepCount(): number {
    return this.glViewerService.stepCount;
  }

  get isTrackBallMode(): boolean {
    return this._appStatus === E_APP_STATUS.TRACK_BALL;
  }

  get isPanMode(): boolean {
    return this._appStatus === E_APP_STATUS.PAN;
  }

  //  ............................................
  public get pathOfSelectedModel(): string {
    return this._pathOfSelectedModel;
  }

  //  ............................................
  autoResizeCanvas(canvas: any, MARGIN_X: number, MARGIN_Y: number) {
    const expandFullScreen = () => {
      canvas.width = window.innerWidth - MARGIN_X;
      canvas.height = window.innerHeight - MARGIN_Y;
    };

    expandFullScreen();

    window.addEventListener("resize", expandFullScreen); //  Resize screen when the browser has triggered the resize event
  }

  //  ............................................
  constructor(
    private refElement: ElementRef,
    public glViewerService: GlViewerService,
    public iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {
    this._pathOfSelectedModel = this.refElement.nativeElement.getAttribute("pathSelectedModel");
    console.log(this._pathOfSelectedModel);

    //  ......................
    // iconRegistry.addSvgIconLiteral("zoom-plus", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_PLUS));
    // iconRegistry.addSvgIconLiteral("zoom-minus", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_MINUS));

    iconRegistry.addSvgIconLiteral("pan-mode", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_PAN_MODE));
    iconRegistry.addSvgIconLiteral(
      "pan-mode-active",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_PAN_MODE_ACTIVE)
    );
    iconRegistry.addSvgIconLiteral(
      "track-ball-mode",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_TRACK_BALL_MODE)
    );
    iconRegistry.addSvgIconLiteral(
      "track-ball-mode-active",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_TRACK_BALL_MODE_ACTIVE)
    );

    iconRegistry.addSvgIconLiteral(
      "view-right-both",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_RIGHT_BOTH)
    );
    iconRegistry.addSvgIconLiteral(
      "view-front-both",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_FRONT_BOTH)
    );
    iconRegistry.addSvgIconLiteral(
      "view-left-both",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_LEFT_BOTH)
    );
    iconRegistry.addSvgIconLiteral(
      "view-rear-both",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_REAR_BOTH)
    );
    iconRegistry.addSvgIconLiteral("view-top-maxi", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_TOP_MAXI));
    iconRegistry.addSvgIconLiteral(
      "view-bottom-mand",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_BOTTON_MAND)
    );
    iconRegistry.addSvgIconLiteral(
      "view-front-maxi",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_FRONT_MAXI)
    );
    iconRegistry.addSvgIconLiteral(
      "view-front-mand",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_FRONT_MAND)
    );

    iconRegistry.addSvgIconLiteral("view-home", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_VIEW_HOME));

    iconRegistry.addSvgIconLiteral("go-first-step", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_GO_FIRST_STEP));
    iconRegistry.addSvgIconLiteral(
      "go-previous-step",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_GO_PREVIOUS_STEP)
    );
    iconRegistry.addSvgIconLiteral(
      "start-animation",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_START_ANIMATION)
    );
    iconRegistry.addSvgIconLiteral(
      "stop-animation",
      sanitizer.bypassSecurityTrustHtml(SVGS.ICON_STOP_ANIMATION)
    );
    iconRegistry.addSvgIconLiteral("go-next-step", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_GO_NEXT_STEP));
    iconRegistry.addSvgIconLiteral("go-last-step", sanitizer.bypassSecurityTrustHtml(SVGS.ICON_GO_LAST_STEP));
  }

  //  ............................................
  ngAfterViewInit(): void {
    if (!this.canvas) {
      alert("canvas not supplied cannot bind WebGL context !");
      return;
    }

    this.autoResizeCanvas(this.canvas.nativeElement, 0, 139); //  0, 140

    const CANVAS: HTMLCanvasElement = this.canvas.nativeElement;
    this.glViewerService.initialize(CANVAS);

    //  ......................
    CANVAS.ontouchstart = (event: TouchEvent) => event.preventDefault();

    //  ......................
    window.onresize = (EVENT: UIEvent) => this.glViewerService.render();

    //  ......................
  }

  ngOnInit(): void {}

  ////////////////////////////////////////////////
  onPointerDown(EVENT: PointerEvent) {
    this.glViewerService.onPointerDown(this._appStatus, EVENT);
  }

  onPointerMove(EVENT: PointerEvent) {
    this.glViewerService.onPointerMove(this._appStatus, EVENT);
  }

  onPointerUp(EVENT: PointerEvent) {
    this.glViewerService.onPointerUp(this._appStatus);
  }

  //  ............................................
  onFirstStep() {
    if (this.selectedStepIndex <= 1) return;

    this.selectedStepIndex = 1;
    this.glViewerService.selectedStepIndex = this.selectedStepIndex;
    console.log(`${this.selectedStepIndex} => ${this.glViewerService.selectedStepIndex}`);
  }

  onPreviousStep() {
    this.selectedStepIndex = this.selectedStepIndex > 1 ? this.selectedStepIndex - 1 : this.totalStepCount;

    this.glViewerService.selectedStepIndex = this.selectedStepIndex;
    console.log(`${this.selectedStepIndex} => ${this.glViewerService.selectedStepIndex}`);
  }

  onNextStep() {
    this.selectedStepIndex = this.selectedStepIndex < this.totalStepCount ? this.selectedStepIndex + 1 : 1;

    this.glViewerService.selectedStepIndex = this.selectedStepIndex;
  }

  onLastStep() {
    if (this.selectedStepIndex >= this.totalStepCount) return;

    this.selectedStepIndex = this.totalStepCount;
    this.glViewerService.selectedStepIndex = this.selectedStepIndex;
  }

  isAnimate: boolean = false;

  onStartAnimation() {
    const _nextStep = () => {
      (async () => this.onNextStep())();
      if (this.isAnimate === true) setTimeout(_nextStep, this.glViewerService.isMoving ? 500 : 250);
    };

    this.isAnimate = true;

    setTimeout(_nextStep, 250);
  }

  onStopAnimation() {
    this.isAnimate = false;
  }

  onStepChange(VALUE: number) {
    this.selectedStepIndex = VALUE;
    this.glViewerService.selectedStepIndex = this.selectedStepIndex;
  }

  //  ............................................
  onModeTrackBall() {
    this._appStatus = E_APP_STATUS.TRACK_BALL;
  }

  onModePan() {
    this._appStatus = E_APP_STATUS.PAN;
  }

  //  ........................
  onDirectionHome(verticalSlider: VerticalSliderComponent) {
    this.glViewerService.setHomeDirection();
    verticalSlider.resetCurrentStep();
  }

  onDirectionFront() {
    this.glViewerService.setFrontView();
  }

  onDirectionRight() {
    this.glViewerService.setRightView();
  }

  onDirectionLeft() {
    this.glViewerService.setLeftView();
  }

  onDirectionRear() {
    this.glViewerService.setRearView();
  }

  onTopView() {
    this.glViewerService.setTopView();
  }

  onBottomView() {
    this.glViewerService.setBottomView();
  }

  onUpperHalfView() {
    this.glViewerService.setUpperHalfView();
  }

  onLowerHalfView() {
    this.glViewerService.setLowerHalfView();
  }

  //  ............................................
  onChangeCurrentStep(STEP: any): void {
    this.glViewerService.setZoomRationForStep(STEP);
  }
}
