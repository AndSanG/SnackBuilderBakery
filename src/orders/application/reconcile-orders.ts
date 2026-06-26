import { OrderStatus } from '../domain/order';
import { OrderRepository } from './order-repository';
import { Clock } from '../../shared/clock/clock';
import { KitchenService } from './kitchen-service';

// Advances order statuses to the current time: an order in the kitchen becomes
// ready once the clock passes its actual finish time.
//
// Readiness is derived from the kitchen's live schedule when the order is still
// present there, falling back to the stored estimate once all its items have
// cleared the slots. The live check closes the VIP-bump residual: a stale stored
// estimate (briefly too early after a priority reorder) cannot advance an order
// that the kitchen's forward sim still shows as in-flight.
export class ReconcileOrders {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
    private readonly kitchenService: KitchenService,
  ) {}

  async execute(): Promise<void> {
    const now = this.clock.now().getTime();
    // Concurrent runs are safe: both see the same InKitchen snapshot and both
    // save the same Ready state. The double-write is idempotent.
    const [baking, liveReadyTimes] = await Promise.all([
      this.orders.findByStatus(OrderStatus.InKitchen),
      this.kitchenService.readyTimes(),
    ]);

    for (const order of baking) {
      // Prefer the kitchen's live finish time; fall back to stored estimate when
      // the order's items have already cleared the slots (not in liveReadyTimes).
      const readyTime = liveReadyTimes.get(order.id) ?? order.estimatedReadyTime;
      if (readyTime && readyTime.getTime() <= now) {
        await this.orders.save({ ...order, status: OrderStatus.Ready });
      }
    }
  }
}
