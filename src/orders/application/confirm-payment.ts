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
    const order = await this.orders.findById(orderId);
    if (order === null) {
      throw new OrderNotFoundError(orderId);
    }
    if (order.status !== OrderStatus.AwaitingPayment) {
      throw new OrderAlreadyConfirmedError(orderId);
    }

    // Settle payment first. A decline throws and the order stays awaiting
    // payment, so it never enters the kitchen unpaid.
    const settled = await this.payments.process(order.totalPrice, payment);

    const priority = priorityTierFor(order.source);
    const kitchenItems: KitchenItem[] = order.items.map((item) => ({
      id: item.id,
      orderId: order.id,
      category: item.category,
      priority,
    }));

    // Payment auto-succeeds. Estimate before enqueueing so the order's own
    // items are not counted twice in the simulation.
    const estimatedReadyTime =
      await this.kitchen.estimateReadyTime(kitchenItems);
    await this.kitchen.enqueue(kitchenItems);

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
        await this.orders.save({ ...other, estimatedReadyTime: refreshed });
      }
    }
  }
}
