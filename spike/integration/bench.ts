// End-to-end benchmark: the alternatives swapped into the REAL Kitchen and the
// REAL OrderRepository port, driven through the actual reconcile / estimate /
// ReconcileOrders code paths. Run: npx ts-node spike/integration/bench.ts

import { Kitchen, BakeableItem } from '../../src/kitchen/domain/kitchen';
import { PriorityPolicy } from '../../src/kitchen/domain/scheduling-policy';
import {
  ArraySortWaitingQueue,
  WaitingQueue,
} from '../../src/kitchen/domain/waiting-queue';
import { BinaryHeapWaitingQueue } from './binary-heap-waiting-queue';
import { SortedInsertWaitingQueue } from './sorted-insert-waiting-queue';
import { InMemoryOrderRepository } from '../../src/orders/infrastructure/in-memory-order-repository';
import { IndexedOrderRepository } from './indexed-order-repository';
import { OrderRepository } from '../../src/orders/application/order-repository';
import { ReconcileOrders } from '../../src/orders/application/reconcile-orders';
import { Order, OrderStatus } from '../../src/orders/domain/order';
import { OrderSource } from '../../src/orders/domain/order-source';
import { Category } from '../../src/shared/domain/category';
import { FakeClock } from '../../src/shared/clock/fake-clock';

const ms = (fn: () => void, repeats: number): number => {
  for (let i = 0; i < 3; i++) fn();
  const start = process.hrtime.bigint();
  for (let i = 0; i < repeats; i++) fn();
  return Number(process.hrtime.bigint() - start) / 1e6 / repeats;
};

const msAsync = async (
  fn: () => Promise<void>,
  repeats: number,
): Promise<number> => {
  for (let i = 0; i < 3; i++) await fn();
  const start = process.hrtime.bigint();
  for (let i = 0; i < repeats; i++) await fn();
  return Number(process.hrtime.bigint() - start) / 1e6 / repeats;
};

const pad = (s: string, n: number): string => s.padEnd(n);
const num = (n: number): string => n.toFixed(4).padStart(10);

const bakeable = (i: number): BakeableItem => ({
  id: `i${i}`,
  orderId: `o${i}`,
  category: Category.Cookie,
  priority: 1 + (i % 3),
});

const queues: [string, () => WaitingQueue][] = [
  ['ArraySort (current)', () => new ArraySortWaitingQueue(new PriorityPolicy())],
  ['SortedInsert', () => new SortedInsertWaitingQueue()],
  ['BinaryHeap', () => new BinaryHeapWaitingQueue()],
];

console.log('\n=== Real Kitchen: build+reconcile, and estimate+readyTimes read ===');
console.log(pad('queue', 22) + ['N', 'build ms', 'read ms'].map((h) => pad(h, 12)).join(''));
for (const N of [100, 1000, 10000]) {
  const items = Array.from({ length: N }, (_, i) => bakeable(i));
  const sample = items.slice(0, 3);
  for (const [name, make] of queues) {
    const build = ms(() => {
      const kitchen = new Kitchen(new PriorityPolicy(), make());
      kitchen.enqueue(items);
      kitchen.reconcile(new Date());
    }, N >= 10000 ? 50 : 500);

    const prebuilt = new Kitchen(new PriorityPolicy(), make());
    prebuilt.enqueue(items);
    prebuilt.reconcile(new Date());
    const read = ms(() => {
      prebuilt.estimateReadyTime(sample, new Date());
      prebuilt.readyTimes(new Date());
    }, N >= 10000 ? 200 : 2000);

    console.log(pad(name, 22) + pad(String(N), 12) + num(build) + '  ' + num(read));
  }
}

const stores: [string, () => OrderRepository][] = [
  ['ScanRepo (current)', () => new InMemoryOrderRepository()],
  ['IndexedRepo', () => new IndexedOrderRepository()],
];

const inKitchenOrder = (i: number): Order => ({
  id: `o${i}`,
  items: [{ id: `o${i}-0`, category: Category.Cookie }],
  source: OrderSource.WalkIn,
  status: OrderStatus.InKitchen,
  totalPrice: 250,
  estimatedReadyTime: new Date('2027-01-01T00:00:00.000Z'), // far future: never flips
});

async function repoBench(): Promise<void> {
  console.log('\n=== Real ReconcileOrders.execute() over T in-kitchen orders ===');
  console.log(pad('repo', 22) + ['T', 'reconcile ms'].map((h) => pad(h, 14)).join(''));
  for (const T of [1000, 10000, 100000]) {
    for (const [name, make] of stores) {
      const repo = make();
      for (let i = 0; i < T; i++) await repo.save(inKitchenOrder(i));
      const reconcile = new ReconcileOrders(repo, new FakeClock());
      const avg = await msAsync(() => reconcile.execute(), T >= 100000 ? 200 : 1000);
      console.log(pad(name, 22) + pad(String(T), 14) + num(avg));
    }
  }
  console.log('');
}

void repoBench();
