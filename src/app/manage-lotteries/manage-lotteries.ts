import { Component, inject, resource } from '@angular/core';
import { Button } from 'primeng/button';
import { ManageLotteriesService } from './manage-lotteries.service';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Dialog } from 'primeng/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { AppMessagesService } from '../app-messages/app-messages.service';
import { Message } from 'primeng/message';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-manage-lotteries',
  imports: [
    Button,
    Card,
    ProgressSpinner,
    Dialog,
    FloatLabel,
    ReactiveFormsModule,
    InputText,
    Message,
    RouterLink,
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
  protected createLotteryDialogVisible = false;
  protected createNewLotteryLoading = false;

  protected readonly lotteries = resource({
    loader: async () => {
      const resp = await this.manageLotteriesService
        .loadLotteries()
        .catch(this.appMessagesService.showHttpError());
      return resp.data;
    },
  });

  openCreateLottery() {
    this.createLotteryDialogVisible = true;
    this.nameControl.reset();
  }

  async createNewLottery() {
    this.createNewLotteryLoading = true;
    await this.manageLotteriesService
      .createLottery(this.nameControl.value)
      .catch(this.appMessagesService.showHttpError({ dontThrow: true }));
    this.createNewLotteryLoading = false;
    this.createLotteryDialogVisible = false;
    this.lotteries.reload();
  }
}
