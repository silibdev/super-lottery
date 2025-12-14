import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentExtraction } from './current-extraction';

describe('CurrentExtraction', () => {
  let component: CurrentExtraction;
  let fixture: ComponentFixture<CurrentExtraction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentExtraction],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentExtraction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
