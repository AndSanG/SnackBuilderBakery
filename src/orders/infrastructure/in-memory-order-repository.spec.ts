import { InMemoryOrderRepository } from './in-memory-order-repository';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../menu/domain/menu-item';

const order = (id: string): Order => ({
  id,
  items: [{ id: `${id}-a`, category: Category.Cookie }],
  source: OrderSource.WalkIn,
  status: OrderStatus.AwaitingPayment,
  totalPrice: 250,
});

const makeSUT = (): InMemoryOrderRepository => new InMemoryOrderRepository();

describe('InMemoryOrderRepository', () => {
  it('returns null for an unknown id', async () => {
    const sut = makeSUT();

    expect(await sut.findById('missing')).toBeNull();
  });

  it('saves and finds an order by id', async () => {
    const sut = makeSUT();
    const saved = order('1');

    await sut.save(saved);

    expect(await sut.findById('1')).toEqual(saved);
  });

  it('replaces an order saved again with the same id', async () => {
    const sut = makeSUT();
    await sut.save(order('1'));

    await sut.save({ ...order('1'), status: OrderStatus.InKitchen });

    expect((await sut.findById('1'))?.status).toBe(OrderStatus.InKitchen);
  });
});
