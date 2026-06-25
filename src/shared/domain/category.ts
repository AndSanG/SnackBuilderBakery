export enum Category {
  Cookie = 'Cookie',
  Pastry = 'Pastry',
  Bread = 'Bread',
}

// Bake time per category, in minutes. The core kitchen rule, kept in the shared
// domain because the menu, orders, and kitchen all depend on it.
export const bakeDurationMinutes: Record<Category, number> = {
  [Category.Cookie]: 5,
  [Category.Pastry]: 10,
  [Category.Bread]: 20,
};
