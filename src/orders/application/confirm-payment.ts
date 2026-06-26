import { Order, OrderStatus } from '../domain/order';
import { Payment, PaymentRecord } from '../domain/payment';
import { priorityTierFor } from '../domain/priority-tier';
import { OrderRepository } from './order-repository';
import { KitchenItem, KitchenService } from './kitchen-service';
import { PaymentProcessor } from './payment-processor';
import { OrderAlreadyConfirmedError, OrderNotFoundError } from './order-errors';

export interface Confirmation {
  orderId: string;
  status: OrderStatus;
  estimatedReadyTime: Date;
  payment: PaymentRecord;
}

export class ConfirmPayment {
  constructor(
    private readonly orders: OrderRepository,
    private readonly kitchen: KitchenService,
    private readonly payments: PaymentProcessor,
  ) {}

  async execute(orderId: string, payment: Payment): Promise<Confirmation> {
    const existing = await this.orders.findById(orderId);
    if (existing === null) {
      throw new OrderNotFoundError(orderId);
    }
    if (existing.status !== OrderStatus.AwaitingPayment) {
      throw new OrderAlreadyConfirmedError(orderId);
    }

    // Atomically claim the order before charging, so a payment is processed at
    // most once even if two confirmations race: the loser sees the order in
    // PaymentProcessing and is rejected here, before the charge.
    const order = await this.orders.claimForPayment(orderId);
    if (order === null) {
      throw new OrderAlreadyConfirmedError(orderId);
    }

    // Settle payment. A decline releases the claim so the customer can retry,
    // and the order never enters the kitchen unpaid.
    let settled: PaymentRecord;
    try {
      settled = await this.payments.process(order.totalPrice, payment);
    } catch (error) {
      await this.orders.save({
        ...order,
        status: OrderStatus.AwaitingPayment,
      });
      throw error;
    }

    const priority = priorityTierFor(order.source);
    const kitchenItems: KitchenItem[] = order.items.map((item) => ({
      id: item.id,
      orderId: order.id,
      category: item.category,
      priority,
    }));

    const estimatedReadyTime =
      await this.kitchen.enqueueAndEstimate(kitchenItems);

    const confirmed: Order = {
      ...order,
      status: OrderStatus.InKitchen,
      estimatedReadyTime,
      payment: settled,
    };
    await this.orders.save(confirmed);

    await this.refreshBumpedEstimates(order.id);

    return {
      orderId: order.id,
      status: OrderStatus.InKitchen,
      estimatedReadyTime,
      payment: settled,
    };
  }

  // VIP ripple: enqueueing a higher-priority order can push lower-priority
  // orders back in the queue, so their stored estimates go stale. Recompute
  // every in-kitchen order's ready time from the new queue and save the ones
  // that changed.
  //
  // Concurrent-safety note: if another ConfirmPayment interleaves between
  // readyTimes() and findByStatus(), its newly-added order might not appear in
  // this ripple. That order's own ConfirmPayment runs its own ripple afterward,
  // so estimates converge without any extra coordination.
  //
  // The estimate is written through updateEstimateIfInKitchen, not save: the
  // inKitchen list is a snapshot, and a concurrent ReconcileOrders may flip one
  // of those orders to Ready before we reach it here. The guarded update writes
  // only while the order is still InKitchen, so a stale estimate can never
  // resurrect a Ready order back into the kitchen.
  private async refreshBumpedEstimates(justConfirmedId: string): Promise<void> {
    const readyTimes = await this.kitchen.readyTimes();
    const inKitchen = await this.orders.findByStatus(OrderStatus.InKitchen);

    for (const other of inKitchen) {
      if (other.id === justConfirmedId) {
        continue;
      }
      const refreshed = readyTimes.get(other.id);
      if (
        refreshed &&
        refreshed.getTime() !== other.estimatedReadyTime?.getTime()
      ) {
        await this.orders.updateEstimateIfInKitchen(other.id, refreshed);
      }
    }
  }
}
