import { LotteriesParticipant, LotteryInfo, LotteryOwner } from '../../../src/app/models';
import { getStore } from '@netlify/blobs';

export class LotteryRepository {
  private static readonly LOTTERIES_STORE = getStore({ name: 'lotteries', consistency: 'strong' });
  private static readonly LOTTERIES_OWNERS_STORE = getStore({
    name: 'lotteries-owners',
    consistency: 'strong',
  });
  private static readonly LOTTERIES_PARTICIPANT_STORE = getStore({
    name: 'lotteries-participant',
    consistency: 'strong',
  });
  private static readonly CLIENT_NAMES_STORE = getStore({
    name: 'client-names',
    consistency: 'strong',
  });

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

  static async getClientName(clientId: string): Promise<string | undefined> {
    return await this.CLIENT_NAMES_STORE.get(clientId, { type: 'text' });
  }

  static async saveClientName(clientId: string, name: string): Promise<void> {
    await this.CLIENT_NAMES_STORE.set(clientId, name);
  }
}
