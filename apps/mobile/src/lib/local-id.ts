const RADIX = 36;
const RANDOM_SUFFIX_LENGTH = 8;

export function createLocalId(): string {
  const timestamp = Date.now().toString(RADIX);
  const random = Math.random().toString(RADIX).slice(2, 2 + RANDOM_SUFFIX_LENGTH);
  return `${timestamp}-${random}`;
}
