import { ConfirmPayment } from './confirm-payment';
import { PaymentProcessor } from './payment-processor';
import { InMemoryOrderRepository } from '../infrastructure/in-memory-order-repository';
import { KitchenServiceAdapter } from '../../kitchen/infrastructure/kitchen-service.adapter';
import { Kitchen } from '../../kitchen/domain/kitchen';
import { PriorityPolicy } from '../../kitchen/domain/scheduling-policy';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Payment, PaymentMethod, PaymentRecord } from '../domain/payment';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../shared/domain/category';

const cash = { method: PaymentMethod.Cash, amountTendered: 1000 };

// Counts charges and yields the event loop mid-charge, so two concurrent
// confirmations interleave: without an atomic claim, both would charge.
class CountingProcessor implements PaymentProcessor {
  charges = 0;

  async process(amountDue: number, payment: Payment): Promise<PaymentRecord> {
    this.charges += 1;
    await new Promise((resolve) => setImmediate(resolve));
    return { method: payment.method, amountPaid: amountDue, change: 0 };
  }
}

describe('ConfirmPayment concurrency', () => {
  it('charges only once when two confirmations race for the same order', async () => {
    const orders = new InMemoryOrderRepository();
    const order: Order = {
      id: 'o1',
      items: [{ id: 'o1-1', category: Category.Cookie }],
      source: OrderSource.WalkIn,
      status: OrderStatus.AwaitingPayment,
      totalPrice: 250,
    };
    await orders.save(order);
    const payments = new CountingProcessor();
    const kitchen = new KitchenServiceAdapter(
      new Kitchen(new PriorityPolicy()),
      new FakeClock(),
    );
    const sut = new ConfirmPayment(orders, kitchen, payments);

    const results = await Promise.allSettled([
      sut.execute('o1', cash),
      sut.execute('o1', cash),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1); // exactly one confirmation wins
    expect(payments.charges).toBe(1); // and the card is charged once
    expect((await orders.findById('o1'))?.status).toBe(OrderStatus.InKitchen);
  });
});
