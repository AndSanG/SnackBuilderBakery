// Micro-benchmark for the spike. Run: npx ts-node spike/bench.ts
//
// Times the two access patterns the kitchen and orders actually use:
//   queue:  build the waiting set, then read it in bake order (every reconcile)
//   store:  save orders, then findByStatus (every reconcile / ripple)

import { WaitingQueue } from './scheduling-queue/waiting-queue';
import { ArraySortQueue } from './scheduling-queue/array-sort-queue';
import { SortedInsertQueue } from './scheduling-queue/sorted-insert-queue';
import { BinaryHeapQueue } from './scheduling-queue/binary-heap-queue';
import { OrderStore } from './status-lookup/order-store';
import { ScanStore } from './status-lookup/scan-store';
import { IndexedStore } from './status-lookup/indexed-store';

const ms = (fn: () => void, repeats: number): number => {
  for (let i = 0; i < 3; i++) fn(); // warm up
  const start = process.hrtime.bigint();
  for (let i = 0; i < repeats; i++) fn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6 / repeats;
};

const pad = (s: string, n: number): string => s.padEnd(n);
const num = (n: number): string => n.toFixed(4).padStart(10);

console.log('\n=== Scheduling queue: build N then one ordered() read ===');
console.log(pad('impl', 20) + ['N', 'build ms', 'read ms'].map((h) => pad(h, 12)).join(''));
const queueFactories: [string, () => WaitingQueue][] = [
  ['ArraySortQueue', () => new ArraySortQueue()],
  ['SortedInsertQueue', () => new SortedInsertQueue()],
  ['BinaryHeapQueue', () => new BinaryHeapQueue()],
];
for (const N of [100, 1000, 10000]) {
  const priorities = Array.from({ length: N }, () => Math.ceil(Math.random() * 3));
  for (const [name, make] of queueFactories) {
    const build = ms(() => {
      const q = make();
      priorities.forEach((p, i) => q.enqueue({ id: `i${i}`, priority: p }));
    }, N >= 10000 ? 50 : 500);

    const prebuilt = make();
    priorities.forEach((p, i) => prebuilt.enqueue({ id: `i${i}`, priority: p }));
    const read = ms(() => void prebuilt.ordered(), N >= 10000 ? 200 : 2000);

    console.log(pad(name, 20) + pad(String(N), 12) + num(build) + '  ' + num(read));
  }
}

console.log('\n=== Status lookup: findByStatus over T orders, and one save ===');
console.log(pad('impl', 16) + ['T', 'find ms', 'save ms'].map((h) => pad(h, 12)).join(''));
const storeFactories: [string, () => OrderStore][] = [
  ['ScanStore', () => new ScanStore()],
  ['IndexedStore', () => new IndexedStore()],
];
const STATUSES = ['AwaitingPayment', 'InKitchen', 'Ready'];
for (const T of [1000, 10000, 100000]) {
  for (const [name, make] of storeFactories) {
    const store = make();
    for (let i = 0; i < T; i++) {
      store.save({ id: `o${i}`, status: STATUSES[i % STATUSES.length] });
    }
    const find = ms(() => void store.findByStatus('InKitchen'), 2000);
    let k = 0;
    const save = ms(() => {
      store.save({ id: `o${k++ % T}`, status: STATUSES[k % STATUSES.length] });
    }, 5000);
    console.log(pad(name, 16) + pad(String(T), 12) + num(find) + '  ' + num(save));
  }
}
console.log('');
