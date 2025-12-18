import type { Config, Context } from '@netlify/functions';
import { ParticipantService } from '../services/participant.service';
import { getClientId, getExtractionIdFromUrl, getLotteryIdFromUrl, handleRequest } from '../utils';
import { LotteryRepository } from '../services/repositories/lottery.repository';
import { LotteryDomainService } from '../services/lottery-domain.service';

export const config: Config = {
  path: ['/api/lotteries/:lotteryId/extractions/:extractionId/stats'],
};

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const lotteryRepository = new LotteryRepository();
  const clientId = await getClientId(context, lotteryRepository);
  const lotteryDomainService = new LotteryDomainService(lotteryRepository);
  const participantService = new ParticipantService(lotteryRepository, lotteryDomainService);

  switch (req.method) {
    case 'GET':
      const lotteryId = getLotteryIdFromUrl(req.url, context);
      const extractionId = getExtractionIdFromUrl(req.url, context);
      if (lotteryId && extractionId) {
        return await participantService.getExtractionStats({
          lotteryId,
          clientId,
          extractionId,
        });
      }
  }
  return new Response(null, { status: 405 });
};
