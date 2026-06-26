import { FifoPolicy } from './scheduling-policy';
import { BakeableItem } from './kitchen';
import { Category } from '../../shared/domain/category';

const item = (id: string): BakeableItem => ({
  id,
  orderId: 'order-1',
  category: Category.Cookie,
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
