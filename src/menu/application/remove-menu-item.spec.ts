import { RemoveMenuItem } from './remove-menu-item';
import { MenuItemNotFoundError } from './menu-errors';
import { MenuRepository } from './menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

class MenuRepositorySpy implements MenuRepository {
  removedIds: string[] = [];
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

  async applyUpdate(): Promise<MenuItem | null> {
    // unused by RemoveMenuItem
    return null;
  }

  async remove(id: string): Promise<boolean> {
    if (this.found === null) {
      return false;
    }
    this.removedIds.push(id);
    return true;
  }

  stubExisting(item: MenuItem | null): void {
    this.found = item;
  }
}

const existingItem: MenuItem = {
  id: 'item-1',
  name: 'Sourdough',
  category: Category.Bread,
  price: 400,
};

const makeSUT = (): { sut: RemoveMenuItem; repository: MenuRepositorySpy } => {
  const repository = new MenuRepositorySpy();
  const sut = new RemoveMenuItem(repository);
  return { sut, repository };
};

describe('RemoveMenuItem', () => {
  it('does not message the repository upon creation', () => {
    const { repository } = makeSUT();

    expect(repository.removedIds).toHaveLength(0);
  });

  it('removes the existing item from the repository', async () => {
    const { sut, repository } = makeSUT();
    repository.stubExisting(existingItem);

    await sut.execute('item-1');

    expect(repository.removedIds).toEqual(['item-1']);
  });

  it('fails with a not found error and does not remove when the item does not exist', async () => {
    const { sut, repository } = makeSUT();
    repository.stubExisting(null);

    await expect(sut.execute('missing')).rejects.toBeInstanceOf(
      MenuItemNotFoundError,
    );
    expect(repository.removedIds).toHaveLength(0);
  });
});
