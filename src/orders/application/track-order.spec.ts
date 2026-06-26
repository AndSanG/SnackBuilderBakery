import { TrackOrder } from './track-order';
import { OrderRepository } from './order-repository';
import { OrderNotFoundError } from './order-errors';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../menu/domain/menu-item';

class OrderRepositorySpy implements OrderRepository {
  private order: Order | null = null;

  async save(): Promise<void> {
    // unused here
  }

  async findById(): Promise<Order | null> {
    return this.order;
  }

  async findByStatus(): Promise<Order[]> {
    return [];
  }

  async claimForPayment(): Promise<Order | null> {
    return null;
  }

  async updateEstimateIfInKitchen(): Promise<void> {
    // unused here
  }

  stubFindById(order: Order | null): void {
    this.order = order;
  }
}

const existingOrder: Order = {
  id: 'order-1',
  items: [{ id: 'item-1', category: Category.Cookie }],
  source: OrderSource.WalkIn,
  status: OrderStatus.AwaitingPayment,
  totalPrice: 250,
};

const makeSUT = (): { sut: TrackOrder; repository: OrderRepositorySpy } => {
  const repository = new OrderRepositorySpy();
  const sut = new TrackOrder(repository);
  return { sut, repository };
};

describe('TrackOrder', () => {
  it('returns the order id and status when the order exists', async () => {
    const { sut, repository } = makeSUT();
    repository.stubFindById(existingOrder);

    const result = await sut.execute('order-1');

    expect(result).toEqual({
      orderId: 'order-1',
      status: OrderStatus.AwaitingPayment,
    });
  });

  it('fails with a not found error when the order does not exist', async () => {
    const { sut, repository } = makeSUT();
    repository.stubFindById(null);

    await expect(sut.execute('missing')).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });
});
