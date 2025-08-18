import { TestBed } from '@angular/core/testing';

import { PolkadotApiService } from './polkadot-api.service';

describe('PolkadotApiService', () => {
  let service: PolkadotApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolkadotApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
