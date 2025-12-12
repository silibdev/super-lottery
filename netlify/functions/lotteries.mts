import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { LotteryOwner } from '../../src/app/models';

const SUPER_LOTTERY_CLIENT_ID = 'super-lottery-client-id';
const getLotteriesStore = () => getStore('lotteries');
const getLotteriesOwnersStore = () => getStore('lotteries-owners');

export default async (req: Request, context: Context) => {
  const id = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  if (!id) {
    context.cookies.set(SUPER_LOTTERY_CLIENT_ID, crypto.randomUUID());
  }

  switch (req.method) {
    case 'GET':
      return await loadLotteries(req, context);
    case 'POST':
      return await createLottery(req, context);
  }
  return new Response(null, { status: 405 });
};

async function loadLotteries(req: Request, context: Context) {
  const id = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  const lotteriesOwnersStore = getLotteriesOwnersStore();

  const owner: LotteryOwner = await lotteriesOwnersStore.get(id, { type: 'json' });
  if (!owner) {
    return Response.json({ data: [] });
  }

  const lotteriesStore = getLotteriesStore();
  const lotteries = await Promise.all(
    owner.lotteries.map((lotteryId) => lotteriesStore.get(lotteryId, { type: 'json' })),
  );
  return Response.json({ data: lotteries });
}

async function createLottery(req: Request, context: Context) {
  const id = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  const { name } = await req.json();
  if (!name) {
    return Response.json({ data: 'Missing name' }, { status: 400 });
  }

  const lotteriesStore = getLotteriesStore();
  const foundLottery = await lotteriesStore.get(name);
  if (foundLottery) {
    return Response.json({ data: `Lottery ${name} already exists` }, { status: 400 });
  }

  const lotteriesOwnersStore = getLotteriesOwnersStore();
  let owner: LotteryOwner = await lotteriesOwnersStore.get(id, { type: 'json' });
  if (!owner) {
    owner = { id, lotteries: [] };
  }

  owner.lotteries.push(name);

  await Promise.all([
    lotteriesOwnersStore.setJSON(id, owner),
    lotteriesStore.setJSON(name, {
      name,
      participants: 0,
      extractions: 0,
    }),
  ]);

  return Response.json({ data: 'ok' });
}
