import { Injectable } from '@angular/core';
import { delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ManageLotteriesService {
  loadLotteries() {
    return of([
        {
          name: 'Lottery 1',
          participants: 100,
          extractions: 2,
          lastExtraction: '2021-01-01 12:00:00'
        }
      ]
    ).pipe(
      delay(3000)
    )
  }
}
