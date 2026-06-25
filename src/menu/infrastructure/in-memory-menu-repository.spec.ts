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

  it('replaces an item on update', async () => {
    const sut = makeSUT();
    await sut.add(item('1', { name: 'Old' }));

    await sut.update(item('1', { name: 'New' }));

    expect(await sut.findById('1')).toEqual(item('1', { name: 'New' }));
  });

  it('deletes an item on remove', async () => {
    const sut = makeSUT();
    await sut.add(item('1'));

    await sut.remove('1');

    expect(await sut.findById('1')).toBeNull();
  });
});
