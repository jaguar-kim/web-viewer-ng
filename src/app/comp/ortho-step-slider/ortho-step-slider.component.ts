import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "ortho-step-slider",
  templateUrl: "./ortho-step-slider.component.html",
  styleUrls: ["./ortho-step-slider.component.css"],
})
export class OrthoStepSliderComponent {
  @Input("step-count") stepCount: number = 10;

  @Input("selected-step-index") selectedStepIndex: number = 0;

  @Output("current-step") currentStepEmitter = new EventEmitter<number>();

  //  ............................................
  get n(): number {
    return this.stepCount;
  }

  get labelArray(): Array<number> {
    let theArray = new Array<number>();

    for (let i = 2; i <= this.stepCount; i++) {
      theArray.push(i);
    }

    return theArray;
  }

  //  ............................................
  onStepChange(NEW_STEP: any) {
    this.currentStepEmitter.emit(NEW_STEP);
  }
}
