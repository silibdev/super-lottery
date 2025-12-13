import { getLotteriesOwnersStore, getLotteriesParticipantStore, getLotteriesStore } from '../utils';
import {
  ExtractionInfo,
  LotteriesParticipant,
  LotteryInfo,
  LotteryInfoForParticipant,
  LotteryOwner,
} from '../../src/app/models';
import { addMinutes, isBefore } from 'date-fns';
import { Store } from '@netlify/blobs';

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

  async getJoinedLotteries({ clientId }: { clientId: string }) {
    const lotteriesParticipantStore = getLotteriesParticipantStore();

    const participant: LotteriesParticipant = await lotteriesParticipantStore.get(clientId, {
      type: 'json',
    });

    if (!participant) {
      return Response.json({ data: [] });
    }

    const participantWithLotteriesInfo = await this._participantWithLotteriesInfo(
      getLotteriesStore(),
      participant,
    );

    return Response.json({ data: participantWithLotteriesInfo.joinedLotteries });
  },

  async joinLottery({ clientId, lotteryName }: { clientId: string; lotteryName: any }) {
    const lotteriesParticipantStore = getLotteriesParticipantStore();
    const lotteriesStore = getLotteriesStore();
    const lottery: LotteryInfo = await lotteriesStore.get(lotteryName, { type: 'json' });
    if (!lottery) {
      return Response.json({ data: `Lottery ${lotteryName} does not exist` }, { status: 404 });
    }

    let participant: LotteriesParticipant | undefined = await lotteriesParticipantStore.get(
      clientId,
      { type: 'json' },
    );
    if (!participant) {
      participant = {
        participantId: clientId,
        joinedLotteries: [],
      };
    }

    const lotteryForParticipant: LotteryInfoForParticipant = {
      name: lotteryName,
      chosenNumbers: [],
    };

    participant.joinedLotteries.push(lotteryForParticipant);
    lottery.participants++;

    await Promise.all([
      lotteriesStore.setJSON(lottery.name, lottery),
      lotteriesParticipantStore.setJSON(clientId, participant),
    ]);

    const participantWithLotteriesInfo = await this._participantWithLotteriesInfo(
      lotteriesStore,
      participant,
    );

    return Response.json({ data: participantWithLotteriesInfo });
  },

  async _participantWithLotteriesInfo(lotteriesStore: Store, participant: LotteriesParticipant) {
    const lotteriesInfo = await Promise.all(
      participant.joinedLotteries.map(
        async (lotteryForParticipant) =>
          await this._lotteryWithNextExtractionInfo(lotteriesStore, lotteryForParticipant),
      ),
    );
    return { ...participant, joinedLotteries: lotteriesInfo };
  },

  async _lotteryWithNextExtractionInfo(
    lotteriesStore: Store,
    lotteryForParticipant: LotteryInfoForParticipant,
  ) {
    const lottery: LotteryInfo = await lotteriesStore.get(lotteryForParticipant.name, {
      type: 'json',
    });
    return {
      ...lotteryForParticipant,
      nextExtraction: lottery.nextExtraction,
    };
  },

  async getJoinedLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const participant: LotteriesParticipant = await getLotteriesParticipantStore().get(clientId, {
      type: 'json',
    });
    if (!participant) {
      return Response.json({ data: `Participant not found` }, { status: 404 });
    }
    const lotteryForParticipant = participant.joinedLotteries.find(
      (lottery) => lottery.name === lotteryId,
    );
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }

    const extendedLotteryInfo = await this._lotteryWithNextExtractionInfo(
      getLotteriesStore(),
      lotteryForParticipant,
    );
    return Response.json({ data: extendedLotteryInfo });
  },
  async saveChosenNumbers({
    clientId,
    lotteryId,
    chosenNumbers,
  }: {
    clientId: string;
    lotteryId: string;
    chosenNumbers: any;
  }) {
    const lotteriesParticipantStore = getLotteriesParticipantStore();
    const participant: LotteriesParticipant = await lotteriesParticipantStore.get(clientId, {
      type: 'json',
    });
    if (!participant) {
      return Response.json({ data: `Participant not found` }, { status: 404 });
    }
    const lotteryForParticipant = participant.joinedLotteries.find(
      (lottery) => lottery.name === lotteryId,
    );
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }

    lotteryForParticipant.chosenNumbers = chosenNumbers;

    await lotteriesParticipantStore.setJSON(clientId, participant);

    return Response.json({ data: participant });
  },
};
