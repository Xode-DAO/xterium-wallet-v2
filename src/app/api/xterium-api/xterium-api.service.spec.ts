import { TestBed } from '@angular/core/testing';

import { XteriumApiService } from './xterium-api.service';

describe('XteriumApiService', () => {
  let service: XteriumApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XteriumApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
