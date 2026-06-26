import { ConfirmPayment } from './confirm-payment';
import { InMemoryOrderRepository } from '../infrastructure/in-memory-order-repository';
import { KitchenServiceAdapter } from '../../kitchen/infrastructure/kitchen-service.adapter';
import { Kitchen } from '../../kitchen/domain/kitchen';
import { PriorityPolicy } from '../../kitchen/domain/scheduling-policy';
import { LocalPaymentProcessor } from '../infrastructure/local-payment-processor';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { PaymentMethod } from '../domain/payment';
import { Category } from '../../shared/domain/category';

const cash = { method: PaymentMethod.Cash, amountTendered: 100000 };

// Integration: real Kitchen (priority scheduling), real adapter, real repo. The
// behavior under test is the VIP ripple, which only shows with the real
// scheduler, so fakes would prove nothing here.
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

const makeSUT = () => {
  const orders = new InMemoryOrderRepository();
  const kitchen = new KitchenServiceAdapter(
    new Kitchen(new PriorityPolicy()),
    new FakeClock(),
  );
  return {
    sut: new ConfirmPayment(orders, kitchen, new LocalPaymentProcessor()),
    orders,
  };
};

describe('ConfirmPayment VIP ripple', () => {
  it('pushes back a queued lower-priority order when a VIP order jumps ahead', async () => {
    const { sut, orders } = makeSUT();
    // 12 breads fill the 6 slots and queue 6 more: last bread ready in 40 min.
    await orders.save(breadOrder('walk', OrderSource.WalkIn, 12));
    await orders.save(breadOrder('vip', OrderSource.Vip, 1));

    const walk = await sut.execute('walk', cash);
    await sut.execute('vip', cash); // VIP bread jumps to the front of the queue

    const bumped = await orders.findById('walk');
    expect(bumped?.estimatedReadyTime?.getTime()).toBeGreaterThan(
      walk.estimatedReadyTime.getTime(),
    );
  });

  it('leaves a higher-priority order estimate untouched', async () => {
    const { sut, orders } = makeSUT();
    await orders.save(breadOrder('vip', OrderSource.Vip, 12));
    await orders.save(breadOrder('walk', OrderSource.WalkIn, 1));

    const vip = await sut.execute('vip', cash);
    await sut.execute('walk', cash); // lower priority, cannot bump the VIP

    const unchanged = await orders.findById('vip');
    expect(unchanged?.estimatedReadyTime?.getTime()).toBe(
      vip.estimatedReadyTime.getTime(),
    );
  });
});
