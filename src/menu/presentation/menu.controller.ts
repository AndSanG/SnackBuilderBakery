import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ViewMenu } from '../application/view-menu';
import { AddMenuItem } from '../application/add-menu-item';
import { UpdateMenuItem } from '../application/update-menu-item';
import { RemoveMenuItem } from '../application/remove-menu-item';
import { MenuItem } from '../domain/menu-item';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

// Projects a domain entity into the API response shape, so entities never
// become the serialization contract.
const toResponse = (item: MenuItem) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  price: item.price,
});

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(
    private readonly viewMenu: ViewMenu,
    private readonly addMenuItem: AddMenuItem,
    private readonly updateMenuItem: UpdateMenuItem,
    private readonly removeMenuItem: RemoveMenuItem,
  ) {}

  @ApiOperation({ summary: 'List all menu items' })
  @Get()
  async list() {
    const items = await this.viewMenu.execute();
    return items.map(toResponse);
  }

  @ApiOperation({ summary: 'Add a menu item' })
  @Post()
  async create(@Body() dto: CreateMenuItemDto) {
    return toResponse(await this.addMenuItem.execute(dto));
  }

  @ApiOperation({ summary: 'Update a menu item' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return toResponse(await this.updateMenuItem.execute(id, dto));
  }

  @ApiOperation({ summary: 'Remove a menu item' })
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.removeMenuItem.execute(id);
  }
}
