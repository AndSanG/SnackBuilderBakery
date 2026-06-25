import { OrderStatus } from '../domain/order';
import { OrderRepository } from './order-repository';
import { OrderNotFoundError } from './order-errors';

export interface OrderStatusView {
  orderId: string;
  status: OrderStatus;
  // TODO: add estimatedReadyTime once ConfirmPayment (pending the Kitchen)
  // sets it on the order. Omitted now because the field does not exist yet.
}

export class TrackOrder {
  constructor(private readonly orders: OrderRepository) {}

  async execute(id: string): Promise<OrderStatusView> {
    const order = await this.orders.findById(id);
    if (order === null) {
      throw new OrderNotFoundError(id);
    }
    return { orderId: order.id, status: order.status };
  }
}
