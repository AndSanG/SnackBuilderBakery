import { MenuItem } from '../domain/menu-item';

/**
 * Persistence port for menu items, owned by the Menu module.
 * Grows one operation at a time as use cases require them.
 */
export interface MenuRepository {
  getAll(): Promise<MenuItem[]>;
}
