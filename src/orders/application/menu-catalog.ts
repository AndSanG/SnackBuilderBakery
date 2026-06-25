import { Category } from '../../menu/domain/menu-item';

// ponytail: Category is imported from the menu domain as a shared kernel.
// Extract to a shared/domain module if a third module starts depending on it.
export interface CatalogItem {
  id: string;
  category: Category;
  price: number;
}

export const MENU_CATALOG = Symbol('MenuCatalog');

// Owned by Orders, sized to what PlaceOrder needs from the menu. The Menu
// module provides the adapter that implements it.
export interface MenuCatalog {
  findItem(id: string): Promise<CatalogItem | null>;
}
