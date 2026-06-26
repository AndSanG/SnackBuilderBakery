import { Module } from '@nestjs/common';
import { Kitchen } from './domain/kitchen';
import { PriorityPolicy } from './domain/scheduling-policy';

export const KITCHEN = Symbol('Kitchen');

// Provides the single, stateful Kitchen aggregate, scheduling by priority.
// Orders wires the KitchenService adapter over it (consumer-owned port).
@Module({
  providers: [
    { provide: KITCHEN, useFactory: () => new Kitchen(new PriorityPolicy()) },
  ],
  exports: [KITCHEN],
})
export class KitchenModule {}
