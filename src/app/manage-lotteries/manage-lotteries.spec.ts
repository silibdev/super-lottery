import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLotteries } from './manage-lotteries';

describe('ManageLotteries', () => {
  let component: ManageLotteries;
  let fixture: ComponentFixture<ManageLotteries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageLotteries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageLotteries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
