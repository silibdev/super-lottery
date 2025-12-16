import type { Config, Context } from '@netlify/functions';
import { getClientId, handleRequest } from '../utils';
import { LotteryRepository } from '../services/repositories/lottery.repository';

export const config: Config = {
  path: ['/api/name'],
};

export default async (req: Request, context: Context) => handleRequest(req, context, handler);

const handler = async (req: Request, context: Context) => {
  const clientId = await getClientId(context);

  switch (req.method) {
    case 'GET':
      const name = await LotteryRepository.getClientName(clientId);
      return Response.json({ data: name });
    case 'PUT':
      const { name: newName } = await req.json();
      await LotteryRepository.saveClientName(clientId, newName);
      return Response.json({ data: newName });
  }
  return new Response(null, { status: 405 });
};
