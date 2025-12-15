import { Component, inject, Pipe, PipeTransform, resource, signal } from '@angular/core';
import { Button, ButtonDirective, ButtonIcon } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { JoinedLotteriesService } from './joined-lotteries.service';
import { AppMessagesService } from '../app-messages/app-messages.service';
import { Dialog } from 'primeng/dialog';
import { FloatLabel } from 'primeng/floatlabel';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { LotteryInfoForParticipant } from '../models';

@Pipe({
  name: 'nextExtractionTime',
  standalone: true,
})
class NextExtractionTimePipe implements PipeTransform {
  transform(lottery: LotteryInfoForParticipant): string {
    const extractionTime = lottery.nextExtraction?.extractionTime;
    if (extractionTime) {
      return new Date(extractionTime).toLocaleString();
    }
    return 'TBD';
  }
}

@Pipe({
  name: 'chosenNumbers',
  standalone: true,
})
class ChosenNumbersTimePipe implements PipeTransform {
  transform(lottery: LotteryInfoForParticipant): string {
    return lottery.chosenNumbers.join(', ');
  }
}

@Component({
  selector: 'app-joined-lotteries',
  imports: [
    Button,
    ProgressSpinner,
    Dialog,
    FloatLabel,
    FormsModule,
    InputText,
    ReactiveFormsModule,
    ChosenNumbersTimePipe,
    Card,
    RouterLink,
    NextExtractionTimePipe,
    ButtonDirective,
    ButtonIcon,
  ],
  templateUrl: './joined-lotteries.html',
  styleUrl: './joined-lotteries.scss',
})
export class JoinedLotteries {
  private joinedLotteriesService = inject(JoinedLotteriesService);
  private appMessagesService = inject(AppMessagesService);

  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/)],
  });

  protected joinLotteryDialogVisible = signal(false);
  protected joinLotteryLoading = signal(false);

  protected readonly lotteries = resource({
    loader: async () => {
      const resp = await this.joinedLotteriesService
        .getJoinedLotteries()
        .catch(this.appMessagesService.showHttpError());
      return resp!.data;
    },
  });

  openJoinLottery() {
    this.joinLotteryDialogVisible.set(true);
    this.nameControl.reset();
  }

  async joinLottery() {
    this.joinLotteryLoading.set(true);
    await this.joinedLotteriesService
      .joinLottery(this.nameControl.value)
      .catch(this.appMessagesService.showHttpError({ dontThrow: true }));
    this.joinLotteryLoading.set(false);
    this.joinLotteryDialogVisible.set(false);
    this.lotteries.reload();
  }
}
