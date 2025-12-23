import type { Config, Context } from '@netlify/functions';
import { getClientId, handleRequest } from '../utils';
import { LotteryRepository } from '../services/repositories/lottery.repository';

export const config: Config = {
  path: ['/api/name'],
};

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const lotteryRepository = new LotteryRepository();
  const clientId = await getClientId(context, lotteryRepository);

  switch (req.method) {
    case 'GET':
      return await lotteryRepository.getClientName(clientId);
    case 'PUT':
      const { name: newName } = await req.json();
      return await lotteryRepository.saveClientName(clientId, newName);
  }
  return new Response(null, { status: 405 });
};
