import { priorityTierFor, PriorityTier } from './priority-tier';
import { OrderSource } from './order-source';

describe('priorityTierFor', () => {
  it('maps a VIP source to tier 1', () => {
    expect(priorityTierFor(OrderSource.Vip)).toBe(PriorityTier.Tier1);
  });

  it('maps an app or delivery source to tier 2', () => {
    expect(priorityTierFor(OrderSource.AppDelivery)).toBe(PriorityTier.Tier2);
  });

  it('maps a walk-in source to tier 3', () => {
    expect(priorityTierFor(OrderSource.WalkIn)).toBe(PriorityTier.Tier3);
  });
});
