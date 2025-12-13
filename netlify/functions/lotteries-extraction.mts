import type { Config, Context } from '@netlify/functions';
import { LotteriesService } from '../services/lotteries.service';
import { getClientId, getExtractionIdFromUrl, getLotteryIdFromUrl, handleRequest } from '../utils';

export const config: Config = { path: ['/api/lotteries/:lotteryId/extractions/:extractionId'] };

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  switch (req.method) {
    case 'GET':
      const lotteryId = getLotteryIdFromUrl(req.url, context);
      const extractionId = getExtractionIdFromUrl(req.url, context);
      if (lotteryId && extractionId) {
        return await LotteriesService.getExtraction({
          lotteryId,
          clientId,
          extractionId,
        });
      }
  }
  return new Response(null, { status: 405 });
};
