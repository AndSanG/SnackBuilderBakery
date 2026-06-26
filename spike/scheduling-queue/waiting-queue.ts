// Spike: alternative data structures for the kitchen's waiting queue.
//
// The kitchen needs one thing from the queue: given the items waiting, produce
// them in bake order (priority ascending, arrival order within a tier). Both
// reconcile (fill free slots) and the estimate (forward simulation on a copy)
// call ordered(). So the access pattern is "many enqueues, then a full ordered
// read", repeated every reconcile.

export interface QueueItem {
  id: string;
  priority: number; // lower bakes first
}

// Bake order: priority first, then arrival (stable within a tier).
export interface Node extends QueueItem {
  arrival: number;
}

export const byBakeOrder = (a: Node, b: Node): number =>
  a.priority - b.priority || a.arrival - b.arrival;

export interface WaitingQueue {
  enqueue(item: QueueItem): void;
  // The full waiting set in bake order. Non-destructive: the kitchen also calls
  // this on a copy during estimation, so it must not consume the queue.
  ordered(): QueueItem[];
  size(): number;
}
