import { Order, OrderStatus } from '../../src/orders/domain/order';
import { OrderRepository } from '../../src/orders/application/order-repository';

// The IndexedStore idea against the real OrderRepository port: a secondary index
// status -> set of ids, maintained on save. Drop-in for InMemoryOrderRepository.
export class IndexedOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();
  private readonly byStatus = new Map<OrderStatus, Set<string>>();

  async save(order: Order): Promise<void> {
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

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const ids = this.byStatus.get(status);
    if (!ids) return [];
    return [...ids].map((id) => this.orders.get(id) as Order);
  }
}
