import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function seedAll() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not defined in .env');
    process.exit(1);
    return;
  }
  const dbName = process.env.DB_NAME || 'pizzahub';

  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log('Connected! Resetting existing collections for fresh demo data...');

  // 1. Users Collection
  const usersCollection = db.collection('users');
  const menuItemsCollection = db.collection('menuItems');
  const ordersCollection = db.collection('orders');
  const transactionsCollection = db.collection('transactions');

  await usersCollection.deleteMany({});
  await menuItemsCollection.deleteMany({});
  await ordersCollection.deleteMany({});
  await transactionsCollection.deleteMany({});

  // Insert Admin
  const adminId = new ObjectId();
  await usersCollection.insertOne({
    _id: adminId,
    name: 'PizzaHub Administrator',
    email: 'admin@pizzahub.com',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    role: 'admin',
    isBlocked: false,
    subscriptionPlan: 'free',
    password: 'Admin@123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Insert Vendors
  const vendor1Id = new ObjectId();
  await usersCollection.insertOne({
    _id: vendor1Id,
    name: 'Chef Marco Bellini',
    email: 'chef.marco@pizzahub.com',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80',
    role: 'vendor',
    isBlocked: false,
    businessName: 'Napoli Woodfire Kitchen',
    subscriptionPlan: 'premium',
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    password: 'Vendor@123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const vendor2Id = new ObjectId();
  await usersCollection.insertOne({
    _id: vendor2Id,
    name: 'Luigi Romano',
    email: 'luigi.crust@pizzahub.com',
    image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=300&q=80',
    role: 'vendor',
    isBlocked: false,
    businessName: "Luigi's Crust & Craft",
    subscriptionPlan: 'premium',
    subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    password: 'Vendor@123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const vendor3Id = new ObjectId();
  await usersCollection.insertOne({
    _id: vendor3Id,
    name: 'Bella Esposito',
    email: 'bella.roma@pizzahub.com',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    role: 'vendor',
    isBlocked: false,
    businessName: 'Bella Roma Gourmet',
    subscriptionPlan: 'free', // Free plan test
    password: 'Vendor@123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Insert Customers
  const customer1Id = new ObjectId();
  await usersCollection.insertOne({
    _id: customer1Id,
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@pizzahub.com',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    role: 'customer',
    isBlocked: false,
    subscriptionPlan: 'free',
    password: 'Customer@123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const customer2Id = new ObjectId();
  await usersCollection.insertOne({
    _id: customer2Id,
    name: 'Michael Chen',
    email: 'michael.chen@pizzahub.com',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    role: 'customer',
    isBlocked: false,
    subscriptionPlan: 'free',
    password: 'Customer@123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Seeded users: Admin, 3 Vendors (2 Premium, 1 Free), 2 Customers.');

  // 2. Menu Items (All 6 Categories represented)
  const itemsData = [
    // --- Classic Pizzas ---
    {
      vendorId: vendor1Id,
      itemName: 'Margherita Di Bufala',
      category: 'Classic Pizzas',
      description: 'Authentic Napoli pie with San Marzano tomato sauce, fresh buffalo mozzarella, aromatic sweet basil, and a drizzle of extra virgin olive oil.',
      price: 15.99,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'New York Pepperoni Classic',
      category: 'Classic Pizzas',
      description: 'Crispy seasoned thin crust loaded with hand-cut spicy pepperoni cups, whole milk aged mozzarella, and rich herb-infused tomato reduction.',
      price: 17.99,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor3Id,
      itemName: 'Quattro Formaggi Supreme',
      category: 'Classic Pizzas',
      description: 'A decadent four-cheese blend of fontina, gorgonzola dolce, aged parmigiano-reggiano, and creamy fior di latte mozzarella on white garlic sauce.',
      price: 18.5,
      location: 'Queens',
      images: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
      updatedAt: new Date(),
    },

    // --- Vegetarian Pizzas ---
    {
      vendorId: vendor1Id,
      itemName: 'Garden Fresh Primavera',
      category: 'Vegetarian Pizzas',
      description: 'Roasted bell peppers, caramelized sweet red onions, baby artichoke hearts, zucchini ribbons, and cherry tomatoes over fresh herb pesto.',
      price: 16.99,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'Truffle Mushroom Meltdown',
      category: 'Vegetarian Pizzas',
      description: 'Wild forest cremini, shiitake, and portobello mushrooms sautéed with fresh thyme and drizzled with white truffle oil over creamy taleggio.',
      price: 19.5,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor3Id,
      itemName: 'Mediterranean Feta & Kalamata',
      category: 'Vegetarian Pizzas',
      description: 'Greek kalamata olives, marinated sun-dried tomatoes, crumbled sheep milk feta, baby spinach, and wild oregano on extra-virgin olive oil crust.',
      price: 17.5,
      location: 'Queens',
      images: [
        'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
      updatedAt: new Date(),
    },

    // --- Meat Lovers ---
    {
      vendorId: vendor1Id,
      itemName: 'Ultimate Meat Feast Deluxe',
      category: 'Meat Lovers',
      description: 'Prime ground Angus beef, smoky applewood smoked bacon, Italian fennel sausage, cured pepperoni, and shaved ham with melty smoked gouda.',
      price: 21.99,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'Smoky BBQ Bacon & Beef',
      category: 'Meat Lovers',
      description: 'Hickory barbecue glaze topped with slow-braised pulled beef brisket, crispy bacon lardons, charred red onions, and sharp Wisconsin cheddar.',
      price: 19.99,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor3Id,
      itemName: 'Spicy Calabrian Salami Supreme',
      category: 'Meat Lovers',
      description: 'Artisanal Calabrian spicy soppressata, chili-cured sausage, pickled jalapeño coins, roasted garlic cloves, and hot red pepper flakes.',
      price: 18.99,
      location: 'Queens',
      images: [
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      updatedAt: new Date(),
    },

    // --- Specialty / Gourmet Pizzas ---
    {
      vendorId: vendor1Id,
      itemName: 'Prosciutto Di Parma & Baby Arugula',
      category: 'Specialty / Gourmet Pizzas',
      description: '24-month aged Prosciutto di Parma, peppery wild baby arugula tossed in lemon vinaigrette, shaved parmesan flakes, and aged balsamic reduction.',
      price: 23.99,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'Spicy Calabrian Hot Honey Pie',
      category: 'Specialty / Gourmet Pizzas',
      description: 'Crisp cupping pepperoni, fresh stracciatella cheese, fresh chili oil, and wildflower hot honey infused with red habanero peppers.',
      price: 20.99,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      updatedAt: new Date(),
    },

    // --- Sides & Appetizers ---
    {
      vendorId: vendor1Id,
      itemName: 'Crispy Garlic Herb Dough Knots',
      category: 'Sides & Appetizers',
      description: 'Hand-twisted sourdough knots tossed in whipped organic garlic butter, fresh Italian parsley, and grated pecorino. Served with marinara dip.',
      price: 6.99,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'Buffalo Glazed Chicken Wings (8pcs)',
      category: 'Sides & Appetizers',
      description: 'Jumbo crispy chicken wings smothered in homemade tangy cayenne pepper buffalo glaze, served with creamy blue cheese dip and celery sticks.',
      price: 11.99,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor3Id,
      itemName: 'Golden Truffle Parmesan Fries',
      category: 'Sides & Appetizers',
      description: 'Hand-cut russet potatoes fried to golden perfection, dusted with white truffle essence, sea salt, chopped rosemary, and finely grated parmesan.',
      price: 7.99,
      location: 'Queens',
      images: [
        'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      updatedAt: new Date(),
    },

    // --- Beverages & Desserts ---
    {
      vendorId: vendor1Id,
      itemName: 'Authentic Italian Espresso Tiramisu',
      category: 'Beverages & Desserts',
      description: 'Traditional ladyfingers soaked in dark Italian espresso and amaretto, layered with velvety mascarpone zabaglione and dusted with Valrhona cocoa.',
      price: 8.5,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'Warm Molten Choco Lava Cake',
      category: 'Beverages & Desserts',
      description: 'Rich bittersweet Belgian chocolate cake with a warm gooey molten chocolate fudge center, dusted with powdered sugar.',
      price: 7.99,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor3Id,
      itemName: 'San Pellegrino Sparkling Blood Orange',
      category: 'Beverages & Desserts',
      description: 'Naturally flavored premium sparkling Italian citrus soda crafted with sun-ripened Sicilian blood oranges (330ml can).',
      price: 3.99,
      location: 'Queens',
      images: [
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'approved',
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
      updatedAt: new Date(),
    },

    // --- Admin & Vendor Testing: Pending and Rejected items ---
    {
      vendorId: vendor1Id,
      itemName: 'Smoked Duck & Fig Artisan Flatbread',
      category: 'Specialty / Gourmet Pizzas',
      description: 'Tender smoked magret duck breast slices, black mission figs, goat cheese, and rosemary honey glaze. (Pending Admin approval)',
      price: 24.99,
      location: 'Downtown Manhattan',
      images: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'pending', // for testing Admin Approval workflow!
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor2Id,
      itemName: 'Rosemary Infused Garlic Focaccia',
      category: 'Sides & Appetizers',
      description: 'Thick focaccia bread baked with fresh rosemary, coarse sea salt, and cold-pressed olive oil. (Pending Admin review)',
      price: 6.5,
      location: 'Brooklyn Heights',
      images: [
        'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'pending', // for testing Admin Approval workflow!
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
      updatedAt: new Date(),
    },
    {
      vendorId: vendor3Id,
      itemName: 'Expired Anchovy Seafood Mix',
      category: 'Specialty / Gourmet Pizzas',
      description: 'Rejected item sample for testing vendor view. Does not meet hygiene standard.',
      price: 13.99,
      location: 'Queens',
      images: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'rejected', // for testing Vendor Rejected visibility!
      isFeatured: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      updatedAt: new Date(),
    },
  ];

  const insertedItems = await menuItemsCollection.insertMany(itemsData as any);
  console.log(`Seeded ${itemsData.length} menu items across all 6 categories.`);

  // 3. Sample Orders
  const firstItemId = insertedItems.insertedIds[0];
  const meatFeastId = insertedItems.insertedIds[6]; // Ultimate Meat Feast

  await ordersCollection.insertMany([
    {
      itemId: meatFeastId,
      vendorId: vendor1Id,
      customerId: customer1Id,
      deliveryDate: '2026-11-25',
      deliveryAddress: '123 Broadway, Apt 4B, New York, NY 10006',
      message: 'Please ring doorbell upon delivery, thank you!',
      status: 'pending',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      updatedAt: new Date(),
    },
    {
      itemId: firstItemId,
      vendorId: vendor1Id,
      customerId: customer2Id,
      deliveryDate: '2026-11-23',
      deliveryAddress: '456 Grand St, Brooklyn, NY 11211',
      message: 'Leave at front porch.',
      status: 'accepted',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      updatedAt: new Date(),
    },
    {
      itemId: insertedItems.insertedIds[1],
      vendorId: vendor2Id,
      customerId: customer1Id,
      deliveryDate: '2026-11-20',
      deliveryAddress: '123 Broadway, Apt 4B, New York, NY 10006',
      status: 'cancelled',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(),
    },
  ]);
  console.log('Seeded sample orders (pending, accepted, cancelled).');

  // 4. Sample Transactions (Stripe Subscription Logs)
  await transactionsCollection.insertMany([
    {
      vendorId: vendor1Id,
      plan: 'premium',
      amount: 19.99,
      currency: 'USD',
      stripeSessionId: 'cs_test_sample_session_napoli_woodfire',
      stripeSubscriptionId: 'sub_test_123456789',
      status: 'completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      vendorId: vendor2Id,
      plan: 'premium',
      amount: 19.99,
      currency: 'USD',
      stripeSessionId: 'cs_test_sample_session_luigi_crust',
      stripeSubscriptionId: 'sub_test_987654321',
      status: 'completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  ]);
  console.log('Seeded verified subscription transactions for Admin ledger.');

  await client.close();
  console.log('🎉 Seeding completed successfully!');
}

if (require.main === module) {
  seedAll().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
