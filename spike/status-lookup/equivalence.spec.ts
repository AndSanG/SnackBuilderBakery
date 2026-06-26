import { OrderStore } from './order-store';
import { ScanStore } from './scan-store';
import { IndexedStore } from './indexed-store';

const sorted = (store: OrderStore, status: string): string[] =>
  store
    .findByStatus(status)
    .map((o) => o.id)
    .sort();

describe('OrderStore implementations are equivalent', () => {
  it('agree after saves and status changes (the index stays consistent)', () => {
    const scan = new ScanStore();
    const indexed = new IndexedStore();
    const statuses = ['AwaitingPayment', 'InKitchen', 'Ready'];

    for (let i = 0; i < 1000; i++) {
      const id = `o${i % 200}`; // reuse ids so some saves are status changes
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      scan.save({ id, status });
      indexed.save({ id, status });
    }

    for (const status of statuses) {
      expect(sorted(indexed, status)).toEqual(sorted(scan, status));
    }
  });
});
