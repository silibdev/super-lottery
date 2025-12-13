import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoHomeButton } from './go-home-button';

describe('GoHomeButton', () => {
  let component: GoHomeButton;
  let fixture: ComponentFixture<GoHomeButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoHomeButton],
    }).compileComponents();

    fixture = TestBed.createComponent(GoHomeButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
