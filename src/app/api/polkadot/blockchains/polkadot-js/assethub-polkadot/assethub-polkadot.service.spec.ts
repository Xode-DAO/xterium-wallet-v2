import { TestBed } from '@angular/core/testing';

import { AssethubPolkadotService } from './assethub-polkadot.service';

describe('AssethubPolkadotService', () => {
  let service: AssethubPolkadotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssethubPolkadotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
