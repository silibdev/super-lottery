import { Component, inject, Pipe, PipeTransform, resource, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ManageLotteriesService } from './manage-lotteries.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Dialog } from 'primeng/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { AppMessagesService } from '../app-messages/app-messages.service';
import { Message } from 'primeng/message';
import { RouterLink } from '@angular/router';
import { LotteryInfo } from '../models';
import { Card } from 'primeng/card';

@Pipe({
  name: 'lastExtractionTime',
  standalone: true,
})
class LastExtractionTimePipe implements PipeTransform {
  transform(lottery: LotteryInfo): string {
    const lastExtractionTime = lottery.previousExtractions
      .sort((a, b) => a.extractionTime.localeCompare(b.extractionTime))
      .pop()?.extractionTime;
    return lastExtractionTime ? new Date(lastExtractionTime).toLocaleString() : '';
  }
}

@Pipe({
  name: 'nextExtractionTime',
  standalone: true,
})
class NextExtractionTimePipe implements PipeTransform {
  transform(lottery: LotteryInfo): string {
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
class CountExtractionsPipe implements PipeTransform {
  transform(lottery: LotteryInfo): number {
    return lottery.previousExtractions.length;
  }
}

@Component({
  selector: 'app-manage-lotteries',
  imports: [
    Button,
    ProgressSpinner,
    Dialog,
    FloatLabel,
    ReactiveFormsModule,
    InputText,
    Message,
    RouterLink,
    Card,
    CountExtractionsPipe,
    LastExtractionTimePipe,
    NextExtractionTimePipe,
  ],
  templateUrl: './manage-lotteries.html',
  styleUrl: './manage-lotteries.scss',
})
export class ManageLotteries {
  private manageLotteriesService = inject(ManageLotteriesService);
  private appMessagesService = inject(AppMessagesService);
  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/)],
  });
  protected createLotteryDialogVisible = signal(false);
  protected createNewLotteryLoading = signal(false);

  protected readonly lotteries = resource({
    loader: async () => {
      const resp = await this.manageLotteriesService
        .loadLotteries()
        .catch(this.appMessagesService.showHttpError());
      return resp!.data;
    },
  });

  openCreateLottery() {
    this.createLotteryDialogVisible.set(true);
    this.nameControl.reset();
  }

  async createNewLottery() {
    this.createNewLotteryLoading.set(true);
    await this.manageLotteriesService
      .createLottery(this.nameControl.value)
      .catch(this.appMessagesService.showHttpError({ dontThrow: true }));
    this.createNewLotteryLoading.set(false);
    this.createLotteryDialogVisible.set(false);
    this.lotteries.reload();
  }
}
