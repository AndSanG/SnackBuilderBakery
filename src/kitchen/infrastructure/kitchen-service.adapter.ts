import { KitchenItem, KitchenService } from '../../orders/application/kitchen-service';
import { Kitchen } from '../domain/kitchen';
import { Clock } from '../../shared/clock/clock';

// Kitchen's implementation of the KitchenService port that Orders owns. Wraps
// the stateful Kitchen aggregate and the clock, reconciling to the current time
// before each operation so estimates and placement reflect the real state.
export class KitchenServiceAdapter implements KitchenService {
  constructor(
    private readonly kitchen: Kitchen,
    private readonly clock: Clock,
  ) {}

  async enqueueAndEstimate(items: KitchenItem[]): Promise<Date> {
    const now = this.clock.now();
    this.kitchen.reconcile(now);
    const estimate = this.kitchen.estimateReadyTime(items, now);
    this.kitchen.enqueue(items);
    this.kitchen.reconcile(now);
    return estimate;
  }

  async readyTimes(): Promise<Map<string, Date>> {
    const now = this.clock.now();
    this.kitchen.reconcile(now);
    return this.kitchen.readyTimes(now);
  }
}
