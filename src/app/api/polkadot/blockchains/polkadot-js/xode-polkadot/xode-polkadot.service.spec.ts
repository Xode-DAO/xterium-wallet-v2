import { TestBed } from '@angular/core/testing';

import { XodePolkadotService } from './xode-polkadot.service';

describe('XodePolkadotService', () => {
  let service: XodePolkadotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XodePolkadotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
