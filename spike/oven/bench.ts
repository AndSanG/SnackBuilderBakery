// Oven-side benchmarks. Run: npx ts-node spike/oven/bench.ts
//   1) slot picker (array scan vs min-heap) as the oven count grows
//   2) batch baking makespan vs single-item, in simulated minutes

import { makespan } from './simulate';
import { ArrayScanSlotQueue, HeapSlotQueue } from './slot-queue';
import { singleMakespan, batchedMakespan } from './batch';

const ms = (fn: () => void, repeats: number): number => {
  for (let i = 0; i < 3; i++) fn();
  const start = process.hrtime.bigint();
  for (let i = 0; i < repeats; i++) fn();
  return Number(process.hrtime.bigint() - start) / 1e6 / repeats;
};

const pad = (s: string, n: number): string => s.padEnd(n);
const num = (n: number): string => n.toFixed(4).padStart(10);

const durations = (n: number): number[] =>
  Array.from({ length: n }, () => [5, 10, 20][Math.floor(Math.random() * 3)]);

console.log('\n=== Slot picker: forward-simulate 50000 jobs as oven count S grows ===');
console.log(pad('picker', 16) + ['S (ovens)', 'sim ms'].map((h) => pad(h, 12)).join(''));
const jobs = durations(50000);
for (const S of [6, 64, 512, 4096]) {
  for (const [name, make] of [
    ['ArrayScan', (n: number) => new ArrayScanSlotQueue(n)],
    ['MinHeap', (n: number) => new HeapSlotQueue(n)],
  ] as [string, (n: number) => ArrayScanSlotQueue | HeapSlotQueue][]) {
    const t = ms(() => void makespan(S, jobs, make), S >= 512 ? 20 : 200);
    console.log(pad(name, 16) + pad(String(S), 12) + num(t));
  }
}

console.log('\n=== Batch baking: makespan in simulated minutes (6 ovens, tray 12) ===');
console.log(pad('items', 10) + ['single min', 'batched min', 'speedup'].map((h) => pad(h, 14)).join(''));
for (const N of [60, 600, 6000]) {
  const items = durations(N);
  const single = singleMakespan(items, 6);
  const batched = batchedMakespan(items, 6, 12);
  console.log(
    pad(String(N), 10) +
      pad(String(single), 14) +
      pad(String(batched), 14) +
      `${(single / batched).toFixed(1)}x`,
  );
}
console.log('');
