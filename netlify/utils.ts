import type { Context } from '@netlify/functions';
import { LotteryRepository } from './services/repositories/lottery.repository';
import { faker } from '@faker-js/faker';

const SUPER_LOTTERY_CLIENT_ID = 'super-lottery-client-id';
export const NEXT_EXTRACTION_TIME_MINUTES = 15;

export const getClientId = async (context: Context, lotteryRepository: LotteryRepository) => {
  let clientId = context.cookies.get(SUPER_LOTTERY_CLIENT_ID);
  if (!clientId) {
    clientId = crypto.randomUUID();
    context.cookies.set({
      name: SUPER_LOTTERY_CLIENT_ID,
      value: clientId,
      httpOnly: true,
      secure: true,
    });
  }
  const clientName = await lotteryRepository.getClientName(clientId);
  if (!clientName) {
    const randomUsername =
      `${faker.color.human()} ${faker.hacker.abbreviation()} ${faker.animal.type()}`
        .split(' ')
        .map(capitalizeFirstLetter)
        .join(' ');
    await lotteryRepository.saveClientName(clientId, randomUsername);
  }
  return clientId;
};

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

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

export const validateNumbers = (numbers: number[]): number[] => {
  if (!numbers || numbers.length !== 10) {
    throw new AppError(400, `Not enough numbers (${numbers?.length}). They must be 10.`);
  }
  if (new Set(numbers).size !== 10) {
    throw new AppError(400, `Invalid numbers. No duplicates allowed.`);
  }
  return [...numbers].sort((a, b) => a - b);
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
