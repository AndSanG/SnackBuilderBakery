import { OrderStatus } from '../domain/order';
import { OrderRepository } from './order-repository';
import { Clock } from '../../shared/clock/clock';

// Advances order statuses to the current time: an order in the kitchen becomes
// ready once the clock passes its estimated ready time.
//
// ponytail: readiness is derived from estimatedReadyTime, not by asking the
// kitchen which items finished. The forward-sim estimate is the exact
// completion time of the order's last item, so passing it means ready. This
// stays valid under priority scheduling because ConfirmPayment re-saves the
// refreshed estimate of every order a higher-priority order bumps (the VIP
// ripple), keeping each stored estimate current.
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
