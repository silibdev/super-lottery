import {
  AppError,
  getLotteriesOwnersStore,
  getLotteriesParticipantStore,
  getLotteriesStore,
} from '../utils';
import {
  ExtractionInfo,
  LotteriesParticipant,
  LotteryInfo,
  LotteryInfoForParticipant,
  LotteryOwner,
} from '../../src/app/models';
import { addMinutes, isAfter, isBefore } from 'date-fns';

const LOTTERIES_STORE = getLotteriesStore();
const LOTTERIES_PARTICIPANT_STORE = getLotteriesParticipantStore();
const LOTTERIES_OWNERS_STORE = getLotteriesOwnersStore();

export const LotteriesService = {
  async loadLotteries({ clientId }: { clientId: string }) {
    const owner: LotteryOwner = await LOTTERIES_OWNERS_STORE.get(clientId, { type: 'json' });
    if (!owner) {
      return Response.json({ data: [] });
    }

    const lotteries = await Promise.all(
      owner.lotteries.map((lotteryId) => this._getLottery(lotteryId)),
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

    try {
      const foundLottery = await this._getLottery(lotteryName);
      if (foundLottery) {
        return Response.json({ data: `Lottery ${lotteryName} already exists` }, { status: 400 });
      }
    } catch (e) {
      if (e instanceof AppError && e.code === 404) {
        // it's ok, this is preferable
      } else {
        throw e;
      }
    }

    let owner: LotteryOwner = await LOTTERIES_OWNERS_STORE.get(clientId, { type: 'json' });
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
      LOTTERIES_OWNERS_STORE.setJSON(clientId, owner),
      LOTTERIES_STORE.setJSON(lotteryName, lottery),
    ]);

    return Response.json({ data: 'ok' });
  },

  async getLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const lottery: LotteryInfo = await this._getLottery(lotteryId, clientId);

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
    const lottery: LotteryInfo = await this._getLottery(lotteryId, clientId);

    lottery.owner = clientId;

    const extractionTime = new Date(extractionInfo.extractionTime);
    if (!extractionTime || isBefore(extractionTime, addMinutes(new Date(), 15))) {
      throw new AppError(
        400,
        `Invalid extraction time. It must be at least 15 minutes in the future`,
      );
    }

    extractionInfo.winningNumbers = this._validateNumbers(extractionInfo.winningNumbers!);
    lottery.nextExtraction = extractionInfo;

    await LOTTERIES_STORE.setJSON(lotteryId, lottery);
    return Response.json({ data: lottery });
  },

  async getJoinedLotteries({ clientId }: { clientId: string }) {
    try {
      const participant: LotteriesParticipant = await this._getLotteriesParticipant(clientId);

      const participantWithLotteriesInfo = await this._participantWithLotteriesInfo(participant);

      return Response.json({ data: participantWithLotteriesInfo.joinedLotteries });
    } catch (e) {
      if (e instanceof AppError && e.code === 404) {
        return Response.json({ data: [] });
      }
      throw e;
    }
  },

  _validateNumbers(numbers: number[]) {
    if (numbers!.length !== 10) {
      throw new AppError(400, `Invalid numbers length ${numbers!.length}. It must be 10.`);
    }

    if (new Set(numbers).size !== 10) {
      throw new AppError(400, `Invalid winning numbers. They must be unique.`);
    }

    return numbers.sort();
  },

  async joinLottery({ clientId, lotteryName }: { clientId: string; lotteryName: any }) {
    const lottery: LotteryInfo = await this._getLottery(lotteryName);

    let participant: LotteriesParticipant | undefined;
    try {
      participant = await this._getLotteriesParticipant(clientId);
    } catch (e) {
      if (e instanceof AppError && e.code === 404) {
        participant = {
          participantId: clientId,
          joinedLotteries: [],
        };
      } else {
        throw e;
      }
    }

    const lotteryForParticipant: LotteryInfoForParticipant = {
      name: lotteryName,
      chosenNumbers: [],
    };

    participant.joinedLotteries.push(lotteryForParticipant);
    lottery.participants++;

    await Promise.all([
      LOTTERIES_STORE.setJSON(lottery.name, lottery),
      LOTTERIES_PARTICIPANT_STORE.setJSON(clientId, participant),
    ]);

    const participantWithLotteriesInfo = await this._participantWithLotteriesInfo(participant);

    return Response.json({ data: participantWithLotteriesInfo });
  },

  async _participantWithLotteriesInfo(participant: LotteriesParticipant) {
    const lotteriesInfo = await Promise.all(
      participant.joinedLotteries.map(
        async (lotteryForParticipant) =>
          await this._lotteryWithNextExtractionInfo(lotteryForParticipant),
      ),
    );
    return { ...participant, joinedLotteries: lotteriesInfo };
  },

  async _lotteryWithNextExtractionInfo(lotteryForParticipant: LotteryInfoForParticipant) {
    const lottery: LotteryInfo = await this._getLottery(lotteryForParticipant.name);
    return {
      ...lotteryForParticipant,
      nextExtraction: lottery.nextExtraction,
      previousExtractions: lottery.previousExtractions.map((extraction) => {
        const participantExtraction = lotteryForParticipant.previousExtractions?.find(
          (pe) => pe.extractionId === extraction.extractionTime,
        );
        if (!participantExtraction) {
          return {
            extractionId: extraction.extractionTime,
            chosenNumbers: [],
          };
        } else {
          return participantExtraction;
        }
      }),
    };
  },

  async getJoinedLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const participant: LotteriesParticipant = await this._getLotteriesParticipant(clientId);

    const lotteryForParticipant = participant.joinedLotteries.find(
      (lottery) => lottery.name === lotteryId,
    );
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }

    const extendedLotteryInfo = await this._lotteryWithNextExtractionInfo(lotteryForParticipant);
    return Response.json({ data: extendedLotteryInfo });
  },

  async saveChosenNumbers({
    clientId,
    lotteryId,
    chosenNumbers,
  }: {
    clientId: string;
    lotteryId: string;
    chosenNumbers: number[];
  }) {
    const participant: LotteriesParticipant = await this._getLotteriesParticipant(clientId);

    const lotteryForParticipant = participant.joinedLotteries.find(
      (lottery) => lottery.name === lotteryId,
    );
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }

    lotteryForParticipant.chosenNumbers = this._validateNumbers(chosenNumbers);
    lotteryForParticipant.lastUpdateChosenNumbers = new Date().toISOString();

    await LOTTERIES_PARTICIPANT_STORE.setJSON(clientId, participant);

    return Response.json({ data: participant });
  },

  async _getLottery(lotteryId: string, clientId?: string) {
    const lottery: LotteryInfo = await LOTTERIES_STORE.get(lotteryId, { type: 'json' });

    if (!lottery) {
      throw new AppError(404, `Lottery ${lotteryId} not found`);
    }

    if (clientId && lottery.owner !== clientId) {
      throw new AppError(403, `You are not allowed to see ${lotteryId}`);
    }

    const nextExtraction = lottery.nextExtraction;

    if (
      nextExtraction &&
      isBefore(new Date(nextExtraction.extractionTime), addMinutes(new Date(), 15))
    ) {
      lottery.previousExtractions.push(nextExtraction);

      lottery.nextExtraction = undefined;

      await LOTTERIES_STORE.setJSON(lotteryId, lottery);
    }

    return lottery;
  },

  async _getLotteriesParticipant(clientId: string) {
    const participant: LotteriesParticipant = await LOTTERIES_PARTICIPANT_STORE.get(clientId, {
      type: 'json',
    });

    if (!participant) {
      throw new AppError(404, `Participant not found`);
    }

    await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) => {
        const lottery: LotteryInfo = await this._getLottery(lotteryForParticipant.name);

        const lastExtraction = lottery.previousExtractions?.pop()?.extractionTime;
        const lastUpdateChosenNumbers = lotteryForParticipant.lastUpdateChosenNumbers;

        if (
          lastExtraction &&
          lastUpdateChosenNumbers &&
          isBefore(new Date(lastUpdateChosenNumbers), new Date(lastExtraction))
        ) {
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
    await LOTTERIES_PARTICIPANT_STORE.setJSON(clientId, participant);

    return participant;
  },
  async getExtraction({
    lotteryId,
    clientId,
    extractionId,
  }: {
    lotteryId: string;
    clientId: string;
    extractionId: string;
  }) {
    const lottery = await this._getLottery(lotteryId);
    const decodedExtractionId = atob(extractionId);

    const extraction = lottery.previousExtractions.find(
      (extraction) => extraction.extractionTime === decodedExtractionId,
    );
    if (!extraction) {
      throw new AppError(404, `Extraction ${extractionId} not found`);
    }

    if (isAfter(new Date(), new Date(extraction.extractionTime))) {
      return Response.json({ data: extraction });
    } else {
      return Response.json({
        data: {
          winningNumbers: extraction.winningNumbers,
          extractionTime: extraction.extractionTime,
        },
      });
    }
  },
};
