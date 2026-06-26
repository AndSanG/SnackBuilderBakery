import { Category } from '../../shared/domain/category';
import { Clock } from '../../shared/clock/clock';
import {
  BakeableItem,
  Kitchen,
  OVENS,
  OvenSlot,
  TRAYS_PER_OVEN,
} from '../domain/kitchen';

export interface ItemView {
  id: string;
  orderId: string;
  category: Category;
}

export interface TrayView {
  item: ItemView | null;
  readyAt: Date | null;
}

export interface OvenView {
  oven: number;
  trays: TrayView[];
}

export interface KitchenView {
  ovens: OvenView[];
  waiting: ItemView[];
}

const toItemView = (item: BakeableItem): ItemView => ({
  id: item.id,
  orderId: item.orderId,
  category: item.category,
});

const toTrayView = (slot: OvenSlot | null): TrayView =>
  slot === null
    ? { item: null, readyAt: null }
    : { item: toItemView(slot.item), readyAt: slot.readyAt };

// Gives the kitchen manager the current picture: what is baking in which oven
// and what is waiting. Advances the kitchen to now first so the view is current
// (the kitchen is poll-based and moves only on reconcile).
export class MonitorKitchen {
  constructor(
    private readonly kitchen: Kitchen,
    private readonly clock: Clock,
  ) {}

  execute(): KitchenView {
    this.kitchen.reconcile(this.clock.now());

    const slots = this.kitchen.slotStates();
    const ovens: OvenView[] = [];
    for (let oven = 0; oven < OVENS; oven++) {
      const start = oven * TRAYS_PER_OVEN;
      ovens.push({
        oven: oven + 1,
        trays: slots.slice(start, start + TRAYS_PER_OVEN).map(toTrayView),
      });
    }

    return { ovens, waiting: this.kitchen.waiting().map(toItemView) };
  }
}
