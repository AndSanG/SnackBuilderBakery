import { Controller, Get } from '@nestjs/common';

@Controller('version')
export class VersionController {
  @Get()
  version(): { version: string } {
    return { version: process.env.APP_VERSION ?? 'dev' };
  }
}
