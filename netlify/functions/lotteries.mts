import type { Context } from "@netlify/functions";
import { getStore } from '@netlify/blobs';

const SUPER_LOTTERY_CLIENT_ID = 'super-lottery-client-id';
const lotteriesStore = getStore('lotteries');

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
  return new Response(null, {status: 405});
}

async function loadLotteries(req: Request, context: Context) {
  const id = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  const lotteries = await lotteriesStore.get(id);
  return Response.json({data: [].concat(JSON.parse(lotteries.toString())) || []});
}

async function createLottery(req: Request, context: Context) {
  const id = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  const {name} = await req.json();
  if (!name) {
    return Response.json({data: 'Missing name'}, {status: 400});
  }

  await lotteriesStore.setJSON(id, {name, participants: 0, extractions: 0});

  return Response.json({data: 'ok'});
}
