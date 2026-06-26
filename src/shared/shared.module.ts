import { Module } from '@nestjs/common';
import { CLOCK } from './clock/clock';
import { SystemClock } from './clock/system-clock';
import { MetricsController } from './presentation/metrics.controller';
import { VersionController } from './presentation/version.controller';

@Module({
  controllers: [MetricsController, VersionController],
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class SharedModule {}
