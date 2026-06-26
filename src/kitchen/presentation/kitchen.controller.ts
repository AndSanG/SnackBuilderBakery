import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MonitorKitchen } from '../application/monitor-kitchen';

// Read-only monitoring endpoint for the kitchen manager. The use case already
// returns a view-shaped result, so the controller just delegates.
@ApiTags('kitchen')
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly monitorKitchen: MonitorKitchen) {}

  @ApiOperation({ summary: 'Monitor oven slots and waiting queue' })
  @Get()
  view() {
    return this.monitorKitchen.execute();
  }
}
