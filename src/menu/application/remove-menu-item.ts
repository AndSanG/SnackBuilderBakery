import { MenuRepository } from './menu-repository';
import { MenuItemNotFoundError } from './menu-errors';

export class RemoveMenuItem {
  constructor(private readonly repository: MenuRepository) {}

  async execute(id: string): Promise<void> {
    const removed = await this.repository.remove(id);
    if (!removed) {
      throw new MenuItemNotFoundError(id);
    }
  }
}
