import { ObjectId } from 'mongodb';
import { connectDB, collections } from '../config/db';
import { User } from '../models/types';

async function seedAdmin() {
  await connectDB();

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@pizzahub.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';

  const existing = await collections.users.findOne({ email: adminEmail });
  if (existing) {
    console.log(`Admin account (${adminEmail}) already exists.`);
    process.exit(0);
  }

  const adminUser: User = {
    _id: new ObjectId(),
    name: 'PizzaHub Administrator',
    email: adminEmail,
    role: 'admin',
    isBlocked: false,
    subscriptionPlan: 'premium',
    password: adminPassword,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await collections.users.insertOne(adminUser);
  console.log(`[Success] Seeded Initial Admin:`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
