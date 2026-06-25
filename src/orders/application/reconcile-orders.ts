import { OrderStatus } from '../domain/order';
import { OrderRepository } from './order-repository';
import { Clock } from '../../shared/clock/clock';

// Advances order statuses to the current time: an order in the kitchen becomes
// ready once the clock passes its estimated ready time.
//
// ponytail: readiness is derived from estimatedReadyTime, not by asking the
// kitchen which items finished. Under FIFO with no preemption the forward-sim
// estimate is the exact completion time of the order's last item, and later
// orders only append to the queue tail, so a confirmed order's estimate never
// shifts. When priority ordering lands (VIP ripple re-sorts the queue), keep
// this valid by re-saving the new estimates on every reordered order.
export class ReconcileOrders {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<void> {
    const now = this.clock.now().getTime();
    const baking = await this.orders.findByStatus(OrderStatus.InKitchen);

    for (const order of baking) {
      if (order.estimatedReadyTime && order.estimatedReadyTime.getTime() <= now) {
        await this.orders.save({ ...order, status: OrderStatus.Ready });
      }
    }
  }
}
