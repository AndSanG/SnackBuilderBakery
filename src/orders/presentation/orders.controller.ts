import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlaceOrder } from '../application/place-order';
import { TrackOrder } from '../application/track-order';
import { ConfirmPayment } from '../application/confirm-payment';
import { ReconcileOrders } from '../application/reconcile-orders';
import { PlaceOrderDto } from './dto/place-order.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

// The use cases already return view-shaped results (Ticket, OrderStatusView,
// Confirmation), so the controller has no entity to map: it just delegates.
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly placeOrder: PlaceOrder,
    private readonly trackOrder: TrackOrder,
    private readonly confirmPayment: ConfirmPayment,
    private readonly reconcileOrders: ReconcileOrders,
  ) {}

  @ApiOperation({ summary: 'Place an order' })
  @Post()
  async place(@Body() dto: PlaceOrderDto) {
    return this.placeOrder.execute(dto);
  }

  // Poll-based: nothing moves on its own, so a reconcile call advances orders
  // to the current time (an order whose estimate has passed becomes ready).
  @ApiOperation({ summary: 'Advance orders to Ready when their bake time has passed' })
  @Post('reconcile')
  async reconcile() {
    return this.reconcileOrders.execute();
  }

  @ApiOperation({ summary: 'Confirm payment and send order to the kitchen' })
  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.confirmPayment.execute(id, dto);
  }

  @ApiOperation({ summary: 'Track order status' })
  @Get(':id')
  async track(@Param('id') id: string) {
    return this.trackOrder.execute(id);
  }
}
