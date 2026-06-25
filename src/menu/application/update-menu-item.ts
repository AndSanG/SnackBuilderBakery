import { MenuItem } from '../domain/menu-item';
import { MenuRepository } from './menu-repository';
import { MenuItemNotFoundError } from './menu-errors';
import { NewMenuItem } from './add-menu-item';

export class UpdateMenuItem {
  constructor(private readonly repository: MenuRepository) {}

  async execute(id: string, fields: Partial<NewMenuItem>): Promise<MenuItem> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      throw new MenuItemNotFoundError(id);
    }
    const updated: MenuItem = { ...existing, ...fields };
    await this.repository.update(updated);
    return updated;
  }
}
