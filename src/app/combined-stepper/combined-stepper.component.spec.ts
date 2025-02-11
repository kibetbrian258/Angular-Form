import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinedStepperComponent } from './combined-stepper.component';

describe('CombinedStepperComponent', () => {
  let component: CombinedStepperComponent;
  let fixture: ComponentFixture<CombinedStepperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CombinedStepperComponent]
    });
    fixture = TestBed.createComponent(CombinedStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
