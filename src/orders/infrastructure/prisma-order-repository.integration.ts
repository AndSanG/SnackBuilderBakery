// Integration tests for PrismaOrderRepository.
// Requires a running PostgreSQL with the schema applied (prisma db push / migrate dev).
// Skipped automatically when DATABASE_URL is absent so unit CI stays database-free.
import { PrismaClient } from '@prisma/client';
import { PrismaOrderRepository } from './prisma-order-repository';
import { Order, OrderStatus } from '../domain/order';
import { OrderSource } from '../domain/order-source';
import { Category } from '../../shared/domain/category';
import { PaymentMethod } from '../domain/payment';

const describeIf = (cond: boolean) =>
  cond ? describe : describe.skip;

const anOrder = (id: string, status = OrderStatus.AwaitingPayment): Order => ({
  id,
  source: OrderSource.WalkIn,
  status,
  totalPrice: 250,
  items: [{ id: `${id}-a`, category: Category.Cookie }],
});

describeIf(!!process.env.DATABASE_URL)('PrismaOrderRepository (integration)', () => {
  let prisma: PrismaClient;
  let sut: PrismaOrderRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    sut = new PrismaOrderRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  it('returns null for an unknown order', async () => {
    expect(await sut.findById('missing')).toBeNull();
  });

  it('saves and retrieves an order by id', async () => {
    await sut.save(anOrder('1'));

    const found = await sut.findById('1');
    expect(found?.id).toBe('1');
    expect(found?.status).toBe(OrderStatus.AwaitingPayment);
    expect(found?.items).toHaveLength(1);
    expect(found?.items[0].category).toBe(Category.Cookie);
  });

  it('updates scalar fields on subsequent save without duplicating items', async () => {
    await sut.save(anOrder('1'));

    await sut.save({ ...anOrder('1'), status: OrderStatus.InKitchen });

    const found = await sut.findById('1');
    expect(found?.status).toBe(OrderStatus.InKitchen);
    expect(found?.items).toHaveLength(1);
  });

  it('saves and retrieves payment fields', async () => {
    const withPayment: Order = {
      ...anOrder('1', OrderStatus.InKitchen),
      payment: { method: PaymentMethod.Cash, amountPaid: 250, change: 0 },
    };
    await sut.save(withPayment);

    const found = await sut.findById('1');
    expect(found?.payment?.method).toBe(PaymentMethod.Cash);
    expect(found?.payment?.amountPaid).toBe(250);
    expect(found?.payment?.change).toBe(0);
  });

  it('finds orders by status', async () => {
    await sut.save(anOrder('1', OrderStatus.AwaitingPayment));
    await sut.save(anOrder('2', OrderStatus.InKitchen));

    const awaiting = await sut.findByStatus(OrderStatus.AwaitingPayment);
    expect(awaiting).toHaveLength(1);
    expect(awaiting[0].id).toBe('1');
  });

  it('claimForPayment returns null for an unknown order', async () => {
    expect(await sut.claimForPayment('missing')).toBeNull();
  });

  it('claimForPayment flips status and returns the claimed order', async () => {
    await sut.save(anOrder('1'));

    const claimed = await sut.claimForPayment('1');

    expect(claimed?.status).toBe(OrderStatus.PaymentProcessing);
    expect((await sut.findById('1'))?.status).toBe(OrderStatus.PaymentProcessing);
  });

  it('claimForPayment returns null when the order is not AwaitingPayment', async () => {
    await sut.save(anOrder('1', OrderStatus.InKitchen));

    expect(await sut.claimForPayment('1')).toBeNull();
  });

  // The critical concurrency proof: two concurrent callers race to claim the
  // same order. PostgreSQL's UPDATE ... WHERE status='AwaitingPayment' is
  // atomic; exactly one caller wins and the other sees count=0.
  it('claimForPayment charges an order at most once under a concurrent race', async () => {
    await sut.save(anOrder('1'));

    const [a, b] = await Promise.all([
      sut.claimForPayment('1'),
      sut.claimForPayment('1'),
    ]);

    const claimed = [a, b].filter(Boolean);
    expect(claimed).toHaveLength(1);
    expect(claimed[0]!.status).toBe(OrderStatus.PaymentProcessing);
  });

  it('updateEstimateIfInKitchen updates the estimate of an InKitchen order', async () => {
    await sut.save(anOrder('1', OrderStatus.InKitchen));
    const newEstimate = new Date('2026-01-01T00:30:00Z');

    await sut.updateEstimateIfInKitchen('1', newEstimate);

    expect((await sut.findById('1'))?.estimatedReadyTime).toEqual(newEstimate);
  });

  it('updateEstimateIfInKitchen does not touch an order that left the kitchen', async () => {
    const original = new Date('2026-01-01T00:05:00Z');
    await sut.save({
      ...anOrder('1', OrderStatus.Ready),
      estimatedReadyTime: original,
    });

    await sut.updateEstimateIfInKitchen('1', new Date('2026-01-01T00:30:00Z'));

    expect((await sut.findById('1'))?.estimatedReadyTime).toEqual(original);
  });
});
