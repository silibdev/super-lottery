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
        const lottery = await this.getLotteryForSure(lotteryId);
        await this.addParticipantsNamesToLottery(lottery);
        return lottery;
      }),
    );

    return Response.json({ data: lotteries });
  }

  // Owner-facing: create a new lottery
  async createLottery({ lotteryName, clientId }: { clientId: string; lotteryName: string }) {
    if (!lotteryName) {
      throw new AppError(400, 'Missing name');
    }
    if (!lotteryName.match(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/)) {
      throw new AppError(400, `${lotteryName} is an invalid name`);
    }

    const existing = await this.lotteryRepository.getLottery(lotteryName);
    if (existing) {
      throw new AppError(400, `Lottery ${lotteryName} already exists`);
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

    return Response.json({ data: lottery });
  }

  // Owner-facing: get single lottery (authorized)
  async getLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const lottery = await this.getLotteryForSure(lotteryId);
    await this.addParticipantsNamesToLottery(lottery);
    this.removeOwnerIfNecessary(lottery, clientId);
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
    const lottery = await this.getLotteryForSure(lotteryId);

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

    await this.lotteryRepository.saveLottery(lotteryId, lottery);

    await this.addParticipantsNamesToLottery(lottery);

    this.removeOwnerIfNecessary(lottery, clientId);
    return Response.json({ data: lottery });
  }

  private async addParticipantsNamesToLottery(lottery: LotteryInfo): Promise<LotteryInfo> {
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

  private async getLotteryForSure(lotteryId: string) {
    const lottery = await this.lotteryRepository.getLottery(lotteryId);
    if (!lottery) {
      throw new AppError(404, `Lottery ${lotteryId} not found`);
    }
    return lottery;
  }

  private removeOwnerIfNecessary(lottery: LotteryInfo, clientId: string) {
    if (lottery.owner != clientId) {
      lottery.owner = undefined;
    }
    return lottery;
  }
}
