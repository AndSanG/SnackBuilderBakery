import { Module } from '@nestjs/common';
import { Kitchen } from './domain/kitchen';

export const KITCHEN = Symbol('Kitchen');

// Provides the single, stateful Kitchen aggregate. Orders wires the
// KitchenService adapter over it (consumer-owned port).
@Module({
  providers: [{ provide: KITCHEN, useFactory: () => new Kitchen() }],
  exports: [KITCHEN],
})
export class KitchenModule {}
