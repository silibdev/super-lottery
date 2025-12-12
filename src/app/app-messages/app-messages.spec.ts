import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMessages } from './app-messages';

describe('AppMessages', () => {
  let component: AppMessages;
  let fixture: ComponentFixture<AppMessages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppMessages],
    }).compileComponents();

    fixture = TestBed.createComponent(AppMessages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
