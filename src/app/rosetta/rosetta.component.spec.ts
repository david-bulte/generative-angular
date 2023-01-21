import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RosettaComponent } from './rosetta.component';

describe('RosettaComponent', () => {
  let component: RosettaComponent;
  let fixture: ComponentFixture<RosettaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RosettaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RosettaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
