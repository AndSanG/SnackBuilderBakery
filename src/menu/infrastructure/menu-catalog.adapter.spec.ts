import { MenuCatalogAdapter } from './menu-catalog.adapter';
import { InMemoryMenuRepository } from './in-memory-menu-repository';
import { Category } from '../domain/menu-item';

const makeSUT = (): {
  sut: MenuCatalogAdapter;
  repository: InMemoryMenuRepository;
} => {
  const repository = new InMemoryMenuRepository();
  const sut = new MenuCatalogAdapter(repository);
  return { sut, repository };
};

describe('MenuCatalogAdapter', () => {
  it('returns null when the menu item does not exist', async () => {
    const { sut } = makeSUT();

    expect(await sut.findItem('missing')).toBeNull();
  });

  it('exposes the id, category, and price of an existing menu item', async () => {
    const { sut, repository } = makeSUT();
    await repository.add({
      id: 'cookie',
      name: 'Chocolate Chip',
      category: Category.Cookie,
      price: 250,
    });

    expect(await sut.findItem('cookie')).toEqual({
      id: 'cookie',
      category: Category.Cookie,
      price: 250,
    });
  });
});
