import { TestBed } from '@angular/core/testing';

import { MultipayxApiService } from './multipayx-api.service';

describe('MultipayxApiService', () => {
  let service: MultipayxApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultipayxApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
