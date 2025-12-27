import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { LotteryDomainService } from './lottery-domain.service';
import { LotteryRepository } from './repositories/lottery.repository';
import { AppError } from '../utils';
import { LotteryInfo, LotteryOwner } from '../../src/app/models';

vi.mock('./repositories/lottery.repository');
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...(actual as any),
    validateNumbers: vi.fn((nums) => nums),
  };
});

describe('LotteryDomainService', () => {
  let service: LotteryDomainService;
  let repository: Mocked<LotteryRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new LotteryRepository() as Mocked<LotteryRepository>;
    service = new LotteryDomainService(repository);
  });

  describe('loadLotteries', () => {
    it('should return an empty array if owner does not exist', async () => {
      repository.getOwner.mockResolvedValue(undefined);

      const result = await service.loadLotteries({ clientId: 'owner1' });

      expect(result).toEqual([]);
      expect(repository.getOwner).toHaveBeenCalledWith('owner1');
    });

    it('should return lotteries with participant names if owner exists', async () => {
      const owner: LotteryOwner = { id: 'owner1', lotteries: ['lottery1'] };
      const lottery: LotteryInfo = {
        name: 'lottery1',
        owner: 'owner1',
        participants: ['p1'],
        previousExtractions: [],
      } as LotteryInfo;

      repository.getOwner.mockResolvedValue(owner);
      repository.getLottery.mockResolvedValue(lottery);
      repository.getClientName.mockResolvedValue('Participant 1');

      const result = await service.loadLotteries({ clientId: 'owner1' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('lottery1');
      expect(result[0].participants).toEqual(['Participant 1']);
      expect(repository.getLottery).toHaveBeenCalledWith('lottery1');
      expect(repository.getClientName).toHaveBeenCalledWith('p1');
    });
  });

  describe('createLottery', () => {
    it('should throw error for missing name', async () => {
      await expect(service.createLottery({ clientId: 'owner1', lotteryName: '' })).rejects.toThrow(
        new AppError(400, 'Missing name'),
      );
    });

    it('should throw error for invalid name', async () => {
      await expect(
        service.createLottery({ clientId: 'owner1', lotteryName: 'Invalid Name!' }),
      ).rejects.toThrow(new AppError(400, 'Invalid Name! is an invalid name'));
    });

    it('should throw error if lottery already exists', async () => {
      repository.getLottery.mockResolvedValue({ name: 'existing' } as LotteryInfo);

      await expect(
        service.createLottery({ clientId: 'owner1', lotteryName: 'existing' }),
      ).rejects.toThrow(new AppError(400, 'Lottery existing already exists'));
    });

    it('should create and return new lottery if all checks pass', async () => {
      repository.getLottery.mockResolvedValue(undefined);
      repository.getOwner.mockResolvedValue(undefined);

      const result = await service.createLottery({
        clientId: 'owner1',
        lotteryName: 'new-lottery',
      });

      expect(result.name).toBe('new-lottery');
      expect(result.owner).toBe('owner1');
      expect(repository.saveOwner).toHaveBeenCalled();
      expect(repository.saveLottery).toHaveBeenCalledWith('new-lottery', expect.any(Object));
    });
  });

  describe('getLottery', () => {
    it('should throw error if lottery not found', async () => {
      repository.getLottery.mockResolvedValue(undefined);

      await expect(service.getLottery({ lotteryId: 'none', clientId: 'owner1' })).rejects.toThrow(
        new AppError(404, 'Lottery none not found'),
      );
    });

    it("should return lottery and remove owner if clientId doesn't match", async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        owner: 'owner1',
        participants: [],
        previousExtractions: [],
      } as LotteryInfo;
      repository.getLottery.mockResolvedValue(lottery);

      const result = await service.getLottery({ lotteryId: 'lottery1', clientId: 'other' });

      expect(result.owner).toBeUndefined();
    });

    it('should return lottery and keep owner if clientId matches', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        owner: 'owner1',
        participants: [],
        previousExtractions: [],
      } as LotteryInfo;
      repository.getLottery.mockResolvedValue(lottery);

      const result = await service.getLottery({ lotteryId: 'lottery1', clientId: 'owner1' });

      expect(result.owner).toBe('owner1');
    });
  });

  describe('createNextExtraction', () => {
    it('should throw error if not owner', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        owner: 'owner1',
        participants: [],
        previousExtractions: [],
      } as LotteryInfo;
      repository.getLottery.mockResolvedValue(lottery);

      await expect(
        service.createNextExtraction({
          lotteryId: 'lottery1',
          clientId: 'not-owner',
          extractionInfo: { extractionTime: new Date().toISOString() } as any,
        }),
      ).rejects.toThrow(new AppError(403, 'You are not allowed to see lottery1'));
    });

    it('should throw error for invalid extraction time (too soon)', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        owner: 'owner1',
        participants: [],
        previousExtractions: [],
      } as LotteryInfo;
      repository.getLottery.mockResolvedValue(lottery);

      const tooSoon = new Date().toISOString();

      await expect(
        service.createNextExtraction({
          lotteryId: 'lottery1',
          clientId: 'owner1',
          extractionInfo: { extractionTime: tooSoon } as any,
        }),
      ).rejects.toThrow(/Invalid extraction time/);
    });

    it('should schedule extraction and return updated lottery', async () => {
      const lottery: LotteryInfo = {
        name: 'lottery1',
        owner: 'owner1',
        participants: [],
        previousExtractions: [],
      } as LotteryInfo;
      repository.getLottery.mockResolvedValue(lottery);

      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30);

      const result = await service.createNextExtraction({
        lotteryId: 'lottery1',
        clientId: 'owner1',
        extractionInfo: {
          extractionTime: futureDate.toISOString(),
          winningNumbers: [1, 2, 3],
        } as any,
      });

      expect(result.nextExtraction).toBeDefined();
      expect(result.nextExtraction?.winningNumbers).toEqual([1, 2, 3]);
      expect(repository.saveLottery).toHaveBeenCalled();
    });
  });
});
