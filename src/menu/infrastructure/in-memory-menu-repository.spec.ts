import { InMemoryMenuRepository } from './in-memory-menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

const item = (id: string, over: Partial<MenuItem> = {}): MenuItem => ({
  id,
  name: `item-${id}`,
  category: Category.Cookie,
  price: 100,
  ...over,
});

const makeSUT = (): InMemoryMenuRepository => new InMemoryMenuRepository();

describe('InMemoryMenuRepository', () => {
  it('returns no items when empty', async () => {
    const sut = makeSUT();

    expect(await sut.getAll()).toEqual([]);
  });

  it('returns added items', async () => {
    const sut = makeSUT();
    const added = item('1');

    await sut.add(added);

    expect(await sut.getAll()).toEqual([added]);
  });

  it('finds an item by id', async () => {
    const sut = makeSUT();
    const added = item('1');
    await sut.add(added);

    expect(await sut.findById('1')).toEqual(added);
  });

  it('returns null when finding an unknown id', async () => {
    const sut = makeSUT();

    expect(await sut.findById('missing')).toBeNull();
  });

  it('merges fields and returns the updated item on applyUpdate', async () => {
    const sut = makeSUT();
    await sut.add(item('1', { name: 'Old', price: 100 }));

    const updated = await sut.applyUpdate('1', { name: 'New' });

    expect(updated).toEqual(item('1', { name: 'New', price: 100 }));
    expect(await sut.findById('1')).toEqual(
      item('1', { name: 'New', price: 100 }),
    );
  });

  it('returns null and writes nothing when applyUpdate targets a missing item', async () => {
    const sut = makeSUT();

    expect(await sut.applyUpdate('missing', { name: 'New' })).toBeNull();
    expect(await sut.getAll()).toEqual([]);
  });

  it('does not resurrect a removed item via applyUpdate', async () => {
    const sut = makeSUT();
    await sut.add(item('1'));

    await sut.remove('1');
    const updated = await sut.applyUpdate('1', { name: 'New' });

    expect(updated).toBeNull();
    expect(await sut.findById('1')).toBeNull();
  });

  it('reports whether remove deleted an item', async () => {
    const sut = makeSUT();
    await sut.add(item('1'));

    expect(await sut.remove('1')).toBe(true);
    expect(await sut.remove('1')).toBe(false);
    expect(await sut.findById('1')).toBeNull();
  });
});
