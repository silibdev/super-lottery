import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WinningChosenNumbers } from './winning-chosen-numbers';

describe('WinningChosenNumbers', () => {
  let component: WinningChosenNumbers;
  let fixture: ComponentFixture<WinningChosenNumbers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WinningChosenNumbers],
    }).compileComponents();

    fixture = TestBed.createComponent(WinningChosenNumbers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
