import { MenuItem } from '../domain/menu-item';
import { MenuRepository } from './menu-repository';

export class ViewMenu {
  constructor(private readonly repository: MenuRepository) {}

  execute(): Promise<MenuItem[]> {
    return this.repository.getAll();
  }
}
