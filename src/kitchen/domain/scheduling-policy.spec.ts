import { FifoPolicy, PriorityPolicy } from './scheduling-policy';
import { BakeableItem } from './kitchen';
import { Category } from '../../shared/domain/category';

const item = (id: string, priority = 3): BakeableItem => ({
  id,
  orderId: 'order-1',
  category: Category.Cookie,
  priority,
});

describe('FifoPolicy', () => {
  it('keeps the arrival order', () => {
    const waiting = [item('a'), item('b'), item('c')];

    const ordered = new FifoPolicy().order(waiting);

    expect(ordered.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    const waiting = [item('a'), item('b')];

    new FifoPolicy().order(waiting);

    expect(waiting.map((i) => i.id)).toEqual(['a', 'b']);
  });
});

describe('PriorityPolicy', () => {
  it('bakes lower priority numbers first, keeping arrival order within a tier', () => {
    const waiting = [item('a', 3), item('b', 1), item('c', 3), item('d', 1)];

    const ordered = new PriorityPolicy().order(waiting);

    expect(ordered.map((i) => i.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('does not mutate the input', () => {
    const waiting = [item('a', 3), item('b', 1)];

    new PriorityPolicy().order(waiting);

    expect(waiting.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
