import { MonitorKitchen } from './monitor-kitchen';
import { Kitchen } from '../domain/kitchen';
import { PriorityPolicy } from '../domain/scheduling-policy';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Category } from '../../shared/domain/category';

let nextId = 0;
const cookie = (orderId = 'o1') => ({
  id: `i${nextId++}`,
  orderId,
  category: Category.Cookie,
  priority: 3,
});

const makeSUT = () => {
  const kitchen = new Kitchen(new PriorityPolicy());
  const clock = new FakeClock();
  return { sut: new MonitorKitchen(kitchen, clock), kitchen, clock };
};

describe('MonitorKitchen', () => {
  it('shows two ovens of three trays', () => {
    const { sut } = makeSUT();

    const view = sut.execute();

    expect(view.ovens).toHaveLength(2);
    expect(view.ovens.map((o) => o.oven)).toEqual([1, 2]);
    expect(view.ovens[0].trays).toHaveLength(3);
    expect(view.ovens[1].trays).toHaveLength(3);
  });

  it('reports which item is baking in which tray, with its ready time', () => {
    const { sut, kitchen, clock } = makeSUT();
    kitchen.enqueue([cookie(), cookie(), cookie(), cookie()]); // 4 cookies, 4 trays

    const view = sut.execute();

    const occupied = view.ovens.flatMap((o) => o.trays).filter((t) => t.item);
    expect(occupied).toHaveLength(4);
    expect(occupied[0].item?.category).toBe(Category.Cookie);
    expect(occupied[0].readyAt).toEqual(
      new Date(clock.now().getTime() + 5 * 60_000),
    );
    // oven 2 has one cookie then two empty trays
    expect(view.ovens[1].trays[1].item).toBeNull();
    expect(view.ovens[1].trays[1].readyAt).toBeNull();
  });

  it('lists items waiting beyond capacity in bake order', () => {
    const { sut, kitchen } = makeSUT();
    kitchen.enqueue(Array.from({ length: 8 }, () => cookie())); // 6 bake, 2 wait

    const view = sut.execute();

    expect(view.waiting).toHaveLength(2);
    expect(view.waiting[0].category).toBe(Category.Cookie);
  });
});
