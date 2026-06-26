import { OrdersController } from './orders.controller';
import { PlaceOrder } from '../application/place-order';
import { TrackOrder } from '../application/track-order';
import { ConfirmPayment } from '../application/confirm-payment';
import { ReconcileOrders } from '../application/reconcile-orders';
import { InMemoryOrderRepository } from '../infrastructure/in-memory-order-repository';
import { MenuCatalogAdapter } from '../../menu/infrastructure/menu-catalog.adapter';
import { InMemoryMenuRepository } from '../../menu/infrastructure/in-memory-menu-repository';
import { KitchenServiceAdapter } from '../../kitchen/infrastructure/kitchen-service.adapter';
import { Kitchen } from '../../kitchen/domain/kitchen';
import { FakeClock } from '../../shared/clock/fake-clock';
import { OrderSource } from '../domain/order-source';
import { OrderStatus } from '../domain/order';
import { OrderNotFoundError } from '../application/order-errors';
import { PaymentMethod } from '../domain/payment';
import { LocalPaymentProcessor } from '../infrastructure/local-payment-processor';
import { Category } from '../../shared/domain/category';

const cash = { method: PaymentMethod.Cash, amountTendered: 1000 };

const makeSUT = async (): Promise<{
  sut: OrdersController;
  clock: FakeClock;
}> => {
  const menuRepo = new InMemoryMenuRepository();
  await menuRepo.add({
    id: 'cookie',
    name: 'Chocolate Chip',
    category: Category.Cookie,
    price: 250,
  });
  const orderRepo = new InMemoryOrderRepository();
  const clock = new FakeClock();
  const kitchen = new KitchenServiceAdapter(new Kitchen(), clock);
  const sut = new OrdersController(
    new PlaceOrder(new MenuCatalogAdapter(menuRepo), orderRepo),
    new TrackOrder(orderRepo),
    new ConfirmPayment(orderRepo, kitchen, new LocalPaymentProcessor()),
    new ReconcileOrders(orderRepo, clock),
  );
  return { sut, clock };
};

describe('OrdersController', () => {
  it('places an order and returns a ticket with the total', async () => {
    const { sut } = await makeSUT();

    const ticket = await sut.place({
      items: [{ menuItemId: 'cookie', quantity: 2 }],
      source: OrderSource.WalkIn,
    });

    expect(ticket).toEqual({ orderId: expect.any(String), totalPrice: 500 });
  });

  it('tracks a placed order', async () => {
    const { sut } = await makeSUT();
    const ticket = await sut.place({
      items: [{ menuItemId: 'cookie', quantity: 1 }],
      source: OrderSource.Vip,
    });

    const status = await sut.track(ticket.orderId);

    expect(status).toEqual({
      orderId: ticket.orderId,
      status: OrderStatus.AwaitingPayment,
    });
  });

  it('fails with a not found error when tracking an unknown order', async () => {
    const { sut } = await makeSUT();

    await expect(sut.track('missing')).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });

  it('confirms an order into the kitchen and reflects it when tracked', async () => {
    const { sut } = await makeSUT();
    const ticket = await sut.place({
      items: [{ menuItemId: 'cookie', quantity: 1 }],
      source: OrderSource.WalkIn,
    });

    const confirmation = await sut.confirm(ticket.orderId, cash);
    const tracked = await sut.track(ticket.orderId);

    expect(confirmation.status).toBe(OrderStatus.InKitchen);
    expect(confirmation.estimatedReadyTime).toBeInstanceOf(Date);
    expect(tracked.status).toBe(OrderStatus.InKitchen);
  });

  it('marks a confirmed order ready once enough time passes and it is reconciled', async () => {
    const { sut, clock } = await makeSUT();
    const ticket = await sut.place({
      items: [{ menuItemId: 'cookie', quantity: 1 }],
      source: OrderSource.WalkIn,
    });
    await sut.confirm(ticket.orderId, cash);

    clock.advance(5); // a cookie bakes in 5 minutes
    await sut.reconcile();

    const tracked = await sut.track(ticket.orderId);
    expect(tracked.status).toBe(OrderStatus.Ready);
  });
});
