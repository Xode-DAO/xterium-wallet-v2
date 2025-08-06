import { TestBed } from '@angular/core/testing';

import { MultipayxService } from './multipayx.service';

describe('MultipayxService', () => {
  let service: MultipayxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultipayxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
