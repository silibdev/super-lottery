import { Component, inject, resource, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ManageLotteriesService } from './manage-lotteries.service';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Dialog } from 'primeng/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { AppMessagesService } from '../app-messages/app-messages.service';

@Component({
  selector: 'app-manage-lotteries',
  imports: [Button, Card, ProgressSpinner, Dialog, FloatLabel, ReactiveFormsModule, InputText],
  templateUrl: './manage-lotteries.html',
  styleUrl: './manage-lotteries.scss',
})
export class ManageLotteries {
  private manageLotteriesService = inject(ManageLotteriesService);
  private appMessagesService = inject(AppMessagesService);
  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  protected createLotteryDialogVisible = signal(false);

  protected readonly lotteries = resource({
    loader: async () => {
      const resp = await this.manageLotteriesService
        .loadLotteries()
        .catch(this.appMessagesService.showHttpError());
      return resp.data;
    },
  });
  protected createNewLotteryLoading = signal(false);

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
