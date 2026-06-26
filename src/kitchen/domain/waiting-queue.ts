import { BakeableItem } from './kitchen';
import { FifoPolicy, SchedulingPolicy } from './scheduling-policy';

// Spike seam: lets the Kitchen's waiting set be backed by different data
// structures so the alternatives can be measured on the real reconcile and
// estimate paths. The Kitchen needs three things from it: enqueue, take the
// next N in bake order (reconcile), and read the order non-destructively with
// the new order's items merged in (estimate).
export interface WaitingQueue {
  enqueue(items: BakeableItem[]): void;
  take(count: number): BakeableItem[];
  ordered(extra?: BakeableItem[]): BakeableItem[];
  size(): number;
}

// The production structure: a plain array, ordered on read via the policy.
export class ArraySortWaitingQueue implements WaitingQueue {
  private items: BakeableItem[] = [];

  constructor(private readonly policy: SchedulingPolicy = new FifoPolicy()) {}

  enqueue(items: BakeableItem[]): void {
    this.items.push(...items);
  }

  take(count: number): BakeableItem[] {
    const ordered = this.policy.order(this.items);
    const taken = ordered.slice(0, count);
    const takenIds = new Set(taken.map((item) => item.id));
    this.items = this.items.filter((item) => !takenIds.has(item.id));
    return taken;
  }

  ordered(extra: BakeableItem[] = []): BakeableItem[] {
    return this.policy.order([...this.items, ...extra]);
  }

  size(): number {
    return this.items.length;
  }
}
