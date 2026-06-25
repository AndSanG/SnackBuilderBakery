import { Order } from '../domain/order';

export const ORDER_REPOSITORY = Symbol('OrderRepository');

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}
