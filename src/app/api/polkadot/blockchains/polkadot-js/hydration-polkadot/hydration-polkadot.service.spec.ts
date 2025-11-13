import { TestBed } from '@angular/core/testing';

import { HydrationPolkadotService } from './hydration-polkadot.service';

describe('HydrationPolkadotService', () => {
  let service: HydrationPolkadotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HydrationPolkadotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
