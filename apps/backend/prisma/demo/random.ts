export interface RandomSource {
  integer(minimum: number, maximum: number): number;
  chance(probability: number): boolean;
  pick<Item>(items: readonly Item[]): Item;
}

export function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  }

  return {
    integer: (minimum, maximum) => minimum + Math.floor(next() * (maximum - minimum + 1)),
    chance: (probability) => next() < probability,
    pick: (items) => items[Math.floor(next() * items.length)],
  };
}
