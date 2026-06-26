import { PlaceOrder } from './place-order';
import { MenuCatalog, CatalogItem } from './menu-catalog';
import { OrderRepository } from './order-repository';
import { EmptyOrderError, UnknownMenuItemError } from './order-errors';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../menu/domain/menu-item';

class MenuCatalogSpy implements MenuCatalog {
  private items = new Map<string, CatalogItem>();

  async findItem(id: string): Promise<CatalogItem | null> {
    return this.items.get(id) ?? null;
  }

  stub(item: CatalogItem): void {
    this.items.set(item.id, item);
  }
}

class OrderRepositorySpy implements OrderRepository {
  savedOrders: Order[] = [];

  async save(order: Order): Promise<void> {
    this.savedOrders.push(order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.savedOrders.find((o) => o.id === id) ?? null;
  }

  async findByStatus(status: Order['status']): Promise<Order[]> {
    return this.savedOrders.filter((o) => o.status === status);
  }

  async claimForPayment(): Promise<Order | null> {
    return null;
  }

  async updateEstimateIfInKitchen(): Promise<void> {
    // unused here
  }
}

const makeSUT = (): {
  sut: PlaceOrder;
  catalog: MenuCatalogSpy;
  orders: OrderRepositorySpy;
} => {
  const catalog = new MenuCatalogSpy();
  const orders = new OrderRepositorySpy();
  const sut = new PlaceOrder(catalog, orders);
  return { sut, catalog, orders };
};

const cookie: CatalogItem = { id: 'cookie', category: Category.Cookie, price: 250 };
const bread: CatalogItem = { id: 'bread', category: Category.Bread, price: 400 };

describe('PlaceOrder', () => {
  it('fails with an empty order error and saves nothing when no items are requested', async () => {
    const { sut, orders } = makeSUT();

    await expect(
      sut.execute({ items: [], source: OrderSource.WalkIn }),
    ).rejects.toBeInstanceOf(EmptyOrderError);
    expect(orders.savedOrders).toHaveLength(0);
  });

  it('fails with an unknown item error and saves nothing when an item is not on the menu', async () => {
    const { sut, orders } = makeSUT();

    await expect(
      sut.execute({
        items: [{ menuItemId: 'ghost', quantity: 1 }],
        source: OrderSource.WalkIn,
      }),
    ).rejects.toBeInstanceOf(UnknownMenuItemError);
    expect(orders.savedOrders).toHaveLength(0);
  });

  it('returns a ticket totaling menu prices times quantities', async () => {
    const { sut, catalog } = makeSUT();
    catalog.stub(cookie);
    catalog.stub(bread);

    const ticket = await sut.execute({
      items: [
        { menuItemId: 'cookie', quantity: 3 },
        { menuItemId: 'bread', quantity: 1 },
      ],
      source: OrderSource.AppDelivery,
    });

    expect(ticket.totalPrice).toBe(3 * 250 + 400);
  });

  it('saves an awaiting-payment order with one item per unit ordered', async () => {
    const { sut, catalog, orders } = makeSUT();
    catalog.stub(cookie);

    await sut.execute({
      items: [{ menuItemId: 'cookie', quantity: 3 }],
      source: OrderSource.Vip,
    });

    const saved = orders.savedOrders[0];
    expect(saved.status).toBe(OrderStatus.AwaitingPayment);
    expect(saved.items).toHaveLength(3);
    expect(saved.items.every((i) => i.category === Category.Cookie)).toBe(true);
  });

  it('returns a ticket referencing the saved order', async () => {
    const { sut, catalog, orders } = makeSUT();
    catalog.stub(cookie);

    const ticket = await sut.execute({
      items: [{ menuItemId: 'cookie', quantity: 1 }],
      source: OrderSource.WalkIn,
    });

    expect(ticket.orderId).toBe(orders.savedOrders[0].id);
  });
});
