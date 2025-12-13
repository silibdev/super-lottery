import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinedLottery } from './joined-lottery';

describe('JoinedLottery', () => {
  let component: JoinedLottery;
  let fixture: ComponentFixture<JoinedLottery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinedLottery],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinedLottery);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
