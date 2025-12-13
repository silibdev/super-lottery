import { Injectable } from '@angular/core';
import { manageHttpResponse } from '../utils';
import { AppResponse, LotteryInfo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ManageLotteriesService {
  async loadLotteries(): Promise<AppResponse<LotteryInfo[]>> {
    const res = await fetch('api/lotteries');
    manageHttpResponse(res);
    return await res.json();
  }

  async createLottery(name: string) {
    const res = await fetch('api/lotteries', { method: 'POST', body: JSON.stringify({ name }) });
    manageHttpResponse(res);
    return await res.json();
  }
}
