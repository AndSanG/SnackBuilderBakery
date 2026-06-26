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
  it('enqueues items and returns their estimate in one call', async () => {
    const { sut, kitchen, clock } = makeSUT();

    const estimate = await sut.enqueueAndEstimate([cookie('a'), cookie('b')]);

    expect(estimate).toEqual(new Date(clock.now().getTime() + 5 * 60_000));
    expect(kitchen.baking().map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('returns the ready time for each order currently in the kitchen', async () => {
    const { sut, clock } = makeSUT();
    await sut.enqueueAndEstimate([cookie('a')]); // one cookie for order 'o1'

    const times = await sut.readyTimes();

    expect(times.get('o1')).toEqual(new Date(clock.now().getTime() + 5 * 60_000));
  });
});
