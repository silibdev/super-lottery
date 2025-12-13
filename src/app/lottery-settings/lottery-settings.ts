import { Component, computed, inject, resource } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LotterySettingsService } from './lottery-settings.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import { AppMessagesService } from '../app-messages/app-messages.service';

@Component({
  selector: 'app-lottery-settings',
  imports: [ProgressSpinner, Button, RouterLink],
  templateUrl: './lottery-settings.html',
  styleUrl: './lottery-settings.scss',
})
export class LotterySettings {
  private route = inject(ActivatedRoute);
  private lotterySettingsService = inject(LotterySettingsService);
  private appMessagesService = inject(AppMessagesService);

  private paramMap = toSignal(this.route.paramMap);

  private lotteryId = computed(() => {
    return this.paramMap()?.get('id');
  });
  protected lottery = resource({
    params: () => this.lotteryId(),
    loader: async ({ params: id }) => {
      if (id) {
        const resp = await this.lotterySettingsService
          .getLotterySettings(id)
          .catch(this.appMessagesService.showHttpError());
        return resp!.data;
      }
      throw new Error('Lottery ID not provided');
    },
  });
}
