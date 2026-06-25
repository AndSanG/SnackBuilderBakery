import { Module } from '@nestjs/common';
import { MenuModule, MENU_REPOSITORY } from '../menu/menu.module';
import { MenuRepository } from '../menu/application/menu-repository';
import { MenuCatalogAdapter } from '../menu/infrastructure/menu-catalog.adapter';
import { OrdersController } from './presentation/orders.controller';
import { PlaceOrder } from './application/place-order';
import { TrackOrder } from './application/track-order';
import { MenuCatalog, MENU_CATALOG } from './application/menu-catalog';
import { OrderRepository, ORDER_REPOSITORY } from './application/order-repository';
import { InMemoryOrderRepository } from './infrastructure/in-memory-order-repository';

@Module({
  imports: [MenuModule],
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
    {
      provide: MENU_CATALOG,
      useFactory: (menu: MenuRepository) => new MenuCatalogAdapter(menu),
      inject: [MENU_REPOSITORY],
    },
    {
      provide: PlaceOrder,
      useFactory: (catalog: MenuCatalog, orders: OrderRepository) =>
        new PlaceOrder(catalog, orders),
      inject: [MENU_CATALOG, ORDER_REPOSITORY],
    },
    {
      provide: TrackOrder,
      useFactory: (orders: OrderRepository) => new TrackOrder(orders),
      inject: [ORDER_REPOSITORY],
    },
  ],
})
export class OrdersModule {}
