export enum Category {
  Cookie = 'Cookie',
  Pastry = 'Pastry',
  Bread = 'Bread',
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number; // integer cents
}
