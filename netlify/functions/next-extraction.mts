import type { Config, Context } from '@netlify/functions';
import { LotteryDomainService } from '../services/lottery-domain.service';
import { getClientId, getLotteryIdFromUrl, handleRequest } from '../utils';
import { ExtractionInfo } from '../../src/app/models';
import { LotteryRepository } from '../services/repositories/lottery.repository';

export const config: Config = { path: ['/api/lotteries/:lotteryId/next-extraction'] };

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const lotteryRepository = new LotteryRepository();
  const clientId = await getClientId(context, lotteryRepository);
  const lotteryDomainService = new LotteryDomainService(lotteryRepository);

  switch (req.method) {
    case 'POST':
      const lotteryId = getLotteryIdFromUrl(req.url, context)!;
      const extractionInfo: ExtractionInfo = await req.json();
      return await lotteryDomainService.createNextExtraction({
        extractionInfo,
        clientId,
        lotteryId,
      });
  }
  return new Response(null, { status: 405 });
};
