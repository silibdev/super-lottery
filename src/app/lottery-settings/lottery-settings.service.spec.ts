import { TestBed } from '@angular/core/testing';

import { LotterySettingsService } from './lottery-settings.service';

describe('LotterySettingsService', () => {
  let service: LotterySettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LotterySettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
