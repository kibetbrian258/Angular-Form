import { TestBed } from '@angular/core/testing';

import { ServiceAvailabilityService } from './service-availability.service';

describe('ServiceAvailabilityService', () => {
  let service: ServiceAvailabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceAvailabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
