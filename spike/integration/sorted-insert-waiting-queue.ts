import { BakeableItem } from '../../src/kitchen/domain/kitchen';
import { WaitingQueue } from '../../src/kitchen/domain/waiting-queue';

interface Node {
  item: BakeableItem;
  arrival: number;
}

const compare = (a: Node, b: Node): number =>
  a.item.priority - b.item.priority || a.arrival - b.arrival;

// Keeps the waiting set sorted by bake order at all times behind the real
// WaitingQueue seam. take() is O(count) (already sorted) and ordered() is a
// merge, but enqueue pays an O(Q) splice.
export class SortedInsertWaitingQueue implements WaitingQueue {
  private nodes: Node[] = [];
  private seq = 0;

  enqueue(items: BakeableItem[]): void {
    for (const item of items) {
      const node: Node = { item, arrival: this.seq++ };
      let lo = 0;
      let hi = this.nodes.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (compare(this.nodes[mid], node) <= 0) lo = mid + 1;
        else hi = mid;
      }
      this.nodes.splice(lo, 0, node);
    }
  }

  take(count: number): BakeableItem[] {
    return this.nodes.splice(0, count).map((node) => node.item);
  }

  ordered(extra: BakeableItem[] = []): BakeableItem[] {
    const extraNodes = extra
      .map((item, i) => ({ item, arrival: this.seq + i }))
      .sort(compare);
    return this.merge(this.nodes, extraNodes).map((node) => node.item);
  }

  size(): number {
    return this.nodes.length;
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
}
