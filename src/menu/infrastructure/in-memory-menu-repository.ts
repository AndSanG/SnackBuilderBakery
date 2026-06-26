import { MenuItem } from '../domain/menu-item';
import { MenuRepository } from '../application/menu-repository';

export class InMemoryMenuRepository implements MenuRepository {
  private readonly items = new Map<string, MenuItem>();

  async getAll(): Promise<MenuItem[]> {
    return [...this.items.values()];
  }

  async add(item: MenuItem): Promise<void> {
    this.items.set(item.id, item);
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.items.get(id) ?? null;
  }

  // Synchronous get/merge/set: no await between the existence check and the
  // write, so a concurrent remove cannot interleave and be resurrected, and two
  // updates cannot clobber each other's fields. Mirrors a database
  // UPDATE ... SET ... WHERE id=? returning the affected row.
  async applyUpdate(
    id: string,
    fields: Partial<Omit<MenuItem, 'id'>>,
  ): Promise<MenuItem | null> {
    const existing = this.items.get(id);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...fields };
    this.items.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}
