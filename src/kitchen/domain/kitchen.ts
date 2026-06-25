import { Category, bakeDurationMinutes } from '../../shared/domain/category';

export const OVEN_SLOTS = 6; // 2 ovens x 3 trays

// A unit of work the kitchen bakes: one item per oven slot. Carries its
// category (for bake time) and the order it belongs to.
export interface BakeableItem {
  id: string;
  orderId: string;
  category: Category;
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
  private queue: BakeableItem[] = [];

  enqueue(items: BakeableItem[]): void {
    this.queue.push(...items);
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
    return [...this.queue];
  }

  // Forward-simulates the schedule on copies of the slot and queue state to
  // find when the order's last item finishes. Changes nothing, so the estimate
  // can never drift from how reconcile actually schedules.
  estimateReadyTime(orderItems: BakeableItem[], now: Date): Date {
    const slotFreeTimes = this.slots.map((slot) =>
      slot === null ? now.getTime() : this.finishTimeOf(slot),
    );
    const pending = [...this.queue, ...orderItems];
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

  private completeFinished(now: Date): void {
    this.slots = this.slots.map((slot) =>
      slot !== null && this.isDone(slot, now) ? null : slot,
    );
  }

  private fillFreeSlots(now: Date): void {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null && this.queue.length > 0) {
        const next = this.queue.shift() as BakeableItem;
        this.slots[i] = { item: next, startedAt: now };
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
