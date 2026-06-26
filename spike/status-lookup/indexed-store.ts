import { OrderStore, StoredOrder } from './order-store';

// Alternative B: a secondary index, status -> set of order ids, maintained on
// save. findByStatus is then O(matches). The cost is the bookkeeping: a save
// that changes an order's status must remove it from its old status set before
// adding it to the new one. That status-change path is the bug surface a plain
// scan never has.
export class IndexedStore implements OrderStore {
  private readonly orders = new Map<string, StoredOrder>();
  private readonly byStatus = new Map<string, Set<string>>();

  save(order: StoredOrder): void {
    const previous = this.orders.get(order.id);
    if (previous && previous.status !== order.status) {
      this.byStatus.get(previous.status)?.delete(order.id);
    }
    this.orders.set(order.id, order);
    let ids = this.byStatus.get(order.status);
    if (!ids) {
      ids = new Set();
      this.byStatus.set(order.status, ids);
    }
    ids.add(order.id);
  }

  findById(id: string): StoredOrder | null {
    return this.orders.get(id) ?? null;
  }

  findByStatus(status: string): StoredOrder[] {
    const ids = this.byStatus.get(status);
    if (!ids) return [];
    return [...ids].map((id) => this.orders.get(id) as StoredOrder);
  }
}
