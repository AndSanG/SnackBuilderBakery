import { ViewMenu } from './view-menu';
import { MenuRepository } from './menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

class MenuRepositorySpy implements MenuRepository {
  private result: MenuItem[] = [];

  async getAll(): Promise<MenuItem[]> {
    return this.result;
  }

  async add(): Promise<void> {
    // ponytail: unused by ViewMenu, present only to satisfy the port
  }

  async findById(): Promise<MenuItem | null> {
    return null;
  }

  async applyUpdate(): Promise<MenuItem | null> {
    // unused by ViewMenu
    return null;
  }

  async remove(): Promise<boolean> {
    // unused by ViewMenu
    return false;
  }

  stubGetAll(items: MenuItem[]): void {
    this.result = items;
  }
}

const anyItem = (id: string): MenuItem => ({
  id,
  name: `item-${id}`,
  category: Category.Cookie,
  price: 100,
});

const makeSUT = (): { sut: ViewMenu; repository: MenuRepositorySpy } => {
  const repository = new MenuRepositorySpy();
  const sut = new ViewMenu(repository);
  return { sut, repository };
};

describe('ViewMenu', () => {
  it('delivers no items on an empty repository', async () => {
    const { sut, repository } = makeSUT();
    repository.stubGetAll([]);

    const result = await sut.execute();

    expect(result).toEqual([]);
  });

  it('delivers all items from the repository', async () => {
    const { sut, repository } = makeSUT();
    const items = [anyItem('1'), anyItem('2')];
    repository.stubGetAll(items);

    const result = await sut.execute();

    expect(result).toEqual(items);
  });
});
