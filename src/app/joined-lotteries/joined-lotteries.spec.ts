import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinedLotteries } from './joined-lotteries';

describe('JoinedLotteries', () => {
  let component: JoinedLotteries;
  let fixture: ComponentFixture<JoinedLotteries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinedLotteries],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinedLotteries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
