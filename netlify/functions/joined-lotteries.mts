import type { Config, Context } from '@netlify/functions';
import { getClientId, getJoinedLotteryIdFromUrl, handleRequest } from '../utils';
import { ParticipantService } from '../services/participant.service';

export const config: Config = {
  path: ['/api/joined-lotteries', '/api/joined-lotteries/:lotteryId'],
};

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const clientId = getClientId(context);
  const lotteryId = getJoinedLotteryIdFromUrl(req.url, context);

  switch (req.method) {
    case 'GET':
      if (lotteryId) {
        return await ParticipantService.getJoinedLottery({ lotteryId, clientId });
      } else {
        return await ParticipantService.getJoinedLotteries({ clientId });
      }
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await ParticipantService.joinLottery({ clientId, lotteryName });
    case 'PUT':
      if (!lotteryId) {
        return new Response(null, { status: 400 });
      }
      const { chosenNumbers } = await req.json();
      return await ParticipantService.saveChosenNumbers({ clientId, lotteryId, chosenNumbers });
  }
  return new Response(null, { status: 405 });
};
