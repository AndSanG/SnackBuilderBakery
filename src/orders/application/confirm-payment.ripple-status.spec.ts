import { ConfirmPayment } from './confirm-payment';
import { ReconcileOrders } from './reconcile-orders';
import { OrderStatus } from '../domain/order';
import { InMemoryOrderRepository } from '../infrastructure/in-memory-order-repository';
import { KitchenServiceAdapter } from '../../kitchen/infrastructure/kitchen-service.adapter';
import { Kitchen } from '../../kitchen/domain/kitchen';
import { PriorityPolicy } from '../../kitchen/domain/scheduling-policy';
import { LocalPaymentProcessor } from '../infrastructure/local-payment-processor';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Order } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { PaymentMethod } from '../domain/payment';
import { Category } from '../../shared/domain/category';

const cash = { method: PaymentMethod.Cash, amountTendered: 100000 };

const breadOrder = (id: string, source: OrderSource, count: number): Order => ({
  id,
  source,
  status: OrderStatus.AwaitingPayment,
  totalPrice: 0,
  items: Array.from({ length: count }, (_, i) => ({
    id: `${id}-${i}`,
    category: Category.Bread,
  })),
});

// Fires a one-shot hook the first time the VIP ripple scans for in-kitchen
// orders, after the snapshot is read but before any estimate is written. This
// is the exact interleave where a concurrent ReconcileOrders can advance one of
// the snapshotted orders to Ready while the ripple still holds it as InKitchen.
class RippleInterleavingRepo extends InMemoryOrderRepository {
  private hook?: () => Promise<void>;

  onNextInKitchenScan(hook: () => Promise<void>): void {
    this.hook = hook;
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const snapshot = await super.findByStatus(status);
    if (status === OrderStatus.InKitchen && this.hook) {
      const fire = this.hook;
      this.hook = undefined; // one-shot, so the hook's own scan does not recurse
      await fire();
    }
    return snapshot;
  }
}

describe('ConfirmPayment VIP ripple status safety', () => {
  it('does not resurrect an order that became Ready while the ripple ran', async () => {
    const orders = new RippleInterleavingRepo();
    const clock = new FakeClock();
    const kitchen = new KitchenServiceAdapter(
      new Kitchen(new PriorityPolicy()),
      clock,
    );
    const sut = new ConfirmPayment(orders, kitchen, new LocalPaymentProcessor());
    const reconcile = new ReconcileOrders(orders, clock);

    // 12 breads: 6 bake now, 6 queue. Last bread is estimated ready at 40 min.
    await orders.save(breadOrder('walk', OrderSource.WalkIn, 12));
    await orders.save(breadOrder('vip', OrderSource.Vip, 1));
    await sut.execute('walk', cash);

    // While the VIP confirmation runs its ripple (which would push walk's
    // estimate back to 60 min), jump the clock to walk's stale 40 min estimate
    // and reconcile, advancing walk to Ready before the ripple writes.
    orders.onNextInKitchenScan(async () => {
      clock.advance(40);
      await reconcile.execute();
    });
    await sut.execute('vip', cash);

    // The stale ripple estimate must not flip walk back into the kitchen.
    expect((await orders.findById('walk'))?.status).toBe(OrderStatus.Ready);
  });
});
