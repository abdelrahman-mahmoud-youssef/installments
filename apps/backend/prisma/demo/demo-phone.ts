import { RandomSource } from './random';

const MOBILE_PREFIXES = ['010', '011', '012', '015'] as const;
const SUBSCRIBER_DIGIT_COUNT = 8;

export function createPhoneGenerator(random: RandomSource): () => string {
  const usedNumbers = new Set<string>();

  return () => {
    let phone: string;
    do {
      const subscriber = Array.from({ length: SUBSCRIBER_DIGIT_COUNT }, () => random.integer(0, 9)).join('');
      phone = `${random.pick(MOBILE_PREFIXES)}${subscriber}`;
    } while (usedNumbers.has(phone));
    usedNumbers.add(phone);
    return phone;
  };
}
