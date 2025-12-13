import type { Config, Context } from '@netlify/functions';
import { getClientId, getJoinedLotteryIdFromUrl } from '../utils';
import { LotteriesService } from '../services/lotteries.service';

export const config: Config = {
  path: ['/api/joined-lotteries', '/api/joined-lotteries/:lotteryId'],
};

export default async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  switch (req.method) {
    case 'GET':
      const lotteryId = getJoinedLotteryIdFromUrl(req.url, context);
      if (lotteryId) {
        return await LotteriesService.getJoinedLottery({ lotteryId, clientId });
      } else {
        return await LotteriesService.getJoinedLotteries({ clientId });
      }
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await LotteriesService.joinLottery({ clientId, lotteryName });
  }
  return new Response(null, { status: 405 });
};
