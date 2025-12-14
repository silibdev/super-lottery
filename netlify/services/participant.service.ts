import { AppError } from '../utils';
import { isAfter, isBefore } from 'date-fns';
import { ExtractionInfoForParticipant, LotteriesParticipant, LotteryInfoForParticipant } from '../../src/app/models';
import { LotteryRepository } from './repositories/lottery.repository';
import { NumbersValidator } from './numbers.validator';
import { LotteryDomainService } from './lottery-domain.service';

export class ParticipantService {
  static async getJoinedLotteries({ clientId }: { clientId: string }) {
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

  static async joinLottery({ clientId, lotteryName }: { clientId: string; lotteryName: any }) {
    const lottery = await LotteryDomainService.getLotteryEntityWithRollover(lotteryName);

    let participant = await LotteryRepository.getParticipant(clientId);
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
      lottery.participants++;
    }

    await Promise.all([
      LotteryRepository.saveLottery(lottery.name, lottery),
      LotteryRepository.saveParticipant(clientId, participant),
    ]);

    const participantWithLotteriesInfo = await this.participantWithLotteriesInfo(participant);
    return Response.json({ data: participantWithLotteriesInfo });
  }

  static async getJoinedLottery({ lotteryId, clientId }: { lotteryId: string; clientId: string }) {
    const participant = await this.getParticipantUpdatingLastExtraction(clientId);
    const lotteryForParticipant = participant.joinedLotteries.find((l) => l.name === lotteryId);
    if (!lotteryForParticipant) {
      return Response.json({ data: `You did not joined lottery ${lotteryId}` }, { status: 403 });
    }
    const extendedLotteryInfo = await this.lotteryWithNextExtractionInfo(lotteryForParticipant);
    return Response.json({ data: extendedLotteryInfo });
  }

  static async saveChosenNumbers({
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
    lotteryForParticipant.chosenNumbers = NumbersValidator.validate(chosenNumbers);
    lotteryForParticipant.lastUpdateChosenNumbers = new Date().toISOString();
    await LotteryRepository.saveParticipant(clientId, participant);
    return Response.json({ data: participant });
  }

  static async getExtraction({
    lotteryId,
    clientId,
    extractionId,
  }: {
    lotteryId: string;
    clientId: string;
    extractionId: string;
  }) {
    const lottery = await LotteryDomainService.getLotteryEntityWithRollover(lotteryId);
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
          winningNumbers: extraction.winningNumbers,
          extractionTime: extraction.extractionTime,
        },
      });
    }
  }

  // ---------- helpers ----------
  private static async participantWithLotteriesInfo(participant: LotteriesParticipant) {
    const lotteriesInfo = await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) =>
        this.lotteryWithNextExtractionInfo(lotteryForParticipant),
      ),
    );
    return { ...participant, joinedLotteries: lotteriesInfo } as LotteriesParticipant;
  }

  private static async lotteryWithNextExtractionInfo(
    lotteryForParticipant: LotteryInfoForParticipant,
  ) {
    const lottery = await LotteryDomainService.getLotteryEntityWithRollover(
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

  private static async getParticipantUpdatingLastExtraction(clientId: string) {
    const participant: LotteriesParticipant | undefined =
      await LotteryRepository.getParticipant(clientId);
    if (!participant) {
      throw new AppError(404, `Participant not found`);
    }

    await Promise.all(
      participant.joinedLotteries.map(async (lotteryForParticipant) => {
        const lottery = await LotteryDomainService.getLotteryEntityWithRollover(
          lotteryForParticipant.name,
        );
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
    await LotteryRepository.saveParticipant(clientId, participant);
    return participant;
  }
}
