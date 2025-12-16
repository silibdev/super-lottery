import type { Context } from '@netlify/functions';
import { LotteryRepository } from './services/repositories/lottery.repository';

const SUPER_LOTTERY_CLIENT_ID = 'super-lottery-client-id';

export const getClientId = async (context: Context) => {
  let clientId = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  if (!clientId) {
    clientId = crypto.randomUUID();
    context.cookies.set({
      name: SUPER_LOTTERY_CLIENT_ID,
      value: clientId,
      httpOnly: true,
      secure: true,
    });
    const randomUser = await fetch('https://randomuser.me/api/?inc=name').then((r) => r.json());
    const { first, last } = randomUser.results[0].name;
    await LotteryRepository.saveClientName(clientId, `${first} ${last}`);
  }
  return clientId;
};

export const getLotteryIdFromUrl = (url: string, context: Context) => {
  console.log('context params', context.params);
  const splitUrl = url.split('/');
  if (splitUrl[3] === 'api' && splitUrl[4] === 'lotteries') {
    return splitUrl[5];
  } else {
    return undefined;
  }
};

export const getJoinedLotteryIdFromUrl = (url: string, context: Context) => {
  console.log('context params', context.params);
  const splitUrl = url.split('/');
  if (splitUrl[3] === 'api' && splitUrl[4] === 'joined-lotteries') {
    return splitUrl[5];
  } else {
    return undefined;
  }
};

export const getExtractionIdFromUrl = (url: string, context: Context) => {
  console.log('context params', context.params);
  const splitUrl = url.split('/');
  if (splitUrl[3] === 'api' && splitUrl[4] === 'lotteries' && splitUrl[6] === 'extractions') {
    return splitUrl[7];
  } else {
    return undefined;
  }
};

export class AppError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export async function handleRequest(
  req: Request,
  context: Context,
  handler: (req: Request, ctx: Context) => Promise<unknown>,
) {
  try {
    return await handler(req, context);
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json({ data: e.message }, { status: e.code });
    }
    throw e;
  }
}
