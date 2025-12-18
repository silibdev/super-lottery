import { AppError, NEXT_EXTRACTION_TIME_MINUTES, validateNumbers } from '../utils';
import { addMinutes, isBefore } from 'date-fns';
import { ExtractionInfo, LotteryInfo, LotteryOwner } from '../../src/app/models';
import { LotteryRepository } from './repositories/lottery.repository';

export class LotteryDomainService {
  constructor(private lotteryRepository: LotteryRepository) {}

  // Owner-facing: load all lotteries for an owner
  async loadLotteries({ clientId }: { clientId: string }) {
    const owner = await this.lotteryRepository.getOwner(clientId);
    if (!owner) {
      return Response.json({ data: [] });
    }

    const lotteries = await Promise.all(
      owner.lotteries.map(async (lotteryId) => {
        const lottery = await this.getLotteryEntityWithRollover(lotteryId);
        await this.getParticipantsNames(lottery);
        return lottery;
      }),
    );

    return Response.json({ data: lotteries });
  }

  // Owner-facing: create a new lottery
  async createLottery({ lotteryName, clientId }: { clientId: string; lotteryName: string }) {
    if (!lotteryName) {
      return Response.json({ data: 'Missing name' }, { status: 400 });
    }
    if (!lotteryName.match(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/)) {
      return Response.json({ data: `${lotteryName} is an invalid name` }, { status: 400 });
    }

    const existing = await this.lotteryRepository.getLottery(lotteryName);
    if (existing) {
      return Response.json({ data: `Lottery ${lotteryName} already exists` }, { status: 400 });
    }

    let owner = await this.lotteryRepository.getOwner(clientId);
    if (!owner) {
      owner = { id: clientId, lotteries: [] } as LotteryOwner;
    }
    owner.lotteries.push(lotteryName);

    const lottery: LotteryInfo = {
      name: lotteryName,
      owner: clientId,
      participants: [],
      previousExtractions: [],
    } as LotteryInfo;

    await Promise.all([
      this.lotteryRepository.saveOwner(clientId, owner),
      this.lotteryRepository.saveLottery(lotteryName, lottery),
    ]);

    return Response.json({ data: 'ok' });
  }

  // Owner-facing: get single lottery (authorized)
  async getLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const lottery = await this.getLotteryEntityWithRollover(lotteryId);
    this.assertOwner(lottery, clientId);
    await this.getParticipantsNames(lottery);
    return Response.json({ data: lottery });
  }

  // Owner-facing: schedule next extraction
  async createNextExtraction({
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
    if (
      !extractionTime ||
      isBefore(extractionTime, addMinutes(new Date(), NEXT_EXTRACTION_TIME_MINUTES))
    ) {
      throw new AppError(
        400,
        `Invalid extraction time. It must be at least ${NEXT_EXTRACTION_TIME_MINUTES} minutes in the future`,
      );
    }

    extractionInfo.winningNumbers = validateNumbers(extractionInfo.winningNumbers!);
    lottery.nextExtraction = extractionInfo;

    // Preserve original behavior of setting owner
    lottery.owner = clientId;

    await this.lotteryRepository.saveLottery(lotteryId, lottery);

    await this.getParticipantsNames(lottery);

    return Response.json({ data: lottery });
  }

  async getLotteryEntityWithRollover(lotteryId: string): Promise<LotteryInfo> {
    const lottery = await this.lotteryRepository.getLottery(lotteryId);
    if (!lottery) {
      throw new AppError(404, `Lottery ${lotteryId} not found`);
    }
    const updated = await this.finalizeDueNextExtraction(lottery);
    if (updated) {
      await this.lotteryRepository.saveLottery(lotteryId, lottery);
    }

    return lottery;
  }

  private async getParticipantsNames(lottery: LotteryInfo): Promise<LotteryInfo> {
    const participantNames = await Promise.all(
      lottery.participants.map((clientId) => this.lotteryRepository.getClientName(clientId)),
    );

    lottery.participants = participantNames.filter((name) => !!name) as string[];

    return lottery;
  }

  // Helpers
  private assertOwner(lottery: LotteryInfo, clientId: string) {
    if (lottery.owner !== clientId) {
      throw new AppError(403, `You are not allowed to see ${lottery.name}`);
    }
  }

  // Promote nextExtraction to previous if within the 15-minute window
  private async finalizeDueNextExtraction(lottery: LotteryInfo): Promise<boolean> {
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
}
