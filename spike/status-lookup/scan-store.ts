import { OrderStore, StoredOrder } from './order-store';

// Alternative A (current production choice): one hash map, scan to filter.
// save is O(1); findByStatus walks every order, O(T). Nothing to keep in sync.
export class ScanStore implements OrderStore {
  private readonly orders = new Map<string, StoredOrder>();

  save(order: StoredOrder): void {
    this.orders.set(order.id, order);
  }

  findById(id: string): StoredOrder | null {
    return this.orders.get(id) ?? null;
  }

  findByStatus(status: string): StoredOrder[] {
    return [...this.orders.values()].filter((o) => o.status === status);
  }
}
