import { Injectable } from '@angular/core';
import { manageHttpResponse } from '../utils';
import { AppResponse, LotteryInfo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class LotterySettingsService {
  async getLotterySettings(id: string): Promise<AppResponse<LotteryInfo>> {
    const res = await fetch('api/lotteries/' + id);
    manageHttpResponse(res);
    return await res.json();
  }
}
