import { TestBed } from '@angular/core/testing';

import { NetworkMetadataService } from './network-metadata.service';

describe('NetworkMetadataService', () => {
  let service: NetworkMetadataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkMetadataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
