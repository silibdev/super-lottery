import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

const SUPER_LOTTERY_CLIENT_ID = 'super-lottery-client-id';

export const getLotteriesStore = () => getStore('lotteries');

export const getLotteriesOwnersStore = () => getStore('lotteries-owners');

export const getLotteriesParticipantStore = () => getStore('lotteries-participant');

export const getClientId = (context: Context) => {
  let clientId = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  if (!clientId) {
    clientId = crypto.randomUUID();
    context.cookies.set(SUPER_LOTTERY_CLIENT_ID, clientId);
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

export class AppError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}
