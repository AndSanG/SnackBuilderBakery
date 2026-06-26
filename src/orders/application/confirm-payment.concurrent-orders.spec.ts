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

// 4 cookies per order, 8 total across both orders, 6 oven slots.
// The second order's last 2 cookies must wait for the first batch to finish,
// so estimates must be different: one at T+5 min, one at T+10 min.
const cookieOrder = (id: string): Order => ({
  id,
  source: OrderSource.WalkIn,
  status: OrderStatus.AwaitingPayment,
  totalPrice: 0,
  items: Array.from({ length: 4 }, (_, i) => ({
    id: `${id}-${i}`,
    category: Category.Cookie,
  })),
});

describe('ConfirmPayment concurrent different orders', () => {
  it('estimates each order accounting for the other when both confirm at once', async () => {
    const orders = new InMemoryOrderRepository();
    await orders.save(cookieOrder('a'));
    await orders.save(cookieOrder('b'));
    const clock = new FakeClock();
    const kitchen = new KitchenServiceAdapter(
      new Kitchen(new PriorityPolicy()),
      clock,
    );
    const sut = new ConfirmPayment(orders, kitchen, new LocalPaymentProcessor());

    const [resultA, resultB] = await Promise.all([
      sut.execute('a', cash),
      sut.execute('b', cash),
    ]);

    // 8 cookies, 6 slots: first 6 finish at T+5 min, last 2 at T+10 min.
    // Both estimates must not collapse to the same value.
    const [earlier, later] = [
      resultA.estimatedReadyTime.getTime(),
      resultB.estimatedReadyTime.getTime(),
    ].sort((a, b) => a - b);
    const now = clock.now().getTime();
    expect(earlier).toBe(now + 5 * 60_000);
    expect(later).toBe(now + 10 * 60_000);
  });
});
