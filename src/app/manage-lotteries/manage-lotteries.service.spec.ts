import { TestBed } from '@angular/core/testing';

import { ManageLotteriesService } from './manage-lotteries.service';

describe('ManageLotteriesService', () => {
  let service: ManageLotteriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageLotteriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
