import { Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppMessagesService } from '../app-messages/app-messages.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { JoinedLotteryService } from './joined-lottery.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProgressSpinner } from 'primeng/progressspinner';
import { GoHomeButton } from '../go-home-button/go-home-button';
import { Fieldset } from 'primeng/fieldset';
import { AsyncPipe } from '@angular/common';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Button } from 'primeng/button';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'app-joined-lottery',
  imports: [
    ProgressSpinner,
    GoHomeButton,
    Fieldset,
    AsyncPipe,
    FloatLabel,
    FormsModule,
    InputText,
    Message,
    ReactiveFormsModule,
    Button,
  ],
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
          chosenNumbers: lottery.chosenNumbers.join(', '),
        });
        return lottery;
      }
      throw new Error('Lottery ID not provided');
    },
  });

  protected savingChosenNumbers = signal(false);

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
    chosenNumbers: ['', [Validators.required, Validators.pattern(/^\s*\d?\d\s*(,\s*\d?\d\s*)*$/)]],
  });

  protected currentNumbersInserted$ = this.nextExtractionForm
    .get('chosenNumbers')!
    .valueChanges.pipe(
      map(
        (numbers) =>
          numbers
            .split(',')
            .filter((n) => n.trim() !== '')
            .map((n) => parseInt(n.trim(), 10)).length,
      ),
      catchError((err) => of(null)),
    );

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

  protected async saveChosenNumbers() {
    const extraction = this.nextExtractionForm.value;
    const chosenNumbers = extraction.chosenNumbers!.split(',').map((n) => parseInt(n.trim(), 10));
    const lotteryId = this.lotteryId()!;

    this.savingChosenNumbers.set(true);
    await this.joinedLotteryService
      .saveChosenNumbers({
        lotteryId,
        chosenNumbers,
      })
      .then(this.appMessagesService.showHttpResponse())
      .catch(this.appMessagesService.showHttpError({ dontThrow: true }));
    this.savingChosenNumbers.set(false);
  }
}
