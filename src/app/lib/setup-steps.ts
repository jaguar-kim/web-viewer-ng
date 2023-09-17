import { SetupToothTrans } from "./setup-tooth-trans";

export class SetupSteps {
  private _selectedStepIndex: number = -1;

  private _steps: Array<any> = [];

  //  ............................................
  constructor(STEPS_TABLE: any) {
    this._selectedStepIndex = -1;
    this._steps = [];

    if (STEPS_TABLE === undefined) return;

    const STEPS = STEPS_TABLE.StepToothPos;
    if (STEPS === undefined) return;
    if (typeof STEPS !== "object") return;
    if (STEPS.length <= 0) return;

    this._steps = [];

    for (const STEP of STEPS) {
      const STEP_INDEX = STEP.StepIndex;
      if (STEP_INDEX === undefined) continue;

      const TOOTH_POSITIONS = STEP.StepToothPos;
      if (TOOTH_POSITIONS === undefined) continue;

      if (this._steps[STEP_INDEX] === undefined) this._steps[STEP_INDEX] = {};
      for (const TOOTH_POSITION of TOOTH_POSITIONS) {
        const {
          ToothNum: TOOTH_ID,
          Rot_w: Rw,
          Rot_x: Rx,
          Rot_y: Ry,
          Rot_z: Rz,
          Trans_x: Dx,
          Trans_y: Dy,
          Trans_z: Dz,
        } = TOOTH_POSITION;

        this._steps[STEP_INDEX][`T${TOOTH_ID}`] = new SetupToothTrans(Rw, Rx, Ry, Rz, Dx, Dy, Dz);
      }
    }

    if (this._steps.length > 0) this._selectedStepIndex = 0;
  }

  //  ............................................
  get stepCount(): number {
    if (this._steps === undefined) return 0;
    return this._steps.length;
  }

  get selectedStepIndex(): number {
    if (this._steps === undefined) return -1;
    return this._selectedStepIndex;
  }

  set selectedStepIndex(INDEX: number) {
    if (this._steps === undefined) return;
    const COUNT = this.stepCount;
    if (COUNT === 0) return;

    this._selectedStepIndex = INDEX;
  }

  get selectedStep() {
    if (this.stepCount === 0) return undefined;
    if (this.selectedStepIndex === -1) return undefined;

    return this._steps[this.selectedStepIndex];
  }

  //  ............................................
  setNextStep() {
    if (this._steps === undefined) return false;
    const COUNT = this.stepCount;
    if (COUNT === 0) return false;

    this._selectedStepIndex++;
    if (this._selectedStepIndex >= COUNT) this._selectedStepIndex = 0;

    return true;
  }

  setPrevStep() {
    if (this._steps === undefined) return false;
    const COUNT = this.stepCount;
    if (COUNT === 0) return false;

    this._selectedStepIndex--;
    if (this._selectedStepIndex < 0) this._selectedStepIndex = COUNT - 1;

    return true;
  }
}
