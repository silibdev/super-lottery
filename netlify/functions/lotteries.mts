import type { Config, Context } from '@netlify/functions';
import { LotteryDomainService } from '../services/lottery-domain.service';
import { getClientId, getLotteryIdFromUrl, handleRequest } from '../utils';
import { LotteryRepository } from '../services/repositories/lottery.repository';

export const config: Config = { path: ['/api/lotteries/:lotteryId', '/api/lotteries'] };

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const lotteryRepository = new LotteryRepository();
  const clientId = await getClientId(context, lotteryRepository);
  const lotteryDomainService = new LotteryDomainService(lotteryRepository);

  switch (req.method) {
    case 'GET':
      const lotteryId = getLotteryIdFromUrl(req.url, context);
      if (lotteryId) {
        return await lotteryDomainService.getLottery({ lotteryId, clientId });
      } else {
        return await lotteryDomainService.loadLotteries({ clientId });
      }
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await lotteryDomainService.createLottery({ clientId, lotteryName });
  }
  return new Response(null, { status: 405 });
};
