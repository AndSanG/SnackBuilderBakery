import { randomUUID } from 'node:crypto';
import { Category, MenuItem } from '../domain/menu-item';
import { MenuRepository } from './menu-repository';

export interface NewMenuItem {
  name: string;
  category: Category;
  price: number;
}

export class AddMenuItem {
  constructor(private readonly repository: MenuRepository) {}

  async execute(data: NewMenuItem): Promise<MenuItem> {
    // ponytail: no validation here. Name/category/price rules live on
    // CreateMenuItemDto (class-validator) at the controller boundary, so the
    // use case trusts its input. Add a guard here only for a true business
    // invariant the DTO cannot express.
    const item: MenuItem = { id: randomUUID(), ...data };
    await this.repository.add(item);
    return item;
  }
}
