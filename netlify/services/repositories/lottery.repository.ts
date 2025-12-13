import { getLotteriesOwnersStore, getLotteriesParticipantStore, getLotteriesStore } from '../../utils';
import { LotteriesParticipant, LotteryInfo, LotteryOwner } from '../../src/app/models';

export class LotteryRepository {
  private static readonly LOTTERIES_STORE = getLotteriesStore();
  private static readonly LOTTERIES_PARTICIPANT_STORE = getLotteriesParticipantStore();
  private static readonly LOTTERIES_OWNERS_STORE = getLotteriesOwnersStore();

  // Lotteries
  static async getLottery(id: string): Promise<LotteryInfo | undefined> {
    return await this.LOTTERIES_STORE.get(id, { type: 'json' });
  }

  static async saveLottery(id: string, lottery: LotteryInfo): Promise<void> {
    await this.LOTTERIES_STORE.setJSON(id, lottery);
  }

  // Owners
  static async getOwner(id: string): Promise<LotteryOwner | undefined> {
    return await this.LOTTERIES_OWNERS_STORE.get(id, { type: 'json' });
  }

  static async saveOwner(id: string, owner: LotteryOwner): Promise<void> {
    await this.LOTTERIES_OWNERS_STORE.setJSON(id, owner);
  }

  // Participants
  static async getParticipant(id: string): Promise<LotteriesParticipant | undefined> {
    return await this.LOTTERIES_PARTICIPANT_STORE.get(id, { type: 'json' });
  }

  static async saveParticipant(id: string, participant: LotteriesParticipant): Promise<void> {
    await this.LOTTERIES_PARTICIPANT_STORE.setJSON(id, participant);
  }
}
