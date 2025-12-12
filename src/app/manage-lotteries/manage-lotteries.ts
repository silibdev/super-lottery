import { Component, inject, resource, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ManageLotteriesService } from './manage-lotteries.service';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Dialog } from 'primeng/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-manage-lotteries',
  imports: [
    Button,
    Card,
    ProgressSpinner,
    Dialog,
    FloatLabel,
    ReactiveFormsModule,
    InputText
  ],
  templateUrl: './manage-lotteries.html',
  styleUrl: './manage-lotteries.scss'
})
export class ManageLotteries {
  private manageLotteriesService = inject(ManageLotteriesService);
  protected readonly nameControl = new FormControl('', {nonNullable: true, validators: Validators.required});
  protected createLotteryDialogVisible = signal(false);

  protected readonly lotteries = resource({
    loader: async () => {
      const resp = await this.manageLotteriesService.loadLotteries();
      return resp.data;
    }
  });

  openCreateLottery() {
    this.createLotteryDialogVisible.set(true);
    this.nameControl.reset();
  }

  async createNewLottery() {
    await this.manageLotteriesService.createLottery(this.nameControl.value);
    this.createLotteryDialogVisible.set(false);
    this.lotteries.reload();
  }
}
