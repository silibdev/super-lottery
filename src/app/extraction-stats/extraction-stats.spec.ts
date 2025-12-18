import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtractionStats } from './extraction-stats';

describe('ExtractionStats', () => {
  let component: ExtractionStats;
  let fixture: ComponentFixture<ExtractionStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtractionStats],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtractionStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
