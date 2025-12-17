import type { Config, Context } from '@netlify/functions';
import { getClientId, getJoinedLotteryIdFromUrl, handleRequest } from '../utils';
import { ParticipantService } from '../services/participant.service';
import { LotteryRepository } from '../services/repositories/lottery.repository';
import { LotteryDomainService } from '../services/lottery-domain.service';

export const config: Config = {
  path: ['/api/joined-lotteries', '/api/joined-lotteries/:lotteryId'],
};

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const lotteryRepository = new LotteryRepository();
  const clientId = await getClientId(context, lotteryRepository);
  const lotteryDomainService = new LotteryDomainService(lotteryRepository);
  const participantService = new ParticipantService(lotteryRepository, lotteryDomainService);

  const lotteryId = getJoinedLotteryIdFromUrl(req.url, context);

  switch (req.method) {
    case 'GET':
      if (lotteryId) {
        return await participantService.getJoinedLottery({ lotteryId, clientId });
      } else {
        return await participantService.getJoinedLotteries({ clientId });
      }
    case 'POST':
      const { name: lotteryName } = await req.json();
      return await participantService.joinLottery({ clientId, lotteryName });
    case 'PUT':
      if (!lotteryId) {
        return new Response(null, { status: 400 });
      }
      const { chosenNumbers } = await req.json();
      return await participantService.saveChosenNumbers({ clientId, lotteryId, chosenNumbers });
  }
  return new Response(null, { status: 405 });
};
