export interface LotteryInfo {
  name: string;
  owner: string;
  participants: number;
  extractions: number;
  lastExtraction?: string;
  nextExtraction?: string;
}

export interface LotteryOwner {
  id: string;
  lotteries: string[];
}

export interface AppMessage {
  type: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
  description: string;
}

export interface AppResponse<D> {
  data: D;
}
