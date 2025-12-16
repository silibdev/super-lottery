import type { Config, Context } from '@netlify/functions';
import { LotteryDomainService } from '../services/lottery-domain.service';
import { getClientId, getLotteryIdFromUrl, handleRequest } from '../utils';

export const config: Config = { path: ['/api/lotteries/:lotteryId', '/api/lotteries'] };

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const clientId = await getClientId(context);
  switch (req.method) {
    case 'GET':
      const lotteryId = getLotteryIdFromUrl(req.url, context);
      if (lotteryId) {
        return await LotteryDomainService.getLottery({ lotteryId, clientId });
      } else {
        return await LotteryDomainService.loadLotteries({ clientId });
      }
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await LotteryDomainService.createLottery({ clientId, lotteryName });
  }
  return new Response(null, { status: 405 });
};
