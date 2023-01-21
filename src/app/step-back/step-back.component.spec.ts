import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepBackComponent } from './step-back.component';

describe('StepBackComponent', () => {
  let component: StepBackComponent;
  let fixture: ComponentFixture<StepBackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StepBackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StepBackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
