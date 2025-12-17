import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareLotteryButton } from './share-lottery-button';

describe('ShareLotteryButton', () => {
  let component: ShareLotteryButton;
  let fixture: ComponentFixture<ShareLotteryButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareLotteryButton],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareLotteryButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
