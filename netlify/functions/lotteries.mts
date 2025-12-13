import type { Config, Context } from '@netlify/functions';
import { LotteriesService } from '../services/lotteries.service';
import { getClientId } from '../utils';

export const config: Config = { path: ['/api/lotteries/:lotteryId', '/api/lotteries'] };
export const getLotteryIdFromUrl = (url: string) => {
  const splitUrl = url.split('/');
  const lotteryId = splitUrl.pop();
  const lotteriesString = splitUrl.pop();
  if (lotteriesString === 'lotteries') {
    return lotteryId;
  } else {
    return undefined;
  }
};

export default async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  switch (req.method) {
    case 'GET':
      const lotteryId = getLotteryIdFromUrl(req.url);
      if (lotteryId) {
        return await LotteriesService.getLottery({ lotteryId, clientId });
      } else {
        return await LotteriesService.loadLotteries({ clientId });
      }
    case 'POST':
      const lotteryName = await req.json();
      return await LotteriesService.createLottery({ clientId, lotteryName });
  }
  return new Response(null, { status: 405 });
};
