import { TestBed } from '@angular/core/testing';

import { PolarisService } from './polaris.service';

describe('PolarisService', () => {
  let service: PolarisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolarisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
