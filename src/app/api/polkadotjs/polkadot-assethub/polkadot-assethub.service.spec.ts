import { TestBed } from '@angular/core/testing';

import { PolkadotAssethubService } from './polkadot-assethub.service';

describe('PolkadotAssethubService', () => {
  let service: PolkadotAssethubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolkadotAssethubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
