import { PrismaClient, Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';
import { Order, OrderItem, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { OrderRepository } from '../application/order-repository';
import { Category } from '../../shared/domain/category';
import { PaymentMethod } from '../domain/payment';

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function toDomain(row: PrismaOrderWithItems): Order {
  return {
    id: row.id,
    status: row.status as OrderStatus,
    source: row.source as OrderSource,
    totalPrice: row.totalPrice,
    estimatedReadyTime: row.estimatedReadyTime ?? undefined,
    items: row.items.map(
      (i): OrderItem => ({ id: i.id, category: i.category as Category }),
    ),
    payment: row.paymentMethod
      ? {
          method: row.paymentMethod as PaymentMethod,
          amountPaid: row.amountPaid!,
          change: row.change!,
        }
      : undefined,
  };
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Items are created on first save and never changed; only scalars are
  // updated on subsequent saves. The upsert create path handles item creation.
  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        source: order.source,
        totalPrice: order.totalPrice,
        status: order.status,
        estimatedReadyTime: order.estimatedReadyTime ?? null,
        paymentMethod: order.payment?.method ?? null,
        amountPaid: order.payment?.amountPaid ?? null,
        change: order.payment?.change ?? null,
        items: {
          create: order.items.map((i) => ({ id: i.id, category: i.category })),
        },
      },
      update: {
        status: order.status,
        estimatedReadyTime: order.estimatedReadyTime ?? null,
        paymentMethod: order.payment?.method ?? null,
        amountPaid: order.payment?.amountPaid ?? null,
        change: order.payment?.change ?? null,
      },
    });
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? toDomain(row) : null;
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { status },
      include: { items: true },
    });
    return rows.map(toDomain);
  }

  // Atomic compare-and-set via a single UPDATE ... WHERE status='AwaitingPayment'.
  // PostgreSQL's row-level lock ensures exactly one concurrent caller flips the
  // status; the other sees count=0 and returns null (never charges twice).
  async claimForPayment(id: string): Promise<Order | null> {
    const result = await this.prisma.order.updateMany({
      where: { id, status: OrderStatus.AwaitingPayment },
      data: { status: OrderStatus.PaymentProcessing },
    });
    if (result.count === 0) return null;
    return this.findById(id);
  }

  // Atomic compare-and-set via UPDATE ... WHERE status='InKitchen'. A stale
  // VIP-ripple estimate cannot clobber a Ready order because the WHERE guard
  // silently no-ops when the order has already advanced.
  async updateEstimateIfInKitchen(
    id: string,
    estimatedReadyTime: Date,
  ): Promise<void> {
    await this.prisma.order.updateMany({
      where: { id, status: OrderStatus.InKitchen },
      data: { estimatedReadyTime },
    });
  }
}
