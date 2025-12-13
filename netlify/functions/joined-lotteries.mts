import type { Config, Context } from '@netlify/functions';
import { getClientId } from '../utils';
import { LotteriesService } from '../services/lotteries.service';

export const config: Config = { path: ['/api/joined-lotteries'] };

export default async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  switch (req.method) {
    case 'GET':
      return await LotteriesService.getJoinedLotteries({ clientId });
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await LotteriesService.joinLottery({ clientId, lotteryName });
  }
  return new Response(null, { status: 405 });
};
