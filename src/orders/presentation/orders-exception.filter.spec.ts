import { ArgumentsHost } from '@nestjs/common';
import { OrdersExceptionFilter } from './orders-exception.filter';
import {
  EmptyOrderError,
  OrderAlreadyConfirmedError,
  OrderNotFoundError,
  PaymentDeclinedError,
  UnknownMenuItemError,
} from '../application/order-errors';

const makeHost = (): {
  host: ArgumentsHost;
  sent: { status?: number; body?: unknown };
} => {
  const sent: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      sent.status = code;
      return response;
    },
    json(body: unknown) {
      sent.body = body;
      return response;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, sent };
};

describe('OrdersExceptionFilter', () => {
  it('maps a not found error to 404', () => {
    const { host, sent } = makeHost();

    new OrdersExceptionFilter().catch(new OrderNotFoundError('o-1'), host);

    expect(sent.status).toBe(404);
  });

  it('maps an empty order error to 400', () => {
    const { host, sent } = makeHost();

    new OrdersExceptionFilter().catch(new EmptyOrderError(), host);

    expect(sent.status).toBe(400);
  });

  it('maps an unknown menu item error to 400', () => {
    const { host, sent } = makeHost();

    new OrdersExceptionFilter().catch(new UnknownMenuItemError('ghost'), host);

    expect(sent.status).toBe(400);
  });

  it('maps an already-confirmed error to 409', () => {
    const { host, sent } = makeHost();

    new OrdersExceptionFilter().catch(
      new OrderAlreadyConfirmedError('o-1'),
      host,
    );

    expect(sent.status).toBe(409);
  });

  it('maps a declined payment to 402', () => {
    const { host, sent } = makeHost();

    new OrdersExceptionFilter().catch(
      new PaymentDeclinedError('insufficient cash tendered'),
      host,
    );

    expect(sent.status).toBe(402);
  });
});
