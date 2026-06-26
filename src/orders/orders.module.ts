import { Module } from '@nestjs/common';
import { MenuModule, MENU_REPOSITORY } from '../menu/menu.module';
import { MenuRepository } from '../menu/application/menu-repository';
import { MenuCatalogAdapter } from '../menu/infrastructure/menu-catalog.adapter';
import { KitchenModule, KITCHEN } from '../kitchen/kitchen.module';
import { Kitchen } from '../kitchen/domain/kitchen';
import { KitchenServiceAdapter } from '../kitchen/infrastructure/kitchen-service.adapter';
import { SharedModule } from '../shared/shared.module';
import { CLOCK, Clock } from '../shared/clock/clock';
import { OrdersController } from './presentation/orders.controller';
import { PlaceOrder } from './application/place-order';
import { TrackOrder } from './application/track-order';
import { ConfirmPayment } from './application/confirm-payment';
import { ReconcileOrders } from './application/reconcile-orders';
import { MenuCatalog, MENU_CATALOG } from './application/menu-catalog';
import { OrderRepository, ORDER_REPOSITORY } from './application/order-repository';
import { KitchenService, KITCHEN_SERVICE } from './application/kitchen-service';
import { PaymentProcessor, PAYMENT_PROCESSOR } from './application/payment-processor';
import { InMemoryOrderRepository } from './infrastructure/in-memory-order-repository';
import { LocalPaymentProcessor } from './infrastructure/local-payment-processor';

@Module({
  imports: [MenuModule, KitchenModule, SharedModule],
  controllers: [OrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
    { provide: PAYMENT_PROCESSOR, useClass: LocalPaymentProcessor },
    {
      provide: MENU_CATALOG,
      useFactory: (menu: MenuRepository) => new MenuCatalogAdapter(menu),
      inject: [MENU_REPOSITORY],
    },
    {
      provide: KITCHEN_SERVICE,
      useFactory: (kitchen: Kitchen, clock: Clock) =>
        new KitchenServiceAdapter(kitchen, clock),
      inject: [KITCHEN, CLOCK],
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
    {
      provide: ConfirmPayment,
      useFactory: (
        orders: OrderRepository,
        kitchen: KitchenService,
        payments: PaymentProcessor,
      ) => new ConfirmPayment(orders, kitchen, payments),
      inject: [ORDER_REPOSITORY, KITCHEN_SERVICE, PAYMENT_PROCESSOR],
    },
    {
      provide: ReconcileOrders,
      useFactory: (orders: OrderRepository, clock: Clock) =>
        new ReconcileOrders(orders, clock),
      inject: [ORDER_REPOSITORY, CLOCK],
    },
  ],
})
export class OrdersModule {}
