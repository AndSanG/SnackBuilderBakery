import { byBakeOrder, Node, QueueItem, WaitingQueue } from './waiting-queue';

// Alternative C: a binary min-heap keyed on bake order. enqueue sifts up in
// O(log Q). The textbook "priority queue" structure.
//
// The catch for this use case: the kitchen needs the *whole* queue in order,
// non-destructively, every read. A heap only cheaply yields the minimum, so
// ordered() must clone the heap and pop everything (a heapsort), O(Q log Q),
// plus an O(Q) clone. The heap only pays off when you pop one item at a time
// and never need the full ordering, which is not this access pattern.
export class BinaryHeapQueue implements WaitingQueue {
  private heap: Node[] = [];
  private seq = 0;

  enqueue(item: QueueItem): void {
    this.heap.push({ ...item, arrival: this.seq++ });
    this.siftUp(this.heap.length - 1);
  }

  ordered(): QueueItem[] {
    const clone = [...this.heap];
    const out: QueueItem[] = [];
    while (clone.length > 0) {
      const min = this.popFrom(clone);
      out.push({ id: min.id, priority: min.priority });
    }
    return out;
  }

  size(): number {
    return this.heap.length;
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (byBakeOrder(this.heap[i], this.heap[parent]) >= 0) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  private popFrom(heap: Node[]): Node {
    const top = heap[0];
    const last = heap.pop() as Node;
    if (heap.length > 0) {
      heap[0] = last;
      this.siftDown(heap, 0);
    }
    return top;
  }

  private siftDown(heap: Node[], i: number): void {
    const n = heap.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < n && byBakeOrder(heap[left], heap[smallest]) < 0) smallest = left;
      if (right < n && byBakeOrder(heap[right], heap[smallest]) < 0) smallest = right;
      if (smallest === i) break;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      i = smallest;
    }
  }
}
