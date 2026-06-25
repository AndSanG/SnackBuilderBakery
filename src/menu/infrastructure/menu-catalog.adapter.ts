import { CatalogItem, MenuCatalog } from '../../orders/application/menu-catalog';
import { MenuRepository } from '../application/menu-repository';

// Menu's implementation of the MenuCatalog port that Orders owns. Exposes only
// what Orders needs (id, category, price), keeping the rest of MenuItem private.
export class MenuCatalogAdapter implements MenuCatalog {
  constructor(private readonly menu: MenuRepository) {}

  async findItem(id: string): Promise<CatalogItem | null> {
    const item = await this.menu.findById(id);
    if (item === null) {
      return null;
    }
    return { id: item.id, category: item.category, price: item.price };
  }
}
