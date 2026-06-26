import { SlotQueue } from './slot-queue';

// Schedules jobs (bake durations) onto slots greedily, earliest-free first, and
// returns the makespan: when the last job finishes. This is the kitchen's
// forward simulation, isolated and parameterized by slot count and structure.
export const makespan = (
  slotCount: number,
  durations: number[],
  make: (slotCount: number) => SlotQueue,
): number => {
  const slots = make(slotCount);
  let span = 0;
  for (const duration of durations) {
    span = Math.max(span, slots.assign(duration));
  }
  return span;
};
