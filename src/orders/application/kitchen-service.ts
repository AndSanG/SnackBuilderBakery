import { Category } from '../../shared/domain/category';

export const KITCHEN_SERVICE = Symbol('KitchenService');

export interface KitchenItem {
  id: string;
  orderId: string;
  category: Category;
  // Lower bakes first. Orders derives this from the order source's priority
  // tier; the kitchen treats it as opaque.
  priority: number;
}

// Owned by Orders, sized to what ConfirmPayment needs from the kitchen. The
// Kitchen module provides the adapter. (Contracts call this the Kitchen port;
// named KitchenService here to avoid clashing with the Kitchen domain type.)
export interface KitchenService {
  // Computes the ready-time estimate and enqueues the items in one atomic
  // operation. Keeping them together closes the concurrent estimate-drift race:
  // two simultaneous confirmations would otherwise both estimate before either
  // enqueues, giving both an optimistic (wrong) ready time.
  enqueueAndEstimate(items: KitchenItem[]): Promise<Date>;
  // Current ready time of every order in the kitchen, keyed by order id. Used
  // to refresh estimates after a higher-priority order reorders the queue.
  readyTimes(): Promise<Map<string, Date>>;
}
