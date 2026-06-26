import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { CLOCK } from '../src/shared/clock/clock';
import { FakeClock } from '../src/shared/clock/fake-clock';

// Black-box: drives the real HTTP app (routing, ValidationPipe, exception
// filters, DI graph) over supertest. Time is the one thing we control: CLOCK is
// overridden with a FakeClock the test advances to make the kitchen progress.
describe('Bakery (e2e)', () => {
  let app: INestApplication;
  let clock: FakeClock;

  beforeEach(async () => {
    clock = new FakeClock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const createCookie = async (): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/menu')
      .send({ name: 'Chocolate Chip', category: 'Cookie', price: 250 })
      .expect(201);
    return res.body.id as string;
  };

  it('takes an order from placement through the kitchen to ready', async () => {
    const server = app.getHttpServer();
    const menuItemId = await createCookie();

    const placed = await request(server)
      .post('/orders')
      .send({ items: [{ menuItemId, quantity: 1 }], source: 'WalkIn' })
      .expect(201);
    expect(placed.body).toEqual({
      orderId: expect.any(String),
      totalPrice: 250,
    });
    const orderId = placed.body.orderId as string;

    const confirmed = await request(server)
      .post(`/orders/${orderId}/confirm`)
      .expect(201);
    expect(confirmed.body.status).toBe('InKitchen');
    expect(confirmed.body.estimatedReadyTime).toEqual(expect.any(String));

    await request(server).get(`/orders/${orderId}`).expect(200).expect({
      orderId,
      status: 'InKitchen',
      estimatedReadyTime: confirmed.body.estimatedReadyTime,
    });

    clock.advance(5); // a cookie bakes in 5 minutes
    await request(server).post('/orders/reconcile').expect(201);

    const tracked = await request(server).get(`/orders/${orderId}`).expect(200);
    expect(tracked.body.status).toBe('Ready');
  });

  it('shows a confirmed order baking in the kitchen monitor', async () => {
    const server = app.getHttpServer();
    const menuItemId = await createCookie();
    const placed = await request(server)
      .post('/orders')
      .send({ items: [{ menuItemId, quantity: 2 }], source: 'WalkIn' });
    await request(server).post(`/orders/${placed.body.orderId as string}/confirm`);

    const view = await request(server).get('/kitchen').expect(200);

    expect(view.body.ovens).toHaveLength(2);
    expect(view.body.ovens[0].trays).toHaveLength(3);
    const baking = view.body.ovens
      .flatMap((o: { trays: { item: unknown }[] }) => o.trays)
      .filter((t: { item: unknown }) => t.item);
    expect(baking).toHaveLength(2); // two cookies on two trays
  });

  it('rejects a malformed order with 400', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ source: 'WalkIn' }) // missing items
      .expect(400);
  });

  it('returns 404 when tracking an unknown order', async () => {
    await request(app.getHttpServer()).get('/orders/missing').expect(404);
  });

  it('returns 409 when confirming an order twice', async () => {
    const server = app.getHttpServer();
    const menuItemId = await createCookie();
    const placed = await request(server)
      .post('/orders')
      .send({ items: [{ menuItemId, quantity: 1 }], source: 'WalkIn' });
    const orderId = placed.body.orderId as string;

    await request(server).post(`/orders/${orderId}/confirm`).expect(201);
    await request(server).post(`/orders/${orderId}/confirm`).expect(409);
  });
});
