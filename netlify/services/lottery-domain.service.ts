import { AppError } from '../utils';
import { addMinutes, isBefore } from 'date-fns';
import { ExtractionInfo, LotteryInfo, LotteryOwner } from '../../src/app/models';
import { LotteryRepository } from './repositories/lottery.repository';
import { NumbersValidator } from './numbers.validator';

export class LotteryDomainService {
  // Owner-facing: load all lotteries for an owner
  static async loadLotteries({ clientId }: { clientId: string }) {
    const owner = await LotteryRepository.getOwner(clientId);
    if (!owner) {
      return Response.json({ data: [] });
    }

    const lotteries = await Promise.all(
      owner.lotteries.map(async (lotteryId) => {
        const lottery = await this.getLotteryEntityWithRollover(lotteryId);
        return lottery;
      }),
    );

    return Response.json({ data: lotteries });
  }

  // Owner-facing: create a new lottery
  static async createLottery({ lotteryName, clientId }: { clientId: string; lotteryName: string }) {
    if (!lotteryName) {
      return Response.json({ data: 'Missing name' }, { status: 400 });
    }
    if (!lotteryName.match(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/)) {
      return Response.json({ data: `${lotteryName} is an invalid name` }, { status: 400 });
    }

    const existing = await LotteryRepository.getLottery(lotteryName);
    if (existing) {
      return Response.json({ data: `Lottery ${lotteryName} already exists` }, { status: 400 });
    }

    let owner = await LotteryRepository.getOwner(clientId);
    if (!owner) {
      owner = { id: clientId, lotteries: [] } as LotteryOwner;
    }
    owner.lotteries.push(lotteryName);

    const lottery: LotteryInfo = {
      name: lotteryName,
      owner: clientId,
      participants: 0,
      previousExtractions: [],
    } as LotteryInfo;

    await Promise.all([
      LotteryRepository.saveOwner(clientId, owner),
      LotteryRepository.saveLottery(lotteryName, lottery),
    ]);

    return Response.json({ data: 'ok' });
  }

  // Owner-facing: get single lottery (authorized)
  static async getLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const lottery = await this.getLotteryEntityWithRollover(lotteryId);
    this.assertOwner(lottery, clientId);
    return Response.json({ data: lottery });
  }

  // Owner-facing: schedule next extraction
  static async createNextExtraction({
    extractionInfo,
    clientId,
    lotteryId,
  }: {
    extractionInfo: ExtractionInfo;
    clientId: string;
    lotteryId: string;
  }) {
    const lottery = await this.getLotteryEntityWithRollover(lotteryId);

    this.assertOwner(lottery, clientId);

    const extractionTime = new Date(extractionInfo.extractionTime);
    if (!extractionTime || isBefore(extractionTime, addMinutes(new Date(), 15))) {
      throw new AppError(
        400,
        `Invalid extraction time. It must be at least 15 minutes in the future`,
      );
    }

    extractionInfo.winningNumbers = NumbersValidator.validate(extractionInfo.winningNumbers!);
    lottery.nextExtraction = extractionInfo;

    // Preserve original behavior of setting owner
    lottery.owner = clientId;

    await LotteryRepository.saveLottery(lotteryId, lottery);
    return Response.json({ data: lottery });
  }

  static async getLotteryEntityWithRollover(lotteryId: string): Promise<LotteryInfo> {
    const lottery = await LotteryRepository.getLottery(lotteryId);
    if (!lottery) {
      throw new AppError(404, `Lottery ${lotteryId} not found`);
    }
    const updated = await this.finalizeDueNextExtraction(lottery);
    if (updated) {
      await LotteryRepository.saveLottery(lotteryId, lottery);
    }
    return lottery;
  }

  // Helpers
  private static assertOwner(lottery: LotteryInfo, clientId: string) {
    if (lottery.owner !== clientId) {
      throw new AppError(403, `You are not allowed to see ${lottery.name}`);
    }
  }

  // Promote nextExtraction to previous if within the 15-minute window
  private static async finalizeDueNextExtraction(lottery: LotteryInfo): Promise<boolean> {
    const nextExtraction = lottery.nextExtraction;
    if (
      nextExtraction &&
      isBefore(new Date(nextExtraction.extractionTime), addMinutes(new Date(), 15))
    ) {
      lottery.previousExtractions.push(nextExtraction);
      lottery.nextExtraction = undefined;
      return true;
    }
    return false;
  }
}
