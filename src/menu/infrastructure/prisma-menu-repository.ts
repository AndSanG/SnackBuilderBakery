import { PrismaClient, Prisma } from '@prisma/client';
import { MenuItem } from '../domain/menu-item';
import { MenuRepository } from '../application/menu-repository';
import { Category } from '../../shared/domain/category';

function toDomain(row: { id: string; name: string; category: string; price: number }): MenuItem {
  return { id: row.id, name: row.name, category: row.category as Category, price: row.price };
}

export class PrismaMenuRepository implements MenuRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(): Promise<MenuItem[]> {
    return (await this.prisma.menuItem.findMany()).map(toDomain);
  }

  async add(item: MenuItem): Promise<void> {
    await this.prisma.menuItem.create({ data: item });
  }

  async findById(id: string): Promise<MenuItem | null> {
    const row = await this.prisma.menuItem.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  // Single UPDATE ... WHERE id=?: if the row is gone (P2025) return null. No
  // separate read step, so a concurrent remove cannot be undone by an update
  // writing back a stale item (no resurrection).
  async applyUpdate(
    id: string,
    fields: Partial<Omit<MenuItem, 'id'>>,
  ): Promise<MenuItem | null> {
    try {
      return toDomain(await this.prisma.menuItem.update({ where: { id }, data: fields }));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    }
  }

  // deleteMany returns the affected count; no separate read needed, so a
  // concurrent remove cannot split the not-found decision from the delete.
  async remove(id: string): Promise<boolean> {
    const result = await this.prisma.menuItem.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
