import { Component, inject, input } from '@angular/core';
import { Button } from 'primeng/button';
import { AppMessagesService } from '../app-messages/app-messages.service';

@Component({
  selector: 'app-share-lottery-button',
  imports: [Button],
  templateUrl: './share-lottery-button.html',
  styleUrl: './share-lottery-button.scss',
})
export class ShareLotteryButton {
  lotteryId = input.required<string>();
  private readonly appMessagesService = inject(AppMessagesService);

  protected async shareLottery() {
    const link = window.location.origin + '/lotteries/joined?lotteryId=' + this.lotteryId();
    // feature detecting navigator.canShare() also implies
    // the same for the navigator.share()
    if (!navigator.clipboard) {
      this.appMessagesService.showMessage({
        type: 'warn',
        description: `Your browser doesn't support the Web Share API. Anyway, here's the link: ${link}`,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      this.appMessagesService.showMessage({
        type: 'success',
        description: 'The link has been copied successfully.',
        life: 2000,
      });
    } catch (error) {
      this.appMessagesService.showMessage({
        type: 'error',
        description: 'Failed to share the link.',
      });
    }
  }
}
