import { TestBed } from '@angular/core/testing';

import { JoinedLotteriesService } from './joined-lotteries.service';

describe('JoinedLotteriesService', () => {
  let service: JoinedLotteriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JoinedLotteriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
