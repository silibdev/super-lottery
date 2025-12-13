import { Component, input, Pipe, PipeTransform } from '@angular/core';
import { Card } from 'primeng/card';
import { LotteryInfo, LotteryInfoForParticipant } from '../models';

@Pipe({
  name: 'lastExtractionTime',
  standalone: true,
})
export class LastExtractionTimePipe implements PipeTransform {
  transform(lottery: LotteryInfo | LotteryInfoForParticipant): string {
    let lastExtractionTime: string | undefined;
    if ('previousExtractions' in lottery) {
      lastExtractionTime = lottery.previousExtractions
        .sort((a, b) => a.extractionTime.localeCompare(b.extractionTime))
        .pop()?.extractionTime;
    }
    return lastExtractionTime ? new Date(lastExtractionTime).toLocaleString() : '';
  }
}

@Pipe({
  name: 'nextExtractionTime',
  standalone: true,
})
export class NextExtractionTimePipe implements PipeTransform {
  transform(lottery: LotteryInfo | LotteryInfoForParticipant): string {
    const extractionTime = lottery.nextExtraction?.extractionTime;
    if (extractionTime) {
      return new Date(extractionTime).toLocaleString();
    }
    return '';
  }
}

@Pipe({
  name: 'countExtractions',
  standalone: true,
})
export class CountExtractionsPipe implements PipeTransform {
  transform(lottery: LotteryInfo | LotteryInfoForParticipant): string {
    if ('previousExtractions' in lottery) return '#' + lottery.previousExtractions.length;
    return '';
  }
}

@Component({
  selector: 'app-lottery-card',
  imports: [Card, CountExtractionsPipe, LastExtractionTimePipe, NextExtractionTimePipe],
  templateUrl: './lottery-card.html',
  styleUrl: './lottery-card.scss',
})
export class LotteryCard {
  lottery = input.required<LotteryInfo | LotteryInfoForParticipant>();
}
