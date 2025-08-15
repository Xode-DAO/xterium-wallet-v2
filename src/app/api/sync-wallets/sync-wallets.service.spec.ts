import { TestBed } from '@angular/core/testing';

import { SyncWalletsService } from './sync-wallets.service';

describe('SyncWalletsService', () => {
  let service: SyncWalletsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncWalletsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
