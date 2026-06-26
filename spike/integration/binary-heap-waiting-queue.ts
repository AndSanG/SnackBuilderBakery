import { BakeableItem } from '../../src/kitchen/domain/kitchen';
import { WaitingQueue } from '../../src/kitchen/domain/waiting-queue';

interface Node {
  item: BakeableItem;
  arrival: number;
}

const compare = (a: Node, b: Node): number =>
  a.item.priority - b.item.priority || a.arrival - b.arrival;

// A binary min-heap behind the real WaitingQueue seam. take() pops in O(log Q),
// but ordered() (needed by the estimate, non-destructively, in full) has to
// clone and heapsort, which is the cost this measures.
export class BinaryHeapWaitingQueue implements WaitingQueue {
  private heap: Node[] = [];
  private seq = 0;

  enqueue(items: BakeableItem[]): void {
    for (const item of items) {
      this.heap.push({ item, arrival: this.seq++ });
      this.siftUp(this.heap, this.heap.length - 1);
    }
  }

  take(count: number): BakeableItem[] {
    const out: BakeableItem[] = [];
    for (let i = 0; i < count && this.heap.length > 0; i++) {
      out.push(this.pop(this.heap).item);
    }
    return out;
  }

  ordered(extra: BakeableItem[] = []): BakeableItem[] {
    const sortedCurrent = this.sortedClone();
    const extraNodes = extra
      .map((item, i) => ({ item, arrival: this.seq + i }))
      .sort(compare);
    return this.merge(sortedCurrent, extraNodes).map((node) => node.item);
  }

  size(): number {
    return this.heap.length;
  }

  private sortedClone(): Node[] {
    const clone = [...this.heap];
    const out: Node[] = [];
    while (clone.length > 0) out.push(this.pop(clone));
    return out;
  }

  private merge(a: Node[], b: Node[]): Node[] {
    const out: Node[] = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      out.push(compare(a[i], b[j]) <= 0 ? a[i++] : b[j++]);
    }
    while (i < a.length) out.push(a[i++]);
    while (j < b.length) out.push(b[j++]);
    return out;
  }

  private siftUp(heap: Node[], i: number): void {
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (compare(heap[i], heap[parent]) >= 0) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  }

  private pop(heap: Node[]): Node {
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
      if (left < n && compare(heap[left], heap[smallest]) < 0) smallest = left;
      if (right < n && compare(heap[right], heap[smallest]) < 0) smallest = right;
      if (smallest === i) break;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      i = smallest;
    }
  }
}
