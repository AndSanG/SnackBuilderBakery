import { Kitchen, BakeableItem } from '../../src/kitchen/domain/kitchen';
import { PriorityPolicy } from '../../src/kitchen/domain/scheduling-policy';
import {
  ArraySortWaitingQueue,
  WaitingQueue,
} from '../../src/kitchen/domain/waiting-queue';
import { BinaryHeapWaitingQueue } from './binary-heap-waiting-queue';
import { SortedInsertWaitingQueue } from './sorted-insert-waiting-queue';
import { Category } from '../../src/shared/domain/category';

const items: BakeableItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `i${i}`,
  orderId: `o${i % 5}`,
  category: [Category.Cookie, Category.Pastry, Category.Bread][i % 3],
  priority: 1 + (i % 3),
}));

const ids = (list: BakeableItem[]): string[] => list.map((i) => i.id);

const run = (queue: WaitingQueue) => {
  const clock = new Date('2026-01-01T00:00:00.000Z');
  const kitchen = new Kitchen(new PriorityPolicy(), queue);
  kitchen.enqueue(items);
  kitchen.reconcile(clock);
  const later = new Date(clock.getTime() + 10 * 60_000);
  kitchen.reconcile(later);
  return {
    baking: ids(kitchen.baking()).sort(),
    waiting: ids(kitchen.waiting()).sort(),
    readyTimes: [...kitchen.readyTimes(later)].map(([k, v]) => `${k}:${v.getTime()}`).sort(),
  };
};

describe('WaitingQueue swaps preserve real Kitchen behavior', () => {
  it('ArraySort, SortedInsert and BinaryHeap drive the Kitchen identically', () => {
    const reference = run(new ArraySortWaitingQueue(new PriorityPolicy()));
    const sorted = run(new SortedInsertWaitingQueue());
    const heap = run(new BinaryHeapWaitingQueue());

    expect(sorted).toEqual(reference);
    expect(heap).toEqual(reference);
  });
});
