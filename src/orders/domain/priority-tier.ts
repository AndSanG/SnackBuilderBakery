import { OrderSource } from './order-source';

export enum PriorityTier {
  Tier1 = 1,
  Tier2 = 2,
  Tier3 = 3,
}

const tierBySource: Record<OrderSource, PriorityTier> = {
  [OrderSource.Vip]: PriorityTier.Tier1,
  [OrderSource.AppDelivery]: PriorityTier.Tier2,
  [OrderSource.WalkIn]: PriorityTier.Tier3,
};

// Priority tier is derived from the order source, never stored on the order.
export const priorityTierFor = (source: OrderSource): PriorityTier =>
  tierBySource[source];
