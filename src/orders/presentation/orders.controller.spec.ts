import { OrdersController } from './orders.controller';
import { PlaceOrder } from '../application/place-order';
import { TrackOrder } from '../application/track-order';
import { InMemoryOrderRepository } from '../infrastructure/in-memory-order-repository';
import { MenuCatalogAdapter } from '../../menu/infrastructure/menu-catalog.adapter';
import { InMemoryMenuRepository } from '../../menu/infrastructure/in-memory-menu-repository';
import { OrderSource } from '../domain/order-source';
import { OrderStatus } from '../domain/order';
import { OrderNotFoundError } from '../application/order-errors';
import { Category } from '../../menu/domain/menu-item';

const makeSUT = async (): Promise<{ sut: OrdersController }> => {
  const menuRepo = new InMemoryMenuRepository();
  await menuRepo.add({
    id: 'cookie',
    name: 'Chocolate Chip',
    category: Category.Cookie,
    price: 250,
  });
  const orderRepo = new InMemoryOrderRepository();
  const sut = new OrdersController(
    new PlaceOrder(new MenuCatalogAdapter(menuRepo), orderRepo),
    new TrackOrder(orderRepo),
  );
  return { sut };
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
});
