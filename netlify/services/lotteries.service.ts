import { getLotteriesOwnersStore, getLotteriesStore } from '../utils';
import { ExtractionInfo, LotteryInfo, LotteryOwner } from '../../src/app/models';
import { addMinutes, isBefore } from 'date-fns';

export const LotteriesService = {
  async loadLotteries({ clientId }: { clientId: string }) {
    const lotteriesOwnersStore = getLotteriesOwnersStore();

    const owner: LotteryOwner = await lotteriesOwnersStore.get(clientId, { type: 'json' });
    if (!owner) {
      return Response.json({ data: [] });
    }

    const lotteriesStore = getLotteriesStore();
    const lotteries = await Promise.all(
      owner.lotteries.map((lotteryId) => lotteriesStore.get(lotteryId, { type: 'json' })),
    );
    return Response.json({ data: lotteries });
  },

  async createLottery({ lotteryName, clientId }: { clientId: string; lotteryName: string }) {
    if (!lotteryName) {
      return Response.json({ data: 'Missing name' }, { status: 400 });
    }
    if (!lotteryName.match(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/)) {
      return Response.json({ data: `${lotteryName} is an invalid name` }, { status: 400 });
    }

    const lotteriesStore = getLotteriesStore();
    const foundLottery = await lotteriesStore.get(lotteryName);
    if (foundLottery) {
      return Response.json({ data: `Lottery ${lotteryName} already exists` }, { status: 400 });
    }

    const lotteriesOwnersStore = getLotteriesOwnersStore();
    let owner: LotteryOwner = await lotteriesOwnersStore.get(clientId, { type: 'json' });
    if (!owner) {
      owner = { id: clientId, lotteries: [] };
    }

    owner.lotteries.push(lotteryName);

    const lottery: LotteryInfo = {
      name: lotteryName,
      owner: clientId,
      participants: 0,
      previousExtractions: [],
    };

    await Promise.all([
      lotteriesOwnersStore.setJSON(clientId, owner),
      lotteriesStore.setJSON(lotteryName, lottery),
    ]);

    return Response.json({ data: 'ok' });
  },

  async getLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const lotteriesStore = getLotteriesStore();
    const lottery: LotteryInfo = await lotteriesStore.get(lotteryId, { type: 'json' });
    if (!lottery || lottery.owner !== clientId) {
      return Response.json({ data: `You are not allowed to see ${lotteryId}` }, { status: 403 });
    }
    return Response.json({ data: lottery });
  },

  async createNextExtraction({
    extractionInfo,
    clientId,
    lotteryId,
  }: {
    extractionInfo: ExtractionInfo;
    clientId: string;
    lotteryId: string;
  }) {
    const lotteriesStore = getLotteriesStore();
    const lottery: LotteryInfo = await lotteriesStore.get(lotteryId, { type: 'json' });
    if (!lottery || lottery.owner !== clientId) {
      return Response.json({ data: `You are not allowed to modify ${lotteryId}` }, { status: 403 });
    }
    lottery.owner = clientId;

    const extractionTime = new Date(extractionInfo.extractionTime);
    if (!extractionTime || isBefore(extractionTime, addMinutes(new Date(), 15))) {
      return Response.json(
        {
          data: `Invalid extraction time. It must be at least 15 minutes in the future`,
        },
        { status: 400 },
      );
    }
    if (extractionInfo.winningNumbers.length !== 10) {
      return Response.json(
        {
          data: `Invalid winning numbers length ${extractionInfo.winningNumbers.length}. It must be 10 numbers`,
        },
        { status: 400 },
      );
    }
    if (new Set(extractionInfo.winningNumbers).size !== 10) {
      return Response.json(
        {
          data: `Invalid winning numbers. They must be unique`,
        },
        { status: 400 },
      );
    }
    lottery.nextExtraction = extractionInfo;

    await lotteriesStore.setJSON(lotteryId, lottery);
    return Response.json({ data: lottery });
  },
};
