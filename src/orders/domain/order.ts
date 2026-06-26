import { Category } from '../../menu/domain/menu-item';
import { OrderSource } from './order-source';
import { PaymentRecord } from './payment';

export enum OrderStatus {
  AwaitingPayment = 'AwaitingPayment',
  InKitchen = 'InKitchen',
  Ready = 'Ready',
}

// The unit that bakes: one item per oven slot. Carries its category so the
// kitchen can derive its bake time later.
export interface OrderItem {
  id: string;
  category: Category;
}

export interface Order {
  id: string;
  items: OrderItem[];
  source: OrderSource;
  status: OrderStatus;
  totalPrice: number;
  // Set by ConfirmPayment from the Kitchen estimate, once the order enters the
  // kitchen. Absent while still AwaitingPayment.
  estimatedReadyTime?: Date;
  // Recorded once payment succeeds. Absent while still AwaitingPayment.
  payment?: PaymentRecord;
}
