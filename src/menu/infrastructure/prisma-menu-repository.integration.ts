// Integration tests for PrismaMenuRepository.
// Requires a running PostgreSQL with the schema applied (prisma db push / migrate dev).
// Skipped automatically when DATABASE_URL is absent so unit CI stays database-free.
import { PrismaClient } from '@prisma/client';
import { PrismaMenuRepository } from './prisma-menu-repository';
import { MenuItem, Category } from '../domain/menu-item';

const describeIf = (cond: boolean) =>
  cond ? describe : describe.skip;

const anItem = (id: string, over: Partial<MenuItem> = {}): MenuItem => ({
  id,
  name: `item-${id}`,
  category: Category.Cookie,
  price: 100,
  ...over,
});

describeIf(!!process.env.DATABASE_URL)('PrismaMenuRepository (integration)', () => {
  let prisma: PrismaClient;
  let sut: PrismaMenuRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    sut = new PrismaMenuRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.menuItem.deleteMany();
  });

  it('returns no items when empty', async () => {
    expect(await sut.getAll()).toEqual([]);
  });

  it('adds and retrieves all items', async () => {
    await sut.add(anItem('1'));

    expect(await sut.getAll()).toEqual([anItem('1')]);
  });

  it('finds an item by id', async () => {
    await sut.add(anItem('1'));

    expect(await sut.findById('1')).toEqual(anItem('1'));
  });

  it('returns null for an unknown id', async () => {
    expect(await sut.findById('missing')).toBeNull();
  });

  it('applyUpdate merges fields and returns the updated item', async () => {
    await sut.add(anItem('1', { name: 'Old', price: 100 }));

    const updated = await sut.applyUpdate('1', { name: 'New' });

    expect(updated).toEqual(anItem('1', { name: 'New', price: 100 }));
    expect(await sut.findById('1')).toEqual(anItem('1', { name: 'New', price: 100 }));
  });

  it('applyUpdate returns null for a missing item', async () => {
    expect(await sut.applyUpdate('missing', { name: 'New' })).toBeNull();
  });

  // The key concurrency proof: a remove then applyUpdate must not resurrect the
  // item. The Prisma UPDATE ... WHERE id=? throws P2025 (no rows), so the
  // remove is permanent and cannot be undone by a racing update.
  it('applyUpdate does not resurrect a removed item', async () => {
    await sut.add(anItem('1'));

    await sut.remove('1');
    const result = await sut.applyUpdate('1', { name: 'New' });

    expect(result).toBeNull();
    expect(await sut.findById('1')).toBeNull();
  });

  it('remove returns true when an item was deleted', async () => {
    await sut.add(anItem('1'));

    expect(await sut.remove('1')).toBe(true);
  });

  it('remove returns false for an unknown item', async () => {
    expect(await sut.remove('missing')).toBe(false);
  });

  it('remove is idempotent on the second call', async () => {
    await sut.add(anItem('1'));
    await sut.remove('1');

    expect(await sut.remove('1')).toBe(false);
    expect(await sut.findById('1')).toBeNull();
  });
});
