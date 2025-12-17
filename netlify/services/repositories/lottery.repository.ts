import { LotteriesParticipant, LotteryInfo, LotteryOwner } from '../../../src/app/models';
import { getStore } from '@netlify/blobs';

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
    return await this.lotteriesStore().get(id, { type: 'json' });
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
    return await this.lotteriesParticipantStore().get(id, { type: 'json' });
  }

  async saveParticipant(id: string, participant: LotteriesParticipant): Promise<void> {
    await this.lotteriesParticipantStore().setJSON(id, participant);
  }

  async getClientName(clientId: string): Promise<string | undefined> {
    return await this.clientNamesStore().get(clientId, { type: 'text' });
  }

  async saveClientName(clientId: string, name: string): Promise<void> {
    await this.clientNamesStore().set(clientId, name);
  }
}
