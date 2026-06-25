import { Module } from '@nestjs/common';
import { CLOCK } from './clock/clock';
import { SystemClock } from './clock/system-clock';

/**
 * Cross-cutting providers shared across feature modules.
 * Provides the Clock port (real implementation) for the kitchen.
 */
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class SharedModule {}
