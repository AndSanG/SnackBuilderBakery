import { Order, OrderStatus } from '../domain/order';
import { OrderRepository } from '../application/order-repository';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    // Full scan. A secondary index does not help here: InKitchen matches most
    // orders, so the query is not selective. The selective-query win comes from
    // the database index in the persistence work, not a hand-rolled one.
    // See docs/decisions/scheduling-data-structures.md.
    return [...this.orders.values()].filter((order) => order.status === status);
  }
}
