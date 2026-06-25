import { Category } from '../../shared/domain/category';

// Category lives in the shared domain; re-exported here for menu consumers.
export { Category };

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number; // integer cents
}
