import { UpdateMenuItem } from './update-menu-item';
import { MenuItemNotFoundError } from './menu-errors';
import { MenuRepository } from './menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

class MenuRepositorySpy implements MenuRepository {
  updatedItems: MenuItem[] = [];
  private found: MenuItem | null = null;

  async getAll(): Promise<MenuItem[]> {
    return [];
  }

  async add(): Promise<void> {
    // unused here
  }

  async findById(): Promise<MenuItem | null> {
    return this.found;
  }

  async update(item: MenuItem): Promise<void> {
    this.updatedItems.push(item);
  }

  async remove(): Promise<void> {
    // unused by UpdateMenuItem
  }

  stubFindById(item: MenuItem | null): void {
    this.found = item;
  }
}

const existingItem: MenuItem = {
  id: 'item-1',
  name: 'Old Name',
  category: Category.Bread,
  price: 100,
};

const makeSUT = (): { sut: UpdateMenuItem; repository: MenuRepositorySpy } => {
  const repository = new MenuRepositorySpy();
  const sut = new UpdateMenuItem(repository);
  return { sut, repository };
};

describe('UpdateMenuItem', () => {
  it('does not message the repository upon creation', () => {
    const { repository } = makeSUT();

    expect(repository.updatedItems).toHaveLength(0);
  });

  it('persists the existing item with the merged details', async () => {
    const { sut, repository } = makeSUT();
    repository.stubFindById(existingItem);

    await sut.execute('item-1', { name: 'New Name', price: 350 });

    expect(repository.updatedItems).toEqual([
      { id: 'item-1', name: 'New Name', category: Category.Bread, price: 350 },
    ]);
  });

  it('returns the updated item', async () => {
    const { sut, repository } = makeSUT();
    repository.stubFindById(existingItem);

    const result = await sut.execute('item-1', { name: 'New Name', price: 350 });

    expect(result).toEqual({
      id: 'item-1',
      name: 'New Name',
      category: Category.Bread,
      price: 350,
    });
  });

  it('fails with a not found error and does not persist when the item does not exist', async () => {
    const { sut, repository } = makeSUT();
    repository.stubFindById(null);

    await expect(sut.execute('missing', { name: 'x' })).rejects.toBeInstanceOf(
      MenuItemNotFoundError,
    );
    expect(repository.updatedItems).toHaveLength(0);
  });
});
