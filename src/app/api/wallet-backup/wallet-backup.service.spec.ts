import { TestBed } from '@angular/core/testing';

import { WalletBackupService } from './wallet-backup.service';

describe('WalletBackupService', () => {
  let service: WalletBackupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WalletBackupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
