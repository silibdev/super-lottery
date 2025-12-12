import { Component, inject, resource } from '@angular/core';
import { Button } from 'primeng/button';
import { ManageLotteriesService } from './manage-lotteries.service';
import { lastValueFrom } from 'rxjs';
import { Card } from 'primeng/card';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-manage-lotteries',
  imports: [
    Button,
    Card,
    ProgressSpinner
  ],
  templateUrl: './manage-lotteries.html',
  styleUrl: './manage-lotteries.scss'
})
export class ManageLotteries {
  private manageLotteriesService = inject(ManageLotteriesService);

  protected readonly lotteries = resource({
    loader: () => lastValueFrom(this.manageLotteriesService.loadLotteries())
  });

  createNewLottery() {
    console.log('Create new lottery');
  }
}
