import { ReconcileOrders } from './reconcile-orders';
import { InMemoryOrderRepository } from '../infrastructure/in-memory-order-repository';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../shared/domain/category';

const inKitchen = (id: string, estimatedReadyTime: Date): Order => ({
  id,
  items: [{ id: `${id}-1`, category: Category.Cookie }],
  source: OrderSource.WalkIn,
  status: OrderStatus.InKitchen,
  totalPrice: 250,
  estimatedReadyTime,
});

describe('ReconcileOrders', () => {
  it('marks an in-kitchen order ready once its estimate has passed', async () => {
    const repo = new InMemoryOrderRepository();
    const clock = new FakeClock();
    await repo.save(inKitchen('o-1', new Date(clock.now().getTime() + 5 * 60_000)));

    clock.advance(5);
    await new ReconcileOrders(repo, clock).execute();

    expect((await repo.findById('o-1'))?.status).toBe(OrderStatus.Ready);
  });

  it('leaves an order in the kitchen while its estimate is still in the future', async () => {
    const repo = new InMemoryOrderRepository();
    const clock = new FakeClock();
    await repo.save(inKitchen('o-1', new Date(clock.now().getTime() + 10 * 60_000)));

    clock.advance(5);
    await new ReconcileOrders(repo, clock).execute();

    expect((await repo.findById('o-1'))?.status).toBe(OrderStatus.InKitchen);
  });

  it('leaves orders that are not in the kitchen untouched', async () => {
    const repo = new InMemoryOrderRepository();
    const clock = new FakeClock();
    await repo.save({
      id: 'o-1',
      items: [{ id: 'o-1-1', category: Category.Cookie }],
      source: OrderSource.WalkIn,
      status: OrderStatus.AwaitingPayment,
      totalPrice: 250,
    });

    await new ReconcileOrders(repo, clock).execute();

    expect((await repo.findById('o-1'))?.status).toBe(OrderStatus.AwaitingPayment);
  });
});
