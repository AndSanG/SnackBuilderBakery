export class MenuItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Menu item not found: ${id}`);
    this.name = 'MenuItemNotFoundError';
  }
}
