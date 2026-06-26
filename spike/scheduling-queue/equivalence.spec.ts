import { WaitingQueue } from './waiting-queue';
import { ArraySortQueue } from './array-sort-queue';
import { SortedInsertQueue } from './sorted-insert-queue';
import { BinaryHeapQueue } from './binary-heap-queue';

const build = (factory: () => WaitingQueue, priorities: number[]): string[] => {
  const queue = factory();
  priorities.forEach((priority, i) => queue.enqueue({ id: `i${i}`, priority }));
  return queue.ordered().map((item) => item.id);
};

describe('WaitingQueue implementations are equivalent', () => {
  const factories: [string, () => WaitingQueue][] = [
    ['ArraySortQueue', () => new ArraySortQueue()],
    ['SortedInsertQueue', () => new SortedInsertQueue()],
    ['BinaryHeapQueue', () => new BinaryHeapQueue()],
  ];

  it('orders by priority then arrival, identically for all three', () => {
    const priorities = [3, 1, 2, 1, 3, 2, 1, 3]; // ties across tiers
    const results = factories.map(([, make]) => build(make, priorities));

    // expected: tier 1 (arrivals 1,3,6), tier 2 (2,5), tier 3 (0,4,7)
    const expected = ['i1', 'i3', 'i6', 'i2', 'i5', 'i0', 'i4', 'i7'];
    for (const result of results) {
      expect(result).toEqual(expected);
    }
  });

  it('agrees on 500 random items (stable within a tier)', () => {
    const priorities = Array.from({ length: 500 }, () =>
      Math.ceil(Math.random() * 3),
    );
    const [reference, ...rest] = factories.map(([, make]) =>
      build(make, priorities),
    );
    for (const result of rest) {
      expect(result).toEqual(reference);
    }
  });
});
