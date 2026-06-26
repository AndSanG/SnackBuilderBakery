import { Controller, Get } from '@nestjs/common';
import { MonitorKitchen } from '../application/monitor-kitchen';

// Read-only monitoring endpoint for the kitchen manager. The use case already
// returns a view-shaped result, so the controller just delegates.
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly monitorKitchen: MonitorKitchen) {}

  @Get()
  view() {
    return this.monitorKitchen.execute();
  }
}
