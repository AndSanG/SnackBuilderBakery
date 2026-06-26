import { makespan } from './simulate';
import { ArrayScanSlotQueue } from './slot-queue';

// Two capacity models, compared by makespan (simulated minutes to finish all
// items), not wall-clock. This is a domain question, not a data structure one.

// Current model: one item per slot. Each item is its own job.
export const singleMakespan = (durations: number[], slotCount: number): number =>
  makespan(slotCount, durations, (n) => new ArrayScanSlotQueue(n));

// Alternative: a slot (tray) bakes up to traySize same-duration items at once.
// Items of the same bake time are packed into batches; each batch is one job.
export const batchedMakespan = (
  durations: number[],
  slotCount: number,
  traySize: number,
): number => {
  const counts = new Map<number, number>();
  for (const duration of durations) {
    counts.set(duration, (counts.get(duration) ?? 0) + 1);
  }
  const batchJobs: number[] = [];
  for (const [duration, count] of counts) {
    const batches = Math.ceil(count / traySize);
    for (let i = 0; i < batches; i++) batchJobs.push(duration);
  }
  return makespan(slotCount, batchJobs, (n) => new ArrayScanSlotQueue(n));
};
