import { byBakeOrder, Node, QueueItem, WaitingQueue } from './waiting-queue';

// Alternative B: keep the array sorted at all times. enqueue binary-searches the
// insertion point (O(log Q) compares) then splices it in (O(Q) shift); ordered()
// is just a copy, O(Q), because the array is already in bake order. Trades read
// cost for write cost.
export class SortedInsertQueue implements WaitingQueue {
  private items: Node[] = [];
  private seq = 0;

  enqueue(item: QueueItem): void {
    const node: Node = { ...item, arrival: this.seq++ };
    let lo = 0;
    let hi = this.items.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (byBakeOrder(this.items[mid], node) <= 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this.items.splice(lo, 0, node);
  }

  ordered(): QueueItem[] {
    return this.items.map(({ id, priority }) => ({ id, priority }));
  }

  size(): number {
    return this.items.length;
  }
}
