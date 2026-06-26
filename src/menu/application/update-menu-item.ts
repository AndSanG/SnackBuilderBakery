import { MenuItem } from '../domain/menu-item';
import { MenuRepository } from './menu-repository';
import { MenuItemNotFoundError } from './menu-errors';
import { NewMenuItem } from './add-menu-item';

export class UpdateMenuItem {
  constructor(private readonly repository: MenuRepository) {}

  async execute(id: string, fields: Partial<NewMenuItem>): Promise<MenuItem> {
    const updated = await this.repository.applyUpdate(id, fields);
    if (updated === null) {
      throw new MenuItemNotFoundError(id);
    }
    return updated;
  }
}
