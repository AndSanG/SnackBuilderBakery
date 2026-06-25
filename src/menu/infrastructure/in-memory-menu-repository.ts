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

  async update(item: MenuItem): Promise<void> {
    this.items.set(item.id, item);
  }

  async remove(id: string): Promise<void> {
    this.items.delete(id);
  }
}
