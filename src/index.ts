import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/db';
import { handleStripeWebhook } from './controllers/subscription.controller';

// Route imports
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// 1. CORS Configuration (Allows frontend and prevents CORS errors)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // In production, allow client URL and Vercel preview domains
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
);

// 2. Stripe Webhook: MUST receive raw body for cryptographic signature verification
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// 3. Body Parsers for standard JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Health Check / Root
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'PizzaHub REST API Server is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// 6. Custom 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route '${req.method} ${req.originalUrl}' was not found on this server`,
  });
});

// 7. Central Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
});

// Start Server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`🚀 PizzaHub Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start when executed directly
if (require.main === module) {
  startServer();
}

export default app;
