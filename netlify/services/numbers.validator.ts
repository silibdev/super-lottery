import { AppError } from '../utils';

export class NumbersValidator {
  static validate(numbers: number[]): number[] {
    if (!numbers || numbers.length !== 10) {
      throw new AppError(400, `Invalid numbers length ${numbers?.length}. It must be 10.`);
    }
    if (new Set(numbers).size !== 10) {
      throw new AppError(400, `Invalid winning numbers. They must be unique.`);
    }
    return [...numbers].sort();
  }
}
