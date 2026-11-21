import { ObjectId } from 'mongodb';

export type UserRole = 'customer' | 'vendor' | 'admin';
export type SubscriptionPlan = 'free' | 'premium';

export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  isBlocked: boolean;
  businessName?: string; // vendor only
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date;
  password?: string; // for direct credential auth
  createdAt: Date;
  updatedAt: Date;
}

export type MenuCategory =
  | 'Classic Pizzas'
  | 'Vegetarian Pizzas'
  | 'Meat Lovers'
  | 'Specialty / Gourmet Pizzas'
  | 'Sides & Appetizers'
  | 'Beverages & Desserts';

export type MenuItemStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface MenuItem {
  _id: ObjectId;
  vendorId: ObjectId; // ref: users
  itemName: string;
  category: MenuCategory;
  description: string;
  price: number;
  location: string; // area / city
  images: string[];
  status: MenuItemStatus;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Order {
  _id: ObjectId;
  itemId: ObjectId; // ref: menuItems
  vendorId: ObjectId; // ref: users
  customerId: ObjectId; // ref: users
  deliveryDate: string; // YYYY-MM-DD
  deliveryAddress: string;
  message?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionStatus = 'completed' | 'failed' | 'pending';

export interface Transaction {
  _id: ObjectId;
  vendorId: ObjectId; // ref: users
  plan: 'premium';
  amount: number;
  currency: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  status: TransactionStatus;
  createdAt: Date;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isBlocked: boolean;
  subscriptionPlan?: SubscriptionPlan;
  businessName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
