// Spike: alternative data structures for OrderRepository.findByStatus.
//
// ReconcileOrders and the VIP ripple both ask "which orders are InKitchen?".
// The in-memory repo answers by scanning every order. The question is whether a
// secondary index on status is worth its bookkeeping.

export interface StoredOrder {
  id: string;
  status: string;
}

export interface OrderStore {
  save(order: StoredOrder): void;
  findById(id: string): StoredOrder | null;
  findByStatus(status: string): StoredOrder[];
}
