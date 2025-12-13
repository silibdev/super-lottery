import { Injectable } from '@angular/core';
import { manageHttpResponse } from '../utils';
import { AppResponse, LotteryInfoForParticipant } from '../models';

@Injectable({
  providedIn: 'root',
})
export class JoinedLotteriesService {
  async getJoinedLotteries(): Promise<AppResponse<LotteryInfoForParticipant[]>> {
    const res = await fetch('api/joined-lotteries');
    manageHttpResponse(res);
    return await res.json();
  }

  async joinLottery(name: string) {
    const res = await fetch('api/joined-lotteries', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    manageHttpResponse(res);
    return await res.json();
  }
}
