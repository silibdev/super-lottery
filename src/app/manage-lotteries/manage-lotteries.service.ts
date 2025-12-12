import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ManageLotteriesService {
  async loadLotteries() {
    const res = await fetch('api/lotteries');
    return await res.json();
  }

  async createLottery(name: string) {
    const res = await fetch('api/lotteries', {method: 'POST', body: JSON.stringify({name})});
    return await res.json();
  }
}
