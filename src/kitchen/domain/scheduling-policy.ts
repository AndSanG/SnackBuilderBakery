import { BakeableItem } from './kitchen';

// Decides the order in which waiting items are taken for baking. This is the
// scheduling seam the challenge requires to be an explicit pattern: swap the
// policy, never edit the Kitchen. reconcile and the estimate both order the
// queue through it, so a prediction can never diverge from real scheduling.
export interface SchedulingPolicy {
  order(waiting: readonly BakeableItem[]): BakeableItem[];
}

// First-in, first-out: bake in the order items arrived.
export class FifoPolicy implements SchedulingPolicy {
  order(waiting: readonly BakeableItem[]): BakeableItem[] {
    return [...waiting];
  }
}

// Highest priority first (lower number wins), keeping arrival order within a
// tier so same-priority orders stay fair. No preemption lives in the Kitchen,
// not here: this only orders the waiting queue, never what is already baking.
export class PriorityPolicy implements SchedulingPolicy {
  order(waiting: readonly BakeableItem[]): BakeableItem[] {
    return waiting
      .map((item, arrival) => ({ item, arrival }))
      .sort((a, b) => a.item.priority - b.item.priority || a.arrival - b.arrival)
      .map((entry) => entry.item);
  }
}
