import { MenuController } from './menu.controller';
import { ViewMenu } from '../application/view-menu';
import { AddMenuItem } from '../application/add-menu-item';
import { UpdateMenuItem } from '../application/update-menu-item';
import { RemoveMenuItem } from '../application/remove-menu-item';
import { InMemoryMenuRepository } from '../infrastructure/in-memory-menu-repository';
import { MenuItemNotFoundError } from '../application/menu-errors';
import { Category } from '../domain/menu-item';

const makeSUT = (): { sut: MenuController; repository: InMemoryMenuRepository } => {
  const repository = new InMemoryMenuRepository();
  const sut = new MenuController(
    new ViewMenu(repository),
    new AddMenuItem(repository),
    new UpdateMenuItem(repository),
    new RemoveMenuItem(repository),
  );
  return { sut, repository };
};

const newItem = { name: 'Chocolate Chip', category: Category.Cookie, price: 250 };

describe('MenuController', () => {
  it('lists no items when the menu is empty', async () => {
    const { sut } = makeSUT();

    expect(await sut.list()).toEqual([]);
  });

  it('creates an item and returns it with a generated id', async () => {
    const { sut } = makeSUT();

    const created = await sut.create(newItem);

    expect(created).toEqual({
      id: expect.any(String),
      name: 'Chocolate Chip',
      category: Category.Cookie,
      price: 250,
    });
  });

  it('lists items that were created', async () => {
    const { sut } = makeSUT();
    await sut.create(newItem);

    expect(await sut.list()).toHaveLength(1);
  });

  it('updates an existing item', async () => {
    const { sut } = makeSUT();
    const created = await sut.create(newItem);

    const updated = await sut.update(created.id, { price: 300 });

    expect(updated.price).toBe(300);
  });

  it('removes an existing item', async () => {
    const { sut } = makeSUT();
    const created = await sut.create(newItem);

    await sut.remove(created.id);

    expect(await sut.list()).toEqual([]);
  });

  it('fails with a not found error when updating an unknown item', async () => {
    const { sut } = makeSUT();

    await expect(sut.update('missing', { price: 1 })).rejects.toBeInstanceOf(
      MenuItemNotFoundError,
    );
  });
});
