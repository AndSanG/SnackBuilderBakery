import { Module } from '@nestjs/common';

/**
 * Cross-cutting providers shared across feature modules.
 * The Clock port and its SystemClock implementation will live here.
 */
@Module({})
export class SharedModule {}
