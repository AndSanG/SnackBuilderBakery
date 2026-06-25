import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlaceOrder } from '../application/place-order';
import { TrackOrder } from '../application/track-order';
import { PlaceOrderDto } from './dto/place-order.dto';

// The use cases already return view-shaped results (Ticket, OrderStatusView),
// so the controller has no entity to map: it just delegates.
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly placeOrder: PlaceOrder,
    private readonly trackOrder: TrackOrder,
  ) {}

  @Post()
  async place(@Body() dto: PlaceOrderDto) {
    return this.placeOrder.execute(dto);
  }

  @Get(':id')
  async track(@Param('id') id: string) {
    return this.trackOrder.execute(id);
  }
}
