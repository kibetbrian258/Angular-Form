import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceAvailabilityManagementComponent } from './service-availability-management.component';

describe('ServiceAvailabilityManagementComponent', () => {
  let component: ServiceAvailabilityManagementComponent;
  let fixture: ComponentFixture<ServiceAvailabilityManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceAvailabilityManagementComponent]
    });
    fixture = TestBed.createComponent(ServiceAvailabilityManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
