import { AppError, NEXT_EXTRACTION_TIME_MINUTES, validateNumbers } from '../utils';
import { addMinutes, isAfter, isBefore } from 'date-fns';
import {
  ExtractionInfoForParticipant,
  LotteriesParticipant,
  LotteryInfoForParticipant,
  NumbersForExtraction,
  ParticipantStats
} from '../../src/app/models';
import { LotteryRepository } from './repositories/lottery.repository';
import { LotteryDomainService } from './lottery-domain.service';

export class ParticipantService {
  constructor(
    private lotteryRepository: LotteryRepository,
    private lotteryDomainService: LotteryDomainService,
  ) {}

  async getJoinedLotteries({ clientId }: { clientId: string }) {
    try {
      const participant = await this.getParticipantUpdatingLastExtraction(clientId);
      const participantWithLotteriesInfo = await this.participantWithLotteriesInfo(participant);
      return Response.json({ data: participantWithLotteriesInfo.joinedLotteries });
    } catch (e) {
      if (e instanceof AppError && e.code === 404) {
        return Response.json({ data: [] });
      }
      throw e;
    }
  }

  async joinLottery({ clientId, lotteryName }: { clientId: string; lotteryName: any }) {
    const lottery = await this.lotteryDomainService.getLotteryEntityWithRollover(lotteryName);

    let participant = await this.lotteryRepository.getParticipant(clientId);
    if (!participant) {
      participant = { participantId: clientId, joinedLotteries: [] } as LotteriesParticipant;
    }

    const existing = participant.joinedLotteries.find((l) => l.name === lotteryName);
    if (!existing) {
      const lotteryForParticipant: LotteryInfoForParticipant = {
        name: lotteryName,
        chosenNumbers: [],
      };
      participant.joinedLotteries.push(lotteryForParticipant);
      lottery.participants.push(clientId);
    }

    await Promise.all([
      this.lotteryRepository.saveLottery(lottery.name, lottery),
      this.lotteryRepository.saveParticipant(clientId, participant),
    ]);

    const participantWithLotteriesInfo = await this.participantWithLotteriesInfo(participant);
    return Response.json({ data: participantWithLotteriesInfo });
  }

