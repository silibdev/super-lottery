import { Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LotterySettingsService } from './lottery-settings.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Button } from 'primeng/button';
import { AppMessagesService } from '../app-messages/app-messages.service';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { Message } from 'primeng/message';
import { InputText } from 'primeng/inputtext';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Fieldset } from 'primeng/fieldset';
import { addMinutes } from 'date-fns';
import { GoHomeButton } from '../go-home-button/go-home-button';

@Component({
  selector: 'app-lottery-settings',
  imports: [
    ProgressSpinner,
    Button,
    DatePicker,
    FloatLabel,
    Message,
    InputText,
    ReactiveFormsModule,
    AsyncPipe,
    Fieldset,
    GoHomeButton,
  ],
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
        const lottery = resp!.data;

        if (lottery.nextExtraction) {
          this.nextExtractionForm.setValue({
            extractionTime: new Date(lottery.nextExtraction.extractionTime),
            winningNumbers: lottery.nextExtraction.winningNumbers.join(', '),
          });
        }
        return lottery;
      }
      throw new Error('Lottery ID not provided');
    },
  });

  protected previousExtractions = computed(() => {
    const lottery = this.lottery.value();
    const previousExtractions = lottery?.previousExtractions || [];
    return previousExtractions.map((e) => ({
      extractionTime: new Date(e.extractionTime).toLocaleString(),
      winningNumbers: e.winningNumbers.join(', '),
    }));
  });

  protected savingNextExtraction = signal(false);

  protected readonly nextExtractionForm = inject(FormBuilder).nonNullable.group({
    extractionTime: [addMinutes(new Date(), 30), [Validators.required]],
    winningNumbers: ['', [Validators.required, Validators.pattern(/^\s*\d?\d\s*(,\s*\d?\d\s*)*$/)]],
  });

  protected async saveNextExtraction() {
    const extraction = this.nextExtractionForm.value;
    const winningNumbers = extraction.winningNumbers!.split(',').map((n) => parseInt(n.trim(), 10));
    const extractionTime = extraction.extractionTime!.toISOString();
    const lotteryId = this.lotteryId()!;

    this.savingNextExtraction.set(true);
    await this.lotterySettingsService
      .saveNextExtraction({
        lotteryId,
        extractionTime,
        winningNumbers,
      })
      .then(this.appMessagesService.showHttpResponse())
      .catch(this.appMessagesService.showHttpError({ dontThrow: true }));
    this.savingNextExtraction.set(false);
  }

  protected currentNumbersInserted$ = this.nextExtractionForm
    .get('winningNumbers')!
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
}
