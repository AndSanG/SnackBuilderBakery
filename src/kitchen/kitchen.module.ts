import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { CLOCK, Clock } from '../shared/clock/clock';
import { Kitchen } from './domain/kitchen';
import { PriorityPolicy } from './domain/scheduling-policy';
import { MonitorKitchen } from './application/monitor-kitchen';
import { KitchenController } from './presentation/kitchen.controller';

export const KITCHEN = Symbol('Kitchen');

// Provides the single, stateful Kitchen aggregate, scheduling by priority, and
// exposes the monitoring view. Orders wires the KitchenService adapter over the
// same Kitchen (consumer-owned port).
@Module({
  imports: [SharedModule],
  controllers: [KitchenController],
  providers: [
    { provide: KITCHEN, useFactory: () => new Kitchen(new PriorityPolicy()) },
    {
      provide: MonitorKitchen,
      useFactory: (kitchen: Kitchen, clock: Clock) =>
        new MonitorKitchen(kitchen, clock),
      inject: [KITCHEN, CLOCK],
    },
  ],
  exports: [KITCHEN],
})
export class KitchenModule {}