  async getJoinedLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const participant = await this.getParticipantUpdatingLastExtraction(clientId);
    const lotteryForParticipant = participant.joinedLotteries.find((l) => l.name === lotteryId);
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }
    const extendedLotteryInfo = await this.lotteryWithNextExtractionInfo(lotteryForParticipant);
    return Response.json({ data: extendedLotteryInfo });
  }

  async saveChosenNumbers({
    clientId,
    lotteryId,
    chosenNumbers,
  }: {
    clientId: string;
    lotteryId: string;
    chosenNumbers: number[];
  }) {
    const participant = await this.getParticipantUpdatingLastExtraction(clientId);
    const lotteryForParticipant = participant.joinedLotteries.find((l) => l.name === lotteryId);
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }
    lotteryForParticipant.chosenNumbers = validateNumbers(chosenNumbers);
    lotteryForParticipant.lastUpdateChosenNumbers = new Date().toISOString();
    await this.lotteryRepository.saveParticipant(clientId, participant);
    return Response.json({ data: participant });
  }

  async getExtraction({
    lotteryId,
    clientId,
    extractionId,
  }: {
    lotteryId: string;
    clientId: string;
    extractionId: string;
  }) {
    const lottery = await this.lotteryDomainService.getLotteryEntityWithRollover(lotteryId);
    const decodedExtractionId = atob(extractionId);
    const extraction = lottery.previousExtractions.find(
      (ex) => ex.extractionTime === decodedExtractionId,
    );
    if (!extraction) {
      throw new AppError(404, `Extraction ${extractionId} not found`);
    }

    if (isAfter(new Date(), new Date(extraction.extractionTime))) {
      return Response.json({ data: extraction });
    } else {
      return Response.json({
        data: {
          winningNumbers: undefined,
          extractionTime: extraction.extractionTime,
        },
      });
    }
  }

  async getExtractionStats({
    lotteryId,
    clientId,
    extractionId,
  }: {
    lotteryId: string;
    clientId: string;
    extractionId: string;
  }) {
    const decodedExtractionId = atob(extractionId);
    // Get lottery and participants
    const lottery = await this.lotteryDomainService.getLotteryEntityWithRollover(lotteryId);
    const participants = await Promise.all(
      lottery.participants.map((clientId) => this.getParticipantUpdatingLastExtraction(clientId)),
    );
    if (!lottery) {
      throw new AppError(404, `Lottery ${lotteryId} not found`);
    }

    // Get extraction
    const extraction = lottery.previousExtractions.find(
      (e) => e.extractionTime === decodedExtractionId,
    );
    if (!extraction || !extraction.winningNumbers) {
      throw new AppError(
        404,
        `Extraction ${decodedExtractionId} not found for lottery ${lotteryId}`,
      );
    }

    // Get lottery with lotteryId for each participant
    const participantSpecificLottery = participants.map((p) => {
      const lottery = p.joinedLotteries.find((l) => l.name === lotteryId);
      if (!lottery) return undefined;
      return { lottery, clientId: p.participantId };
    });
    // Get extraction with extractionId for each participant
    const extractionForParticipant = participantSpecificLottery
      .map((participantLottery) => {
        if (!participantLottery) return undefined;
        const extraction = participantLottery.lottery.previousExtractions?.find(
          (e) => e.extractionId === decodedExtractionId,
        );
        if (!extraction) return undefined;
        return {
          extraction,
          clientId: participantLottery.clientId,
        };
      })
      .filter((l) => !!l) as { extraction: NumbersForExtraction; clientId: string }[];

    // Get participants names
    const participantsNamesArray = await Promise.all(
      participants.map((p) => this.lotteryRepository.getClientName(p.participantId)),
    );
    const participantsNameMap = participantsNamesArray.reduce(
      (acc, name, index) => {
        if (!name) return acc;
        acc[participants[index].participantId] = name;
        return acc;
      },
      {} as Record<string, string>,
    );

    const winningNumbersMap = extraction.winningNumbers.reduce(
      (acc, num) => ({ ...acc, [num]: true }),
      {} as Record<number, boolean>,
    );
    const extractionStats = extractionForParticipant
      .map((participantExtraction) => {
        const countWinningNumbers = participantExtraction.extraction.chosenNumbers.reduce(
          (acc, num) => {
            if (winningNumbersMap?.[num]) return acc + 1;
            return acc;
          },
          0,
        );
        return {
          participantName: participantsNameMap[participantExtraction.clientId],
          countWinningNumbers,
        } as ParticipantStats;
      })
      .filter((s) => s.countWinningNumbers > 0)
      .sort((a, b) => b.countWinningNumbers - a.countWinningNumbers);

    return Response.json({ data: extractionStats });
  }

  // ---------- helpers ----------
  private async participantWithLotteriesInfo(participant: LotteriesParticipant) {
    const lotteriesInfo = await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) =>
        this.lotteryWithNextExtractionInfo(lotteryForParticipant),
      ),
    );
    return { ...participant, joinedLotteries: lotteriesInfo } as LotteriesParticipant;
  }

  private async lotteryWithNextExtractionInfo(lotteryForParticipant: LotteryInfoForParticipant) {
    const lottery = await this.lotteryDomainService.getLotteryEntityWithRollover(
      lotteryForParticipant.name,
    );
    const nextExtraction: ExtractionInfoForParticipant | undefined = lottery.nextExtraction && {
      lotteryId: lottery.nextExtraction.lotteryId,
      extractionTime: lottery.nextExtraction.extractionTime,
    };
    return {
      ...lotteryForParticipant,
      nextExtraction,
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
    } as LotteryInfoForParticipant;
  }

  private async getParticipantUpdatingLastExtraction(clientId: string) {
    console.log('get part with update', clientId);
    const participant: LotteriesParticipant | undefined =
      await this.lotteryRepository.getParticipant(clientId);
    if (!participant) {
      throw new AppError(404, `Participant not found`);
    }

    await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) => {
        const lottery = await this.lotteryDomainService.getLotteryEntityWithRollover(
          lotteryForParticipant.name,
        );
        const lastExtraction = lottery.previousExtractions?.pop()?.extractionTime;
        const lastUpdateChosenNumbers = lotteryForParticipant.lastUpdateChosenNumbers;
        if (
          lastExtraction &&
          lastUpdateChosenNumbers &&
          isBefore(
            new Date(lastUpdateChosenNumbers),
            addMinutes(new Date(lastExtraction), -1 * NEXT_EXTRACTION_TIME_MINUTES),
          )
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
    await this.lotteryRepository.saveParticipant(clientId, participant);
    return participant;
  }
}
