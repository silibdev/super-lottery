export interface LotteryInfo {
  name: string;
  owner: string;
  participants: number;
  previousExtractions: ExtractionInfo[];
  nextExtraction?: ExtractionInfo;
}

export interface ExtractionInfo {
  lotteryId?: string;
  extractionTime: string;
  winningNumbers: number[];
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
