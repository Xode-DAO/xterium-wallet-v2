import { TestBed } from '@angular/core/testing';

import { ExtrinsicMappingService } from './extrinsic-mapping.service';

describe('ExtrinsicMappingService', () => {
  let service: ExtrinsicMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtrinsicMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
