import { LotteriesParticipant, LotteryInfo, LotteryOwner } from '../../../src/app/models';
import { getStore } from '@netlify/blobs';
import { NEXT_EXTRACTION_TIME_MINUTES } from '../../utils';
import { addMinutes, isBefore } from 'date-fns';

export class LotteryRepository {
  private readonly lotteriesStore;
  private readonly lotteriesOwnersStore;
  private readonly lotteriesParticipantStore;
  private readonly clientNamesStore;

  constructor() {
    this.lotteriesStore = () => getStore({ name: 'lotteries', consistency: 'strong' });
    this.lotteriesOwnersStore = () =>
      getStore({
        name: 'lotteries-owners',
        consistency: 'strong',
      });
    this.lotteriesParticipantStore = () =>
      getStore({
        name: 'lotteries-participant',
        consistency: 'strong',
      });
    this.clientNamesStore = () =>
      getStore({
        name: 'client-names',
        consistency: 'strong',
      });
  }

  // Lotteries
  async getLottery(id: string): Promise<LotteryInfo | undefined> {
    const lottery = await this.lotteriesStore().get(id, { type: 'json' });
    if (!lottery) {
      return undefined;
    }
    const updated = await this.updateNextExtraction(lottery);
    if (updated) {
      await this.saveLottery(id, lottery);
    }
    return lottery;
  }

  async saveLottery(id: string, lottery: LotteryInfo): Promise<void> {
    await this.lotteriesStore().setJSON(id, lottery);
  }

  // Owners
  async getOwner(id: string): Promise<LotteryOwner | undefined> {
    return await this.lotteriesOwnersStore().get(id, { type: 'json' });
  }

  async saveOwner(id: string, owner: LotteryOwner): Promise<void> {
    await this.lotteriesOwnersStore().setJSON(id, owner);
  }

  // Participants
  async getParticipant(id: string): Promise<LotteriesParticipant | undefined> {
    const participant: LotteriesParticipant | undefined =
      await this.lotteriesParticipantStore().get(id, { type: 'json' });
    if (!participant) {
      return undefined;
    }
    const updated = await this.updatingLastExtraction(participant);
    if (updated) {
      await this.saveParticipant(id, participant);
    }
    return participant;
  }

  async saveParticipant(id: string, participant: LotteriesParticipant): Promise<void> {
    await this.lotteriesParticipantStore().setJSON(id, participant);
  }

  async getClientName(clientId: string): Promise<string | undefined> {
    return await this.clientNamesStore().get(clientId, { type: 'text' });
  }

  async saveClientName(clientId: string, name: string): Promise<string> {
    await this.clientNamesStore().set(clientId, name);
    return name;
  }

  // Promote nextExtraction to previous if within the 15-minute window
  private async updateNextExtraction(lottery: LotteryInfo): Promise<boolean> {
    const nextExtraction = lottery.nextExtraction;
    if (
      nextExtraction &&
      isBefore(
        new Date(nextExtraction.extractionTime),
        addMinutes(new Date(), NEXT_EXTRACTION_TIME_MINUTES),
      )
    ) {
      lottery.previousExtractions.push(nextExtraction);
      lottery.nextExtraction = undefined;
      return true;
    }
    return false;
  }

  private async updatingLastExtraction(participant: LotteriesParticipant): Promise<boolean> {
    let updated = false;
    await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) => {
        const lottery = await this.getLottery(lotteryForParticipant.name);
        const lastExtraction = lottery?.previousExtractions?.pop()?.extractionTime;
        const lastUpdateChosenNumbers = lotteryForParticipant.lastUpdateChosenNumbers;
        if (
          lastExtraction &&
          lastUpdateChosenNumbers &&
          isBefore(
            new Date(lastUpdateChosenNumbers),
            addMinutes(new Date(lastExtraction), -1 * NEXT_EXTRACTION_TIME_MINUTES),
          )
        ) {
          updated = true;
          let previousExtractions = lotteryForParticipant.previousExtractions;
          if (!previousExtractions) {
            previousExtractions = [];
            lotteryForParticipant.previousExtractions = previousExtractions;
          }
          previousExtractions.push({
            chosenNumbers: lotteryForParticipant.chosenNumbers,
            extractionId: lastExtraction,
          });
          lotteryForParticipant.chosenNumbers = [];
          lotteryForParticipant.lastUpdateChosenNumbers = undefined;
        }
      }),
    );
    return updated;
  }
}
