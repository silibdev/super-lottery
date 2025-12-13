import { Injectable } from '@angular/core';
import { manageHttpResponse } from '../utils';
import { AppResponse, ExtractionInfo, LotteryInfoForParticipant } from '../models';

@Injectable({
  providedIn: 'root',
})
export class JoinedLotteryService {
  async getJoinedLottery(id: string): Promise<AppResponse<LotteryInfoForParticipant>> {
    const res = await fetch('api/joined-lotteries/' + id);
    manageHttpResponse(res);
    return await res.json();
  }

  async getExtraction({
    lotteryId,
    extractionId,
  }: {
    lotteryId: any;
    extractionId: any;
  }): Promise<AppResponse<ExtractionInfo>> {
    const res = await fetch('api/lotteries/' + lotteryId + '/extractions/' + extractionId);
    manageHttpResponse(res);
    return await res.json();
  }

  async saveChosenNumbers({
    lotteryId,
    chosenNumbers,
  }: {
    lotteryId: string;
    chosenNumbers: number[];
  }) {
    const res = await fetch('api/joined-lotteries/' + lotteryId, {
      method: 'PUT',
      body: JSON.stringify({ chosenNumbers }),
    });
    manageHttpResponse(res);
    return await res.json();
  }
}
