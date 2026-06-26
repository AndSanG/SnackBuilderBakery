import { byBakeOrder, Node, QueueItem, WaitingQueue } from './waiting-queue';

// Alternative A (current production choice): a plain array, sorted on read.
// enqueue is O(1) (append); ordered() sorts a copy, O(Q log Q). The structure
// keeps no order; bake order is derived only when asked.
export class ArraySortQueue implements WaitingQueue {
  private items: Node[] = [];
  private seq = 0;

  enqueue(item: QueueItem): void {
    this.items.push({ ...item, arrival: this.seq++ });
  }

  ordered(): QueueItem[] {
    return [...this.items]
      .sort(byBakeOrder)
      .map(({ id, priority }) => ({ id, priority }));
  }

  size(): number {
    return this.items.length;
  }
}
