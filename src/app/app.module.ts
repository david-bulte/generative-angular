import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CircleComponent } from './circle/circle.component';
import { StepBackComponent } from './step-back/step-back.component';
import { RectComponent } from './rect/rect.component';
import { RosettaComponent } from './rosetta/rosetta.component';

@NgModule({
  declarations: [AppComponent, CircleComponent, StepBackComponent, RectComponent, RosettaComponent],
  imports: [BrowserModule, ReactiveFormsModule],
  bootstrap: [RosettaComponent],
})
export class AppModule {}
