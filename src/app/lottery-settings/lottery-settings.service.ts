import { Injectable } from '@angular/core';
import { manageHttpResponse } from '../utils';
import { AppResponse, ExtractionInfo, LotteryInfo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class LotterySettingsService {
  async getLotterySettings(id: string): Promise<AppResponse<LotteryInfo>> {
    const res = await fetch('api/lotteries/' + id);
    manageHttpResponse(res);
    return await res.json();
  }

  async saveNextExtraction(extraction: ExtractionInfo) {
    const res = await fetch('api/lotteries/' + extraction.lotteryId + '/next-extraction', {
      method: 'POST',
      body: JSON.stringify(extraction),
    });
    manageHttpResponse(res);
    return await res.json();
  }
}
