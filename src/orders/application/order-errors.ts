export class EmptyOrderError extends Error {
  constructor() {
    super('An order must contain at least one item');
    this.name = 'EmptyOrderError';
  }
}

export class UnknownMenuItemError extends Error {
  constructor(id: string) {
    super(`Menu item not found: ${id}`);
    this.name = 'UnknownMenuItemError';
  }
}
