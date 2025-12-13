import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotterySettings } from './lottery-settings';

describe('LotterySettings', () => {
  let component: LotterySettings;
  let fixture: ComponentFixture<LotterySettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotterySettings],
    }).compileComponents();

    fixture = TestBed.createComponent(LotterySettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
