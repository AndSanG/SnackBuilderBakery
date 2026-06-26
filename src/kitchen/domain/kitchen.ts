import { Category, bakeDurationMinutes } from '../../shared/domain/category';
import { FifoPolicy, SchedulingPolicy } from './scheduling-policy';
import { ArraySortWaitingQueue, WaitingQueue } from './waiting-queue';

export const OVEN_SLOTS = 6; // 2 ovens x 3 trays

// A unit of work the kitchen bakes: one item per oven slot. Carries its
// category (for bake time), the order it belongs to, and a priority (lower
// bakes first) the scheduling policy orders by. The kitchen treats priority as
// an opaque number, so it never needs to know about order sources or tiers.
export interface BakeableItem {
  id: string;
  orderId: string;
  category: Category;
  priority: number;
}

interface BakingItem {
  item: BakeableItem;
  startedAt: Date;
}

// Poll-based kitchen: it has no timers. State advances only when reconcile is
// called with the current time. A slot holds a baking item or is empty (null).
//
// ponytail: single in-memory Kitchen instance, no locking. Node's
// single-threaded event loop serializes mutations, so there is no race within
// one process. Add real locking only if this moves to multiple processes or a
// shared store.
export class Kitchen {
  private slots: (BakingItem | null)[] = new Array<BakingItem | null>(
    OVEN_SLOTS,
  ).fill(null);

  constructor(
    policy: SchedulingPolicy = new FifoPolicy(),
    private readonly queue: WaitingQueue = new ArraySortWaitingQueue(policy),
  ) {}

  enqueue(items: BakeableItem[]): void {
    this.queue.enqueue(items);
  }

  reconcile(now: Date): void {
    this.completeFinished(now);
    this.fillFreeSlots(now);
  }

  baking(): BakeableItem[] {
    return this.slots
      .filter((slot): slot is BakingItem => slot !== null)
      .map((slot) => slot.item);
  }

  waiting(): BakeableItem[] {
    return this.queue.ordered();
  }

  // Forward-simulates the schedule on copies of the slot and queue state to
  // find when the order's last item finishes. Changes nothing, so the estimate
  // can never drift from how reconcile actually schedules.
  estimateReadyTime(orderItems: BakeableItem[], now: Date): Date {
    const slotFreeTimes = this.slots.map((slot) =>
      slot === null ? now.getTime() : this.finishTimeOf(slot),
    );
    const pending = this.queue.ordered(orderItems);
    const orderItemIds = new Set(orderItems.map((item) => item.id));

    let latestFinish = now.getTime();
    for (const item of pending) {
      const earliest = Math.min(...slotFreeTimes);
      const slot = slotFreeTimes.indexOf(earliest);
      const finish = earliest + bakeDurationMinutes[item.category] * 60_000;
      slotFreeTimes[slot] = finish;
      if (orderItemIds.has(item.id)) {
        latestFinish = Math.max(latestFinish, finish);
      }
    }
    return new Date(latestFinish);
  }

  // Forward-simulates the current state (no new items) and returns when each
  // order in the kitchen will be ready: the finish time of its last item. Used
  // to refresh stored estimates after a higher-priority order reorders the
  // queue (the VIP ripple).
  //
  // ponytail: this mirrors estimateReadyTime's slot-assignment loop. Both order
  // the queue through the same WaitingQueue, so they stay consistent; keep them
  // in sync if the scheduling math changes.
  readyTimes(now: Date): Map<string, Date> {
    const slotFreeTimes = this.slots.map((slot) =>
      slot === null ? now.getTime() : this.finishTimeOf(slot),
    );
    const finishByOrder = new Map<string, number>();
    const record = (orderId: string, finish: number): void => {
      finishByOrder.set(
        orderId,
        Math.max(finishByOrder.get(orderId) ?? finish, finish),
      );
    };

    for (const slot of this.slots) {
      if (slot !== null) {
        record(slot.item.orderId, this.finishTimeOf(slot));
      }
    }
    for (const item of this.queue.ordered()) {
      const earliest = Math.min(...slotFreeTimes);
      const slot = slotFreeTimes.indexOf(earliest);
      const finish = earliest + bakeDurationMinutes[item.category] * 60_000;
      slotFreeTimes[slot] = finish;
      record(item.orderId, finish);
    }
    return new Map([...finishByOrder].map(([id, ms]) => [id, new Date(ms)]));
  }

  private completeFinished(now: Date): void {
    this.slots = this.slots.map((slot) =>
      slot !== null && this.isDone(slot, now) ? null : slot,
    );
  }

  private fillFreeSlots(now: Date): void {
    const freeCount = this.slots.filter((slot) => slot === null).length;
    const taken = this.queue.take(freeCount);
    let next = 0;
    for (let i = 0; i < this.slots.length && next < taken.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = { item: taken[next++], startedAt: now };
      }
    }
  }

  private isDone(baking: BakingItem, now: Date): boolean {
    return this.finishTimeOf(baking) <= now.getTime();
  }

  private finishTimeOf(baking: BakingItem): number {
    return (
      baking.startedAt.getTime() +
      bakeDurationMinutes[baking.item.category] * 60_000
    );
  }
}
