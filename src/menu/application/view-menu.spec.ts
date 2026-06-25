import { ViewMenu } from './view-menu';
import { MenuRepository } from './menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

class MenuRepositorySpy implements MenuRepository {
  getAllCallCount = 0;
  private result: MenuItem[] = [];

  async getAll(): Promise<MenuItem[]> {
    this.getAllCallCount += 1;
    return this.result;
  }

  async add(): Promise<void> {
    // ponytail: unused by ViewMenu, present only to satisfy the port
  }

  async findById(): Promise<MenuItem | null> {
    return null;
  }

  async update(): Promise<void> {
    // unused by ViewMenu
  }

  async remove(): Promise<void> {
    // unused by ViewMenu
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
  it('does not message the repository upon creation', () => {
    const { repository } = makeSUT();

    expect(repository.getAllCallCount).toBe(0);
  });

  it('requests all items from the repository when executed', async () => {
    const { sut, repository } = makeSUT();

    await sut.execute();

    expect(repository.getAllCallCount).toBe(1);
  });

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
