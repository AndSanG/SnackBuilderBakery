import { makespan } from './simulate';
import { ArrayScanSlotQueue, HeapSlotQueue } from './slot-queue';
import { singleMakespan, batchedMakespan } from './batch';

const randomDurations = (n: number): number[] =>
  Array.from({ length: n }, () => [5, 10, 20][Math.floor(Math.random() * 3)]);

describe('slot picker alternatives', () => {
  it('array scan and min-heap produce the same makespan', () => {
    for (const slotCount of [6, 64, 512]) {
      const durations = randomDurations(2000);
      const byArray = makespan(slotCount, durations, (n) => new ArrayScanSlotQueue(n));
      const byHeap = makespan(slotCount, durations, (n) => new HeapSlotQueue(n));
      expect(byHeap).toBe(byArray);
    }
  });
});

describe('batch baking', () => {
  it('never finishes later than single-item baking, and usually sooner', () => {
    const durations = randomDurations(600);
    const single = singleMakespan(durations, 6);
    const batched = batchedMakespan(durations, 6, 12);
    expect(batched).toBeLessThanOrEqual(single);
  });
});
