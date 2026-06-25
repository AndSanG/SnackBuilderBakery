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

export class OrderNotFoundError extends Error {
  constructor(id: string) {
    super(`Order not found: ${id}`);
    this.name = 'OrderNotFoundError';
  }
}

export class OrderAlreadyConfirmedError extends Error {
  constructor(id: string) {
    super(`Order is not awaiting payment: ${id}`);
    this.name = 'OrderAlreadyConfirmedError';
  }
}
