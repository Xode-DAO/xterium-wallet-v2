import { TestBed } from '@angular/core/testing';

import { XodePaseoService } from './xode-paseo.service';

describe('XodePaseoService', () => {
  let service: XodePaseoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XodePaseoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
