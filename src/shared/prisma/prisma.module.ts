import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA_CLIENT = Symbol('PrismaClient');

// ponytail: single PrismaClient for the whole app; both MenuModule and OrdersModule
// inject it via PRISMA_CLIENT rather than each calling new PrismaClient().
@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      useValue: process.env.DATABASE_URL ? new PrismaClient() : null,
    },
  ],
  exports: [PRISMA_CLIENT],
})
export class PrismaModule {}
