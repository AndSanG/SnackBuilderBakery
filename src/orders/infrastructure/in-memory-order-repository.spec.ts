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

  it('returns only orders with the matching status', async () => {
    const sut = makeSUT();
    await sut.save(order('1')); // AwaitingPayment
    await sut.save({ ...order('2'), status: OrderStatus.InKitchen });

    const result = await sut.findByStatus(OrderStatus.AwaitingPayment);

    expect(result.map((o) => o.id)).toEqual(['1']);
  });

  it('atomically claims an awaiting-payment order and sets it to PaymentProcessing', async () => {
    const sut = makeSUT();
    await sut.save(order('1'));

    const claimed = await sut.claimForPayment('1');

    expect(claimed?.id).toBe('1');
    expect((await sut.findById('1'))?.status).toBe(OrderStatus.PaymentProcessing);
  });

  it('returns null and makes no change when claiming an order not in AwaitingPayment', async () => {
    const sut = makeSUT();
    await sut.save({ ...order('1'), status: OrderStatus.InKitchen });

    const result = await sut.claimForPayment('1');

    expect(result).toBeNull();
    expect((await sut.findById('1'))?.status).toBe(OrderStatus.InKitchen);
  });

  it('returns null when claiming an unknown order', async () => {
    const sut = makeSUT();

    expect(await sut.claimForPayment('missing')).toBeNull();
  });

  it('refreshes the estimate of an in-kitchen order', async () => {
    const sut = makeSUT();
    await sut.save({ ...order('1'), status: OrderStatus.InKitchen });
    const newEstimate = new Date('2026-01-01T00:30:00Z');

    await sut.updateEstimateIfInKitchen('1', newEstimate);

    expect((await sut.findById('1'))?.estimatedReadyTime).toEqual(newEstimate);
  });

  it('does not refresh the estimate of an order that left the kitchen', async () => {
    const sut = makeSUT();
    const ready = {
      ...order('1'),
      status: OrderStatus.Ready,
      estimatedReadyTime: new Date('2026-01-01T00:05:00Z'),
    };
    await sut.save(ready);

    await sut.updateEstimateIfInKitchen('1', new Date('2026-01-01T00:30:00Z'));

    const after = await sut.findById('1');
    expect(after?.status).toBe(OrderStatus.Ready);
    expect(after?.estimatedReadyTime).toEqual(ready.estimatedReadyTime);
  });
});
