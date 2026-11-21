import { MongoClient, Db, Collection } from 'mongodb';
import { config } from './env';
import { User, MenuItem, Order, Transaction } from '../models/types';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(config.mongoUri);
    await client.connect();
    db = client.db(config.dbName);
    console.log(`[MongoDB] Connected successfully to database: ${config.dbName}`);

    // Ensure collections and necessary indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('menuItems').createIndex({ vendorId: 1 });
    await db.collection('menuItems').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ customerId: 1 });
    await db.collection('orders').createIndex({ vendorId: 1 });
    await db.collection('transactions').createIndex({ vendorId: 1 });

    return db;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export function getCollection<T extends object>(name: string): Collection<T> {
  return getDB().collection<T>(name);
}

export const collections = {
  get users(): Collection<User> {
    return getCollection<User>('users');
  },
  get menuItems(): Collection<MenuItem> {
    return getCollection<MenuItem>('menuItems');
  },
  get orders(): Collection<Order> {
    return getCollection<Order>('orders');
  },
  get transactions(): Collection<Transaction> {
    return getCollection<Transaction>('transactions');
  },
};
