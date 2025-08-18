import { TestBed } from '@angular/core/testing';

import { PapiService } from './papi.service';

describe('PapiService', () => {
  let service: PapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
