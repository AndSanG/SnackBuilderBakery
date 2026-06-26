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

  // The get, the check, and the set run synchronously with no await between
  // them, so the event loop cannot interleave a second claim: exactly one
  // concurrent caller flips AwaitingPayment to PaymentProcessing.
  //
  // ponytail: in-memory compare-and-set. A database does the same with
  // UPDATE ... SET status='PaymentProcessing' WHERE id=? AND status='AwaitingPayment'
  // and checking the affected row count. An idempotency key for safe client
  // retries is a separate, request-scoped concern that belongs at the gateway
  // boundary when a real card gateway lands, not here.
  async claimForPayment(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order || order.status !== OrderStatus.AwaitingPayment) {
      return null;
    }
    const claimed = { ...order, status: OrderStatus.PaymentProcessing };
    this.orders.set(id, claimed);
    return claimed;
  }
}
