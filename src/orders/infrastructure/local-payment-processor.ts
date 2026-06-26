import { PaymentProcessor } from '../application/payment-processor';
import { PaymentDeclinedError } from '../application/order-errors';
import { Payment, PaymentMethod, PaymentRecord } from '../domain/payment';

// Settles payments locally. Cash is real arithmetic: the tender must cover the
// total, and change is returned. Card has no real gateway yet.
//
// ponytail: card "processing" approves any token except the sentinel "declined"
// (so the declined path is testable). Swap this branch for a gateway adapter
// when real card processing arrives; the port and ConfirmPayment stay the same.
export class LocalPaymentProcessor implements PaymentProcessor {
  async process(amountDue: number, payment: Payment): Promise<PaymentRecord> {
    if (payment.method === PaymentMethod.Cash) {
      const tendered = payment.amountTendered ?? 0;
      if (tendered < amountDue) {
        throw new PaymentDeclinedError('insufficient cash tendered');
      }
      return {
        method: PaymentMethod.Cash,
        amountPaid: amountDue,
        change: tendered - amountDue,
      };
    }

    if (!payment.cardToken) {
      throw new PaymentDeclinedError('missing card details');
    }
    if (payment.cardToken === 'declined') {
      throw new PaymentDeclinedError('card declined');
    }
    return { method: PaymentMethod.Card, amountPaid: amountDue, change: 0 };
  }
}
