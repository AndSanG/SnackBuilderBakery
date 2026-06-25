import { Category } from '../../shared/domain/category';

export const KITCHEN_SERVICE = Symbol('KitchenService');

export interface KitchenItem {
  id: string;
  orderId: string;
  category: Category;
}

// Owned by Orders, sized to what ConfirmPayment needs from the kitchen. The
// Kitchen module provides the adapter. (Contracts call this the Kitchen port;
// named KitchenService here to avoid clashing with the Kitchen domain type.)
export interface KitchenService {
  enqueue(items: KitchenItem[]): Promise<void>;
  estimateReadyTime(items: KitchenItem[]): Promise<Date>;
}
