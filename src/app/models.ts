export interface LotteryInfo {
  name: string;
  owner?: string;
  participants: number;
  previousExtractions: ExtractionInfo[];
  nextExtraction?: ExtractionInfo;
}

export interface ExtractionInfo {
  lotteryId?: string;
  extractionTime: string;
  winningNumbers?: number[];
  chosenNumbers?: number[];
}

export interface LotteriesParticipant {
  participantId: string;
  joinedLotteries: LotteryInfoForParticipant[];
}

export interface LotteryInfoForParticipant {
  name: string;
  chosenNumbers: number[];
  lastUpdateChosenNumbers?: string;
  nextExtraction?: ExtractionInfoForParticipant;
  previousExtractions?: NumbersForExtraction[];
}

export interface NumbersForExtraction {
  extractionId: string;
  chosenNumbers: number[];
}

export type ExtractionInfoForParticipant = Pick<ExtractionInfo, 'extractionTime' | 'lotteryId'>;

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
