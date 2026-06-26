import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from '../shared/prisma/prisma.module';
import { MenuController } from './presentation/menu.controller';
import { ViewMenu } from './application/view-menu';
import { AddMenuItem } from './application/add-menu-item';
import { UpdateMenuItem } from './application/update-menu-item';
import { RemoveMenuItem } from './application/remove-menu-item';
import { MenuRepository } from './application/menu-repository';
import { InMemoryMenuRepository } from './infrastructure/in-memory-menu-repository';
import { PrismaMenuRepository } from './infrastructure/prisma-menu-repository';

export const MENU_REPOSITORY = Symbol('MenuRepository');

// Use cases are framework-free, so they are wired with factory providers
// rather than decorated for the container.
@Module({
  controllers: [MenuController],
  providers: [
    {
      // ponytail: env-based switch; DATABASE_URL absent means in-memory (unit tests stay fast)
      provide: MENU_REPOSITORY,
      useFactory: (prisma: PrismaClient | null): MenuRepository =>
        prisma ? new PrismaMenuRepository(prisma) : new InMemoryMenuRepository(),
      inject: [PRISMA_CLIENT],
    },
    {
      provide: ViewMenu,
      useFactory: (repo: MenuRepository) => new ViewMenu(repo),
      inject: [MENU_REPOSITORY],
    },
    {
      provide: AddMenuItem,
      useFactory: (repo: MenuRepository) => new AddMenuItem(repo),
      inject: [MENU_REPOSITORY],
    },
    {
      provide: UpdateMenuItem,
      useFactory: (repo: MenuRepository) => new UpdateMenuItem(repo),
      inject: [MENU_REPOSITORY],
    },
    {
      provide: RemoveMenuItem,
      useFactory: (repo: MenuRepository) => new RemoveMenuItem(repo),
      inject: [MENU_REPOSITORY],
    },
  ],
  exports: [MENU_REPOSITORY],
})
export class MenuModule {}
