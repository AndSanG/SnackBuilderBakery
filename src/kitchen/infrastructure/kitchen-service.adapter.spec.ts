import { KitchenServiceAdapter } from './kitchen-service.adapter';
import { Kitchen } from '../domain/kitchen';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Category } from '../../shared/domain/category';

const makeSUT = (): {
  sut: KitchenServiceAdapter;
  kitchen: Kitchen;
  clock: FakeClock;
} => {
  const kitchen = new Kitchen();
  const clock = new FakeClock();
  const sut = new KitchenServiceAdapter(kitchen, clock);
  return { sut, kitchen, clock };
};

const cookie = (id: string) => ({
  id,
  orderId: 'o1',
  category: Category.Cookie,
  priority: 3,
});

describe('KitchenServiceAdapter', () => {
  it('estimates a free-kitchen order at its bake time from now', async () => {
    const { sut, clock } = makeSUT();

    const estimate = await sut.estimateReadyTime([cookie('a')]);

    expect(estimate).toEqual(new Date(clock.now().getTime() + 5 * 60_000));
  });

  it('enqueues items so they start baking', async () => {
    const { sut, kitchen } = makeSUT();

    await sut.enqueue([cookie('a'), cookie('b')]);

    expect(kitchen.baking().map((item) => item.id)).toEqual(['a', 'b']);
  });
});
