import { ArgumentsHost } from '@nestjs/common';
import { MenuItemNotFoundFilter } from './menu-item-not-found.filter';
import { MenuItemNotFoundError } from '../application/menu-errors';

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

describe('MenuItemNotFoundFilter', () => {
  it('responds with 404 and the error message', () => {
    const sut = new MenuItemNotFoundFilter();
    const { host, sent } = makeHost();

    sut.catch(new MenuItemNotFoundError('item-1'), host);

    expect(sent.status).toBe(404);
    expect(sent.body).toEqual(
      expect.objectContaining({ statusCode: 404, message: 'Menu item not found: item-1' }),
    );
  });
});
