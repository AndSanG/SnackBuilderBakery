import { randomUUID } from 'node:crypto';
import { Order, OrderItem, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { MenuCatalog } from './menu-catalog';
import { OrderRepository } from './order-repository';
import { EmptyOrderError, UnknownMenuItemError } from './order-errors';

export interface OrderLine {
  menuItemId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  items: OrderLine[];
  source: OrderSource;
}

export interface Ticket {
  orderId: string;
  totalPrice: number;
}

export class PlaceOrder {
  constructor(
    private readonly catalog: MenuCatalog,
    private readonly orders: OrderRepository,
  ) {}

  async execute(input: PlaceOrderInput): Promise<Ticket> {
    if (input.items.length === 0) {
      throw new EmptyOrderError();
    }

    const items: OrderItem[] = [];
    let totalPrice = 0;

    for (const line of input.items) {
      const catalogItem = await this.catalog.findItem(line.menuItemId);
      if (catalogItem === null) {
        throw new UnknownMenuItemError(line.menuItemId);
      }
      totalPrice += catalogItem.price * line.quantity;
      for (let unit = 0; unit < line.quantity; unit++) {
        items.push({ id: randomUUID(), category: catalogItem.category });
      }
    }

    const order: Order = {
      id: randomUUID(),
      items,
      source: input.source,
      status: OrderStatus.AwaitingPayment,
      totalPrice,
    };
    await this.orders.save(order);

    return { orderId: order.id, totalPrice };
  }
}
