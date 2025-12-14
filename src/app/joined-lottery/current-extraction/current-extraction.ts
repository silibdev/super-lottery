import { Component, computed, input, linkedSignal, output, Pipe, PipeTransform, signal } from '@angular/core';
import { ExtractionInfo } from '../../models';
import { formatDuration, intervalToDuration, isAfter } from 'date-fns';
import { Button } from 'primeng/button';

@Pipe({
  name: 'toLocalDate',
  standalone: true,
})
export class ToLocalDatePipe implements PipeTransform {
  transform(date: string): string {
    return new Date(date).toLocaleString();
  }
}

@Component({
  selector: 'app-current-extraction',
  imports: [ToLocalDatePipe, Button],
  templateUrl: './current-extraction.html',
  styleUrl: './current-extraction.scss',
})
export class CurrentExtraction {
  currentExtraction = input.required<ExtractionInfo>();
  reload = output();

  protected winningNumbersMap = computed<Record<number, boolean>>(() => {
    const winningNumbers = this.currentExtraction().winningNumbers || [];
    return winningNumbers.reduce((acc, num) => ({ ...acc, [num]: true }), {});
  });

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
  protected skipAnimation = false;
}
