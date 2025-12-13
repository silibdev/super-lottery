import type { Config, Context } from '@netlify/functions';
import { LotteriesService } from '../services/lotteries.service';
import { getClientId, getLotteryIdFromUrl } from '../utils';
import { ExtractionInfo } from '../../src/app/models';

export const config: Config = { path: ['/api/lotteries/:lotteryId/next-extraction'] };

export default async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  switch (req.method) {
    // case 'GET':
    //   const lotteryId = getLotteryIdFromUrl(req.url);
    //   if (lotteryId) {
    //     return await LotteriesService.getLottery({ lotteryId, clientId });
    //   } else {
    //     return await LotteriesService.loadLotteries({ clientId });
    //   }
    case 'POST':
      const lotteryId = getLotteryIdFromUrl(req.url, context)!;
      const extractionInfo: ExtractionInfo = await req.json();
      return await LotteriesService.createNextExtraction({ extractionInfo, clientId, lotteryId });
  }
  return new Response(null, { status: 405 });
};
