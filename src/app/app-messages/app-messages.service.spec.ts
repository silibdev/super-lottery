import { TestBed } from '@angular/core/testing';

import { AppMessagesService } from './app-messages.service';

describe('AppMessagesService', () => {
  let service: AppMessagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppMessagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
