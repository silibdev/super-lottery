import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotteryCard } from './lottery-card';

describe('LotteryCard', () => {
  let component: LotteryCard;
  let fixture: ComponentFixture<LotteryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotteryCard],
    }).compileComponents();

    fixture = TestBed.createComponent(LotteryCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
