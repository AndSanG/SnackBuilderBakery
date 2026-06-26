import { AddMenuItem } from './add-menu-item';
import { MenuRepository } from './menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

class MenuRepositorySpy implements MenuRepository {
  addedItems: MenuItem[] = [];

  async getAll(): Promise<MenuItem[]> {
    return [];
  }

  async add(item: MenuItem): Promise<void> {
    this.addedItems.push(item);
  }

  async findById(): Promise<MenuItem | null> {
    return null;
  }

  async applyUpdate(): Promise<MenuItem | null> {
    // unused by AddMenuItem
    return null;
  }

  async remove(): Promise<boolean> {
    // unused by AddMenuItem
    return false;
  }
}

const validData = {
  name: 'Chocolate Chip',
  category: Category.Cookie,
  price: 250,
};

const makeSUT = (): { sut: AddMenuItem; repository: MenuRepositorySpy } => {
  const repository = new MenuRepositorySpy();
  const sut = new AddMenuItem(repository);
  return { sut, repository };
};

describe('AddMenuItem', () => {
  it('does not message the repository upon creation', () => {
    const { repository } = makeSUT();

    expect(repository.addedItems).toHaveLength(0);
  });

  it('adds an item with the given details to the repository', async () => {
    const { sut, repository } = makeSUT();

    await sut.execute(validData);

    expect(repository.addedItems).toEqual([expect.objectContaining(validData)]);
  });

  it('returns the created item with a generated id', async () => {
    const { sut } = makeSUT();

    const result = await sut.execute(validData);

    expect(result).toEqual(expect.objectContaining(validData));
    expect(result.id).toEqual(expect.any(String));
    expect(result.id.length).toBeGreaterThan(0);
  });
});
