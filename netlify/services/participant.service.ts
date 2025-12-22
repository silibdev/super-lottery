import { AppError, validateNumbers } from '../utils';
import { isBefore } from 'date-fns';
import {
  ExtractionInfoForParticipant,
  LotteriesParticipant,
  LotteryInfoForParticipant,
  NumbersForExtraction,
  ParticipantStats
} from '../../src/app/models';
import { LotteryRepository } from './repositories/lottery.repository';

export class ParticipantService {
  constructor(private lotteryRepository: LotteryRepository) {}

  async getJoinedLotteries({ clientId }: { clientId: string }) {
    try {
      const participant = await this.getParticipantForSure(clientId);
      const participantWithLotteriesInfo = await this.participantWithFullLotteriesInfo(participant);
      return Response.json({ data: participantWithLotteriesInfo.joinedLotteries });
    } catch (e) {
      if (e instanceof AppError && e.code === 404) {
        return Response.json({ data: [] });
      }
      throw e;
    }
  }

  async joinLottery({ clientId, lotteryName }: { clientId: string; lotteryName: any }) {
    const lottery = await this.getLotteryForSure(lotteryName);

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

    const participantWithLotteriesInfo = await this.participantWithFullLotteriesInfo(participant);
    return Response.json({ data: participantWithLotteriesInfo });
  }

  async getJoinedLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const participant = await this.getParticipantForSure(clientId);
    const lotteryForParticipant = participant.joinedLotteries.find((l) => l.name === lotteryId);
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }
    const extendedLotteryInfo =
      await this.lotteryForParticipantWithFullNextExtractionInfo(lotteryForParticipant);
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
    const participant = await this.getParticipantForSure(clientId);
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
    const lottery = await this.getLotteryForSure(lotteryId);
    const decodedExtractionId = atob(extractionId);
    const extraction = lottery.previousExtractions.find(
      (ex) => ex.extractionTime === decodedExtractionId,
    );
    if (!extraction) {
      throw new AppError(404, `Extraction ${extractionId} not found`);
    }

    if (isBefore(new Date(), new Date(extraction.extractionTime))) {
      extraction.winningNumbers = undefined;
    }
    return Response.json({ data: extraction });
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
    const lottery = await this.getLotteryForSure(lotteryId);
    const participants = (
      await Promise.all(
        lottery.participants.map((clientId) => this.lotteryRepository.getParticipant(clientId)),
      )
    ).filter((p): p is LotteriesParticipant => !!p);

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
    const participantSpecificLottery = participants
      .map((p) => {
        const lottery = p.joinedLotteries.find((l) => l.name === lotteryId);
        if (!lottery) return undefined;
        return { ...lottery, clientId: p.participantId };
      })
      .filter((l): l is LotteryInfoForParticipant & { clientId: string } => !!l);
    // Get extraction with extractionId for each participant
    const extractionForParticipant = participantSpecificLottery
      .map((participantLottery) => {
        const extraction = participantLottery.previousExtractions?.find(
          (e) => e.extractionId === decodedExtractionId,
        );
        if (!extraction) return undefined;
        return {
          ...extraction,
          clientId: participantLottery.clientId,
        };
      })
      .filter((l): l is NumbersForExtraction & { clientId: string } => !!l);

    // Get participants names
    const participantsNamesArray = await Promise.all(
      extractionForParticipant.map((p) => this.lotteryRepository.getClientName(p.clientId)),
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
        const countWinningNumbers = participantExtraction.chosenNumbers.reduce(
          (acc, num) => (winningNumbersMap[num] ? acc + 1 : acc),
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
  private async participantWithFullLotteriesInfo(
    participant: LotteriesParticipant,
  ): Promise<LotteriesParticipant> {
    const lotteriesInfo = await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) =>
        this.lotteryForParticipantWithFullNextExtractionInfo(lotteryForParticipant),
      ),
    );
    return { participantId: participant.participantId, joinedLotteries: lotteriesInfo };
  }

  private async lotteryForParticipantWithFullNextExtractionInfo(
    lotteryForParticipant: LotteryInfoForParticipant,
  ) {
    const lottery = await this.getLotteryForSure(lotteryForParticipant.name);
    const nextExtraction: ExtractionInfoForParticipant | undefined = lottery.nextExtraction && {
      lotteryId: lottery.nextExtraction.lotteryId,
      extractionTime: lottery.nextExtraction.extractionTime,
    };
    const lotteryForParticipantFull: LotteryInfoForParticipant = {
      ...lotteryForParticipant,
      nextExtraction,
      // PreviousExtractions has to have an entry for every extraction of the lottery
      previousExtractions: lottery.previousExtractions.map((extraction) => {
        const participantExtraction = lotteryForParticipant.previousExtractions?.find(
          (pe) => pe.extractionId === extraction.extractionTime,
        );
        // If the participant does not have one, we create a default one
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
    return lotteryForParticipantFull;
  }

  private async getLotteryForSure(lotteryId: string) {
    const lottery = await this.lotteryRepository.getLottery(lotteryId);
    if (!lottery) {
      throw new AppError(404, `Lottery ${lotteryId} not found`);
    }
    return lottery;
  }

  private async getParticipantForSure(clientId: string) {
    const participant = await this.lotteryRepository.getParticipant(clientId);
    if (!participant) {
      throw new AppError(404, `Participant not found`);
    }
    return participant;
  }
}
