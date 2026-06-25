import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [SharedModule, MenuModule, OrdersModule],
})
export class AppModule {}
