import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

const SUPER_LOTTERY_CLIENT_ID = 'super-lottery-client-id';

export const getLotteriesStore = () => getStore('lotteries');

export const getLotteriesOwnersStore = () => getStore('lotteries-owners');

export const getClientId = (context: Context) => {
  let clientId = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  if (!clientId) {
    clientId = crypto.randomUUID();
    context.cookies.set(SUPER_LOTTERY_CLIENT_ID, clientId);
  }
  return clientId;
};
