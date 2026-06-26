export enum PaymentMethod {
  Cash = 'Cash',
  Card = 'Card',
}

// A payment attempt against an order. Cash carries the amount tendered (to
// compute change); card carries a token standing in for the customer's card.
export interface Payment {
  method: PaymentMethod;
  amountTendered?: number;
  cardToken?: string;
}

// What was settled, recorded on the order once payment succeeds.
export interface PaymentRecord {
  method: PaymentMethod;
  amountPaid: number;
  change: number;
}
