import { Component, input, linkedSignal, output, Pipe, PipeTransform } from '@angular/core';
import { ExtractionInfo } from '../../models';
import { formatDuration, intervalToDuration, isAfter } from 'date-fns';

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
  imports: [ToLocalDatePipe],
  templateUrl: './current-extraction.html',
  styleUrl: './current-extraction.scss',
})
export class CurrentExtraction {
  currentExtraction = input.required<ExtractionInfo>();
  reload = output();

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
}
