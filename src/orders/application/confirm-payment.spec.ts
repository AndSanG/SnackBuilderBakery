import { ConfirmPayment } from './confirm-payment';
import { OrderRepository } from './order-repository';
import { KitchenService, KitchenItem } from './kitchen-service';
import { OrderAlreadyConfirmedError, OrderNotFoundError } from './order-errors';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../shared/domain/category';

class OrderRepositorySpy implements OrderRepository {
  savedOrders: Order[] = [];
  private order: Order | null = null;

  async save(order: Order): Promise<void> {
    this.savedOrders.push(order);
  }

  async findById(): Promise<Order | null> {
    return this.order;
  }

  async findByStatus(): Promise<Order[]> {
    return [];
  }

  stubFindById(order: Order | null): void {
    this.order = order;
  }
}

class KitchenServiceSpy implements KitchenService {
  calls: string[] = [];
  enqueued: KitchenItem[][] = [];
  private estimate = new Date('2026-01-01T00:30:00.000Z');

  async enqueue(items: KitchenItem[]): Promise<void> {
    this.calls.push('enqueue');
    this.enqueued.push(items);
  }

  async estimateReadyTime(): Promise<Date> {
    this.calls.push('estimate');
    return this.estimate;
  }

  stubEstimate(time: Date): void {
    this.estimate = time;
  }
}

const awaitingOrder = (): Order => ({
  id: 'order-1',
  items: [
    { id: 'i1', category: Category.Cookie },
    { id: 'i2', category: Category.Bread },
  ],
  source: OrderSource.Vip,
  status: OrderStatus.AwaitingPayment,
  totalPrice: 650,
});

const makeSUT = (): {
  sut: ConfirmPayment;
  orders: OrderRepositorySpy;
  kitchen: KitchenServiceSpy;
} => {
  const orders = new OrderRepositorySpy();
  const kitchen = new KitchenServiceSpy();
  const sut = new ConfirmPayment(orders, kitchen);
  return { sut, orders, kitchen };
};

describe('ConfirmPayment', () => {
  it('fails with a not found error when the order does not exist', async () => {
    const { sut, orders } = makeSUT();
    orders.stubFindById(null);

    await expect(sut.execute('missing')).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });

  it('fails when the order is not awaiting payment', async () => {
    const { sut, orders } = makeSUT();
    orders.stubFindById({ ...awaitingOrder(), status: OrderStatus.InKitchen });

    await expect(sut.execute('order-1')).rejects.toBeInstanceOf(
      OrderAlreadyConfirmedError,
    );
  });

  it('enqueues the order items as kitchen items with the source priority', async () => {
    const { sut, orders, kitchen } = makeSUT();
    orders.stubFindById(awaitingOrder()); // a VIP order, priority tier 1

    await sut.execute('order-1');

    expect(kitchen.enqueued[0]).toEqual([
      { id: 'i1', orderId: 'order-1', category: Category.Cookie, priority: 1 },
      { id: 'i2', orderId: 'order-1', category: Category.Bread, priority: 1 },
    ]);
  });

  it('estimates the ready time before enqueueing the items', async () => {
    const { sut, orders, kitchen } = makeSUT();
    orders.stubFindById(awaitingOrder());

    await sut.execute('order-1');

    expect(kitchen.calls).toEqual(['estimate', 'enqueue']);
  });

  it('moves the order into the kitchen with the estimated ready time', async () => {
    const { sut, orders, kitchen } = makeSUT();
    orders.stubFindById(awaitingOrder());
    const estimate = new Date('2026-01-01T00:20:00.000Z');
    kitchen.stubEstimate(estimate);

    const result = await sut.execute('order-1');

    expect(result).toEqual({
      orderId: 'order-1',
      status: OrderStatus.InKitchen,
      estimatedReadyTime: estimate,
    });
    expect(orders.savedOrders[0].status).toBe(OrderStatus.InKitchen);
    expect(orders.savedOrders[0].estimatedReadyTime).toEqual(estimate);
  });
});
