import { Component, computed, inject, resource } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppMessagesService } from '../app-messages/app-messages.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { JoinedLotteryService } from './joined-lottery.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ProgressSpinner } from 'primeng/progressspinner';
import { GoHomeButton } from '../go-home-button/go-home-button';
import { Fieldset } from 'primeng/fieldset';

@Component({
  selector: 'app-joined-lottery',
  imports: [ProgressSpinner, GoHomeButton, Fieldset],
  templateUrl: './joined-lottery.html',
  styleUrl: './joined-lottery.scss',
})
export class JoinedLottery {
  private route = inject(ActivatedRoute);
  private joinedLotteryService = inject(JoinedLotteryService);
  private appMessagesService = inject(AppMessagesService);

  private paramMap = toSignal(this.route.paramMap);

  private lotteryId = computed(() => {
    return this.paramMap()?.get('id');
  });
  protected lottery = resource({
    params: () => this.lotteryId(),
    loader: async ({ params: id }) => {
      if (id) {
        const resp = await this.joinedLotteryService
          .getJoinedLottery(id)
          .catch(this.appMessagesService.showHttpError());
        const lottery = resp!.data;

        this.nextExtractionForm.setValue({
          winningNumbers: lottery.chosenNumbers.join(', '),
        });
        return lottery;
      }
      throw new Error('Lottery ID not provided');
    },
  });

  protected nextExtractionTime = computed(() => {
    const lottery = this.lottery.value();
    if (!lottery) {
      return '';
    }
    const nextExtraction = lottery.nextExtraction;
    if (!nextExtraction) {
      return '';
    }
    return new Date(nextExtraction.extractionTime).toLocaleString();
  });

  protected readonly nextExtractionForm = inject(FormBuilder).nonNullable.group({
    winningNumbers: ['', [Validators.required, Validators.pattern(/^\s*\d?\d\s*(,\s*\d?\d\s*)*$/)]],
  });

  protected readonly previousExtractions = resource({
    params: () => this.lottery.value(),
    loader: async ({ params: lottery }) => {
      const lotteriesInfo = await Promise.all(
        (lottery.previousExtractions || []).map(async (extr) => {
          const extraction = await this.joinedLotteryService.getExtraction({
            lotteryId: lottery.name,
            extractionId: extr.extractionId,
          });
          return {
            extractionTime: new Date(extr.extractionId).toLocaleString(),
            winningNumbers: extraction.data.winningNumbers.join(', '),
            chosenNumbers: extr.chosenNumbers.join(', '),
          };
        }),
      );
      return lotteriesInfo;
    },
  });
}
