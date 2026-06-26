import { MenuItem } from '../domain/menu-item';

/**
 * Persistence port for menu items, owned by the Menu module.
 * Grows one operation at a time as use cases require them.
 */
export interface MenuRepository {
  getAll(): Promise<MenuItem[]>;
  add(item: MenuItem): Promise<void>;
  findById(id: string): Promise<MenuItem | null>;
  // Atomically merge fields into an existing item and return the result, or
  // null if it does not exist. The read, merge, and write are one step, so a
  // concurrent remove cannot be undone by an update writing back a stale item
  // (no resurrection) and two updates cannot lose each other's fields.
  applyUpdate(
    id: string,
    fields: Partial<Omit<MenuItem, 'id'>>,
  ): Promise<MenuItem | null>;
  // Returns whether an item was deleted, so callers detect "not found" without
  // a separate read-then-delete that another remove could race.
  remove(id: string): Promise<boolean>;
}
