import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ParticipantService } from './participant.service';
import { LotteryRepository } from './repositories/lottery.repository';
import { AppError } from '../utils';
import { LotteriesParticipant, LotteryInfo } from '../../src/app/models';

vi.mock('./repositories/lottery.repository');
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...(actual as any),
    validateNumbers: vi.fn((nums) => nums),
  };
});

describe('ParticipantService', () => {
  let service: ParticipantService;
  let repository: Mocked<LotteryRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new LotteryRepository() as Mocked<LotteryRepository>;
    service = new ParticipantService(repository);
  });

  describe('getJoinedLotteries', () => {
    it('should return joined lotteries for a participant', async () => {
      const participant: LotteriesParticipant = {
        participantId: 'client1',
        joinedLotteries: [{ name: 'lottery1', chosenNumbers: [] }],
      };
      repository.getParticipant.mockResolvedValue(participant);
      repository.getLottery.mockResolvedValue({
        name: 'lottery1',
        previousExtractions: [],
      } as any);

      const result = await service.getJoinedLotteries({ clientId: 'client1' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('lottery1');
    });

    it('should return empty array if participant not found', async () => {
      repository.getParticipant.mockResolvedValue(undefined);

      const result = await service.getJoinedLotteries({ clientId: 'none' });

      expect(result).toEqual([]);
    });

    it('should throw other errors', async () => {
      repository.getParticipant.mockRejectedValue(new Error('Unexpected'));

      await expect(service.getJoinedLotteries({ clientId: 'client1' })).rejects.toThrow(
        'Unexpected',
      );
    });
  });

  describe('joinLottery', () => {
    it('should join a lottery for a new participant', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        participants: [],
        previousExtractions: [],
      } as any;
      repository.getLottery.mockResolvedValue(lottery);
      repository.getParticipant.mockResolvedValue(undefined);

      const result = await service.joinLottery({ clientId: 'client1', lotteryName: 'lottery1' });

      expect(result.joinedLotteries).toHaveLength(1);
      expect(result.joinedLotteries[0].name).toBe('lottery1');
      expect(lottery.participants).toContain('client1');
      expect(repository.saveLottery).toHaveBeenCalled();
      expect(repository.saveParticipant).toHaveBeenCalled();
    });

    it('should not add lottery if already joined', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        participants: ['client1'],
        previousExtractions: [],
      } as any;
      const participant: LotteriesParticipant = {
        participantId: 'client1',
        joinedLotteries: [{ name: 'lottery1', chosenNumbers: [1, 2, 3] }],
      };
      repository.getLottery.mockResolvedValue(lottery);
      repository.getParticipant.mockResolvedValue(participant);

      const result = await service.joinLottery({ clientId: 'client1', lotteryName: 'lottery1' });

      expect(result.joinedLotteries).toHaveLength(1);
      expect(lottery.participants).toHaveLength(1); // Non duplicato
    });
  });

  describe('getJoinedLottery', () => {
    it('should return lottery details for participant', async () => {
      const participant: LotteriesParticipant = {
        participantId: 'client1',
        joinedLotteries: [{ name: 'lottery1', chosenNumbers: [1, 2, 3] }],
      };
      repository.getParticipant.mockResolvedValue(participant);
      repository.getLottery.mockResolvedValue({
        name: 'lottery1',
        previousExtractions: [],
      } as any);

      const result = await service.getJoinedLottery({ clientId: 'client1', lotteryId: 'lottery1' });

      expect(result.name).toBe('lottery1');
      expect(result.chosenNumbers).toEqual([1, 2, 3]);
    });

    it('should throw 403 if participant did not join the lottery', async () => {
      const participant: LotteriesParticipant = {
        participantId: 'client1',
        joinedLotteries: [],
      };
      repository.getParticipant.mockResolvedValue(participant);

      await expect(
        service.getJoinedLottery({ clientId: 'client1', lotteryId: 'lottery1' }),
      ).rejects.toThrow(new AppError(403, 'You did not joined lottery lottery1'));
    });
  });

  describe('saveChosenNumbers', () => {
    it('should save chosen numbers', async () => {
      const participant: LotteriesParticipant = {
        participantId: 'client1',
        joinedLotteries: [{ name: 'lottery1', chosenNumbers: [] }],
      };
      repository.getParticipant.mockResolvedValue(participant);

      const result = await service.saveChosenNumbers({
        clientId: 'client1',
        lotteryId: 'lottery1',
        chosenNumbers: [10, 20, 30],
      });

      expect(result.joinedLotteries[0].chosenNumbers).toEqual([10, 20, 30]);
      expect(result.joinedLotteries[0].lastUpdateChosenNumbers).toBeDefined();
      expect(repository.saveParticipant).toHaveBeenCalledWith('client1', participant);
    });
  });

  describe('getExtraction', () => {
    it('should return extraction info', async () => {
      const extractionTime = '2023-01-01T00:00:00.000Z';
      const lottery: LotteryInfo = {
        name: 'lottery1',
        previousExtractions: [{ extractionTime, winningNumbers: [1, 2, 3] }],
      } as any;
      repository.getLottery.mockResolvedValue(lottery);

      const extractionId = btoa(extractionTime);
      const result = await service.getExtraction({
        lotteryId: 'lottery1',
        clientId: 'client1',
        extractionId,
      });

      expect(result.extractionTime).toBe(extractionTime);
      expect(result.winningNumbers).toEqual([1, 2, 3]);
    });

    it('should hide winning numbers if extraction is in the future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const extractionTime = futureDate.toISOString();
      const lottery: LotteryInfo = {
        name: 'lottery1',
        previousExtractions: [{ extractionTime, winningNumbers: [1, 2, 3] }],
      } as any;
      repository.getLottery.mockResolvedValue(lottery);

      const extractionId = btoa(extractionTime);
      const result = await service.getExtraction({
        lotteryId: 'lottery1',
        clientId: 'client1',
        extractionId,
      });

      expect(result.winningNumbers).toBeUndefined();
    });

    it('should throw 404 if extraction not found', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        previousExtractions: [],
      } as any;
      repository.getLottery.mockResolvedValue(lottery);

      const extractionId = btoa('2023-01-01T00:00:00.000Z');
      await expect(
        service.getExtraction({
          lotteryId: 'lottery1',
          clientId: 'client1',
          extractionId,
        }),
      ).rejects.toThrow(/Extraction .* not found/);
    });
  });

  describe('getExtractionStats', () => {
    it('should return extraction stats', async () => {
      const extractionTime = '2023-01-01T00:00:00.000Z';
      const lottery: LotteryInfo = {
        name: 'lottery1',
        participants: ['p1', 'p2'],
        previousExtractions: [{ extractionTime, winningNumbers: [1, 2, 3] }],
      } as any;
      repository.getLottery.mockResolvedValue(lottery);

      const p1: LotteriesParticipant = {
        participantId: 'p1',
        joinedLotteries: [
          {
            name: 'lottery1',
            chosenNumbers: [],
            previousExtractions: [{ extractionId: extractionTime, chosenNumbers: [1, 2, 10] }],
          },
        ],
      };
      const p2: LotteriesParticipant = {
        participantId: 'p2',
        joinedLotteries: [
          {
            name: 'lottery1',
            chosenNumbers: [],
            previousExtractions: [{ extractionId: extractionTime, chosenNumbers: [1, 10, 20] }],
          },
        ],
      };

      repository.getParticipant.mockImplementation(async (id) => {
        if (id === 'p1') return p1;
        if (id === 'p2') return p2;
        return undefined;
      });

      repository.getClientName.mockImplementation(async (id) => {
        if (id === 'p1') return 'User 1';
        if (id === 'p2') return 'User 2';
        return undefined;
      });

      const extractionId = btoa(extractionTime);
      const result = await service.getExtractionStats({
        lotteryId: 'lottery1',
        clientId: 'p1',
        extractionId,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ participantName: 'User 1', countWinningNumbers: 2 });
      expect(result[1]).toEqual({ participantName: 'User 2', countWinningNumbers: 1 });
    });

    it('should throw 404 if extraction has no winning numbers', async () => {
      const extractionTime = '2023-01-01T00:00:00.000Z';
      const lottery: LotteryInfo = {
        name: 'lottery1',
        participants: [],
        previousExtractions: [{ extractionTime, winningNumbers: undefined }],
      } as any;
      repository.getLottery.mockResolvedValue(lottery);

      const extractionId = btoa(extractionTime);
      await expect(
        service.getExtractionStats({
          lotteryId: 'lottery1',
          clientId: 'p1',
          extractionId,
        }),
      ).rejects.toThrow(/not found/);
    });
  });
});
