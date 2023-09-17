import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { FormsModule } from "@angular/forms";

import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSliderModule } from "@angular/material/slider";

import { APP_BASE_HREF } from "@angular/common";

import { DragDropModule } from "@angular/cdk/drag-drop";
import { AppComponent } from "./app.component";
import { VerticalSliderComponent } from "./comp/vertical-slider/vertical-slider.component";
import { OrthoStepSliderComponent } from './comp/ortho-step-slider/ortho-step-slider.component';

@NgModule({
  declarations: [AppComponent, VerticalSliderComponent, OrthoStepSliderComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    MatToolbarModule,
    MatSliderModule,
    MatIconModule,
    MatButtonModule,
    DragDropModule,
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: "/home",
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
