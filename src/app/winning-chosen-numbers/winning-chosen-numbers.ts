import { Component, computed, input } from '@angular/core';
import { ExtractionInfo } from '../models';
import { Badge } from 'primeng/badge';

@Component({
  selector: 'app-winning-chosen-numbers',
  imports: [Badge],
  templateUrl: './winning-chosen-numbers.html',
  styleUrl: './winning-chosen-numbers.scss',
})
export class WinningChosenNumbers {
  extraction = input.required<Pick<ExtractionInfo, 'winningNumbers' | 'chosenNumbers'>>();

  protected chosenNumbersMap = computed<Record<number, boolean>>(() => {
    const chosenNumbers = this.extraction().chosenNumbers || [];
    return chosenNumbers.reduce((acc, num) => ({ ...acc, [num]: true }), {});
  });

  protected winningNumbersMap = computed<Record<number, boolean>>(() => {
    const winningNumbers = this.extraction().winningNumbers || [];
    return winningNumbers.reduce((acc, num) => ({ ...acc, [num]: true }), {});
  });
}
