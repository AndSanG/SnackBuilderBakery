import { Kitchen, OVEN_SLOTS } from './kitchen';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Category } from '../../shared/domain/category';

let nextId = 0;
const item = (category: Category, orderId = 'order-1') => ({
  id: `item-${nextId++}`,
  orderId,
  category,
});
const items = (count: number, category: Category) =>
  Array.from({ length: count }, () => item(category));

const ids = (list: { id: string }[]): string[] => list.map((i) => i.id);

describe('Kitchen', () => {
  it('starts with nothing baking or waiting', () => {
    const kitchen = new Kitchen();

    expect(kitchen.baking()).toEqual([]);
    expect(kitchen.waiting()).toEqual([]);
  });

  it('starts queued items baking up to the oven capacity, leaving the rest waiting', () => {
    const kitchen = new Kitchen();
    const clock = new FakeClock();
    const queued = items(OVEN_SLOTS + 2, Category.Cookie);
    kitchen.enqueue(queued);

    kitchen.reconcile(clock.now());

    expect(kitchen.baking()).toHaveLength(OVEN_SLOTS);
    expect(kitchen.waiting()).toHaveLength(2);
  });

  it('keeps an item baking before its bake time has elapsed', () => {
    const kitchen = new Kitchen();
    const clock = new FakeClock();
    kitchen.enqueue([item(Category.Cookie)]);
    kitchen.reconcile(clock.now());

    clock.advance(4); // cookie bakes in 5 minutes
    kitchen.reconcile(clock.now());

    expect(kitchen.baking()).toHaveLength(1);
  });

  it('completes an item and frees its slot once its bake time has elapsed', () => {
    const kitchen = new Kitchen();
    const clock = new FakeClock();
    kitchen.enqueue([item(Category.Cookie)]);
    kitchen.reconcile(clock.now());

    clock.advance(5);
    kitchen.reconcile(clock.now());

    expect(kitchen.baking()).toEqual([]);
  });

  it('fills a freed slot with the next waiting item', () => {
    const kitchen = new Kitchen();
    const clock = new FakeClock();
    const queued = items(OVEN_SLOTS + 1, Category.Cookie);
    kitchen.enqueue(queued);
    kitchen.reconcile(clock.now());
    const waitingId = ids(kitchen.waiting());

    clock.advance(5);
    kitchen.reconcile(clock.now());

    expect(ids(kitchen.baking())).toEqual(waitingId);
    expect(kitchen.waiting()).toEqual([]);
  });

  it('completes items according to their own category bake times', () => {
    const kitchen = new Kitchen();
    const clock = new FakeClock();
    const cookie = item(Category.Cookie);
    const bread = item(Category.Bread);
    kitchen.enqueue([cookie, bread]);
    kitchen.reconcile(clock.now());

    clock.advance(5); // cookie done (5), bread still baking (20)
    kitchen.reconcile(clock.now());
    expect(ids(kitchen.baking())).toEqual([bread.id]);

    clock.advance(15); // now at 20 minutes, bread done
    kitchen.reconcile(clock.now());
    expect(kitchen.baking()).toEqual([]);
  });
});

const at = (base: Date, minutes: number): Date =>
  new Date(base.getTime() + minutes * 60_000);

describe('Kitchen estimateReadyTime', () => {
  it('estimates each item from now when oven slots are free', () => {
    const kitchen = new Kitchen();
    const now = new FakeClock().now();

    const estimate = kitchen.estimateReadyTime(items(2, Category.Cookie), now);

    expect(estimate).toEqual(at(now, 5));
  });

  it('takes the latest item in a mixed order', () => {
    const kitchen = new Kitchen();
    const now = new FakeClock().now();

    const estimate = kitchen.estimateReadyTime(
      [item(Category.Cookie), item(Category.Bread)],
      now,
    );

    expect(estimate).toEqual(at(now, 20));
  });

  it('estimates behind the items currently baking when the ovens are full', () => {
    const kitchen = new Kitchen();
    const now = new FakeClock().now();
    kitchen.enqueue(items(OVEN_SLOTS, Category.Cookie));
    kitchen.reconcile(now); // six cookies baking, free at now + 5

    const estimate = kitchen.estimateReadyTime(items(2, Category.Cookie), now);

    expect(estimate).toEqual(at(now, 10));
  });

  it('estimates behind items already waiting in the queue', () => {
    const kitchen = new Kitchen();
    const now = new FakeClock().now();
    kitchen.enqueue(items(OVEN_SLOTS, Category.Bread));
    kitchen.reconcile(now); // six breads baking, free at now + 20
    kitchen.enqueue(items(OVEN_SLOTS, Category.Cookie)); // six waiting cookies

    const estimate = kitchen.estimateReadyTime(items(1, Category.Cookie), now);

    expect(estimate).toEqual(at(now, 30));
  });

  it('does not change the kitchen state', () => {
    const kitchen = new Kitchen();
    const now = new FakeClock().now();
    kitchen.enqueue(items(3, Category.Cookie));
    kitchen.reconcile(now);
    const bakingBefore = ids(kitchen.baking());
    const waitingBefore = ids(kitchen.waiting());

    kitchen.estimateReadyTime(items(2, Category.Bread), now);

    expect(ids(kitchen.baking())).toEqual(bakingBefore);
    expect(ids(kitchen.waiting())).toEqual(waitingBefore);
  });
});
