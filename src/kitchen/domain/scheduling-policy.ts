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
