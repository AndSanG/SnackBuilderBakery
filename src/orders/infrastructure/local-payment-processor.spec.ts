import { LocalPaymentProcessor } from './local-payment-processor';
import { PaymentDeclinedError } from '../application/order-errors';
import { PaymentMethod } from '../domain/payment';

describe('LocalPaymentProcessor', () => {
  const sut = new LocalPaymentProcessor();

  it('settles cash and returns the change', async () => {
    const record = await sut.process(250, {
      method: PaymentMethod.Cash,
      amountTendered: 300,
    });

    expect(record).toEqual({
      method: PaymentMethod.Cash,
      amountPaid: 250,
      change: 50,
    });
  });

  it('declines cash that does not cover the total', async () => {
    await expect(
      sut.process(250, { method: PaymentMethod.Cash, amountTendered: 200 }),
    ).rejects.toBeInstanceOf(PaymentDeclinedError);
  });

  it('settles a card payment with no change', async () => {
    const record = await sut.process(250, {
      method: PaymentMethod.Card,
      cardToken: 'tok_visa',
    });

    expect(record).toEqual({
      method: PaymentMethod.Card,
      amountPaid: 250,
      change: 0,
    });
  });

  it('declines the sentinel card token', async () => {
    await expect(
      sut.process(250, { method: PaymentMethod.Card, cardToken: 'declined' }),
    ).rejects.toBeInstanceOf(PaymentDeclinedError);
  });

  it('declines a card with no token', async () => {
    await expect(
      sut.process(250, { method: PaymentMethod.Card }),
    ).rejects.toBeInstanceOf(PaymentDeclinedError);
  });
});
