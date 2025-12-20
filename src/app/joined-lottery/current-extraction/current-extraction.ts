import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { ExtractionInfo } from '../../models';
import { formatDuration, intervalToDuration, isAfter } from 'date-fns';
import { Button } from 'primeng/button';
import { ExtractionStats } from '../../extraction-stats/extraction-stats';
import { ToLocalDateStringPipe } from '../../utils';
import { Badge } from 'primeng/badge';

@Component({
  selector: 'app-current-extraction',
  imports: [Button, ExtractionStats, ToLocalDateStringPipe, Badge],
  templateUrl: './current-extraction.html',
  styleUrl: './current-extraction.scss',
})
export class CurrentExtraction {
  currentExtraction = input.required<ExtractionInfo>();
  reload = output();

  protected chosenNumbersMap = computed<Record<number, boolean>>(() => {
    const chosenNumbers = this.currentExtraction().chosenNumbers || [];
    return chosenNumbers.reduce((acc, num) => ({ ...acc, [num]: true }), {});
  });

  protected winningNumbersMap = signal<Record<number, boolean>>({});

  private intervalId: number | undefined;
  protected countDown = linkedSignal(() => {
    const extractionTime = this.currentExtraction().extractionTime;
    const extractionDate = new Date(extractionTime);
    const now = new Date();

    if (isAfter(now, extractionDate)) return null;

    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      const newNow = new Date();
      if (isAfter(newNow, extractionDate)) {
        clearInterval(this.intervalId);
        this.reload.emit();
        return;
      }
      this.countDown.set(
        formatDuration(intervalToDuration({ start: newNow, end: extractionDate })),
      );
    }, 1000);

    return formatDuration(intervalToDuration({ start: now, end: extractionDate }));
  });
  protected skipAnimation = linkedSignal(() => !this.currentExtraction().winningNumbers?.length);

  protected handleAnimationStart(number: number, delay: number) {
    setTimeout(
      () =>
        this.winningNumbersMap.update((map) => {
          map[number] = true;
          return { ...map };
        }),
      delay,
    );
  }
}
