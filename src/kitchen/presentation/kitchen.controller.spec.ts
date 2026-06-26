import { KitchenController } from './kitchen.controller';
import { MonitorKitchen } from '../application/monitor-kitchen';
import { Kitchen } from '../domain/kitchen';
import { PriorityPolicy } from '../domain/scheduling-policy';
import { FakeClock } from '../../shared/clock/fake-clock';
import { Category } from '../../shared/domain/category';

const makeSUT = () => {
  const kitchen = new Kitchen(new PriorityPolicy());
  const sut = new KitchenController(new MonitorKitchen(kitchen, new FakeClock()));
  return { sut, kitchen };
};

describe('KitchenController', () => {
  it('returns the kitchen view', () => {
    const { sut, kitchen } = makeSUT();
    kitchen.enqueue([
      { id: 'i1', orderId: 'o1', category: Category.Cookie, priority: 3 },
    ]);

    const view = sut.view();

    expect(view.ovens).toHaveLength(2);
    expect(view.ovens[0].trays[0].item?.id).toBe('i1');
  });
});
