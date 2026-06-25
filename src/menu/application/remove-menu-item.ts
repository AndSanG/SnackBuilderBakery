import { MenuRepository } from './menu-repository';
import { MenuItemNotFoundError } from './menu-errors';

export class RemoveMenuItem {
  constructor(private readonly repository: MenuRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      throw new MenuItemNotFoundError(id);
    }
    await this.repository.remove(id);
  }
}
