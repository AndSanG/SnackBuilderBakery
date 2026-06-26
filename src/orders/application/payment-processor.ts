import { Payment, PaymentRecord } from '../domain/payment';

export const PAYMENT_PROCESSOR = Symbol('PaymentProcessor');

// Owned by Orders, what ConfirmPayment needs to settle a payment. The adapter
// (local cash arithmetic now, a real card gateway later) implements it.
export interface PaymentProcessor {
  // Settles the amount due and returns the record, or throws
  // PaymentDeclinedError if it cannot be settled.
  process(amountDue: number, payment: Payment): Promise<PaymentRecord>;
}
