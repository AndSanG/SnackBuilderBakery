import { Order, OrderStatus } from '../domain/order';

export const ORDER_REPOSITORY = Symbol('OrderRepository');

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  // Atomically claim an awaiting order for payment: if it is AwaitingPayment,
  // flip it to PaymentProcessing and return it; otherwise return null. The
  // check and the write are one step, so two concurrent callers cannot both
  // claim the same order (an order is charged at most once).
  claimForPayment(id: string): Promise<Order | null>;
  // Atomically refresh an order's estimated ready time, but only while it is
  // still InKitchen. Same compare-and-set shape as claimForPayment: the check
  // and the write are one step, so a stale VIP-ripple estimate cannot clobber
  // an order that ReconcileOrders has just advanced to Ready (no status
  // regression). A no-op if the order is gone or no longer InKitchen.
  updateEstimateIfInKitchen(id: string, estimatedReadyTime: Date): Promise<void>;
}
