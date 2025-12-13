import type { Config, Context } from '@netlify/functions';
import { LotteriesService } from '../services/lotteries.service';
import { getClientId, getLotteryIdFromUrl } from '../utils';

export const config: Config = { path: ['/api/lotteries/:lotteryId', '/api/lotteries'] };

export default async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  switch (req.method) {
    case 'GET':
      const lotteryId = getLotteryIdFromUrl(req.url, context);
      if (lotteryId) {
        return await LotteriesService.getLottery({ lotteryId, clientId });
      } else {
        return await LotteriesService.loadLotteries({ clientId });
      }
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await LotteriesService.createLottery({ clientId, lotteryName });
  }
  return new Response(null, { status: 405 });
};
