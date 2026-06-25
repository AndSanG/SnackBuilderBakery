import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [SharedModule, MenuModule],
})
export class AppModule {}
