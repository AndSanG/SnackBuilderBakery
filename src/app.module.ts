import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { SharedModule } from './shared/shared.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.NODE_ENV === 'production' ? 'info' : 'debug' } }),
    SharedModule,
    PrismaModule,
    MenuModule,
    OrdersModule,
  ],
})
export class AppModule {}
