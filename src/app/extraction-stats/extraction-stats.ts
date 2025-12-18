import { Component, input, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AppResponse, ParticipantStats } from '../models';
import { Message } from 'primeng/message';
import { Button } from 'primeng/button';
import { ToLocalDateStringPipe } from '../utils';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-extraction-stats',
  imports: [
    Dialog,
    FormsModule,
    ProgressSpinner,
    Message,
    Button,
    ToLocalDateStringPipe,
    ProgressBar,
  ],
  templateUrl: './extraction-stats.html',
  styleUrl: './extraction-stats.scss',
})
export class ExtractionStats {
  extractionTime = input.required<string>();
  lotteryId = input.required<string>();
  smallButton = input<boolean>();
  showDialog = signal(false);

  protected statistics = httpResource<AppResponse<ParticipantStats[]>>(() => {
    if (!this.showDialog()) {
      return;
    }
    const lotteryId = this.lotteryId();
    const extractionTime = this.extractionTime();
    return `/api/lotteries/${lotteryId}/extractions/${btoa(extractionTime)}/stats`;
  });
}
