import { Order, OrderStatus } from '../domain/order';
import { OrderRepository } from './order-repository';
import { KitchenItem, KitchenService } from './kitchen-service';
import { OrderAlreadyConfirmedError, OrderNotFoundError } from './order-errors';

export interface Confirmation {
  orderId: string;
  status: OrderStatus;
  estimatedReadyTime: Date;
}

export class ConfirmPayment {
  constructor(
    private readonly orders: OrderRepository,
    private readonly kitchen: KitchenService,
  ) {}

  async execute(orderId: string): Promise<Confirmation> {
    const order = await this.orders.findById(orderId);
    if (order === null) {
      throw new OrderNotFoundError(orderId);
    }
    if (order.status !== OrderStatus.AwaitingPayment) {
      throw new OrderAlreadyConfirmedError(orderId);
    }

    const kitchenItems: KitchenItem[] = order.items.map((item) => ({
      id: item.id,
      orderId: order.id,
      category: item.category,
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
    };
    await this.orders.save(confirmed);

    return {
      orderId: order.id,
      status: OrderStatus.InKitchen,
      estimatedReadyTime,
    };
  }
}
