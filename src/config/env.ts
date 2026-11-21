import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pizzahub',
  dbName: process.env.DB_NAME || 'pizzahub',
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || 'super_secret_better_auth_key_123456789',
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_987654321',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};
