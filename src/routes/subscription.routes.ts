import { Router } from 'express';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  confirmSandboxPayment,
} from '../controllers/subscription.controller';
import { requireAuth } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';

const router = Router();

// Vendor Protected Routes
router.post('/create-checkout-session', requireAuth, authorizeRoles('vendor'), createCheckoutSession);
router.post('/confirm-sandbox-payment', requireAuth, authorizeRoles('vendor'), confirmSandboxPayment);
router.get('/status', requireAuth, authorizeRoles('vendor'), getSubscriptionStatus);

export default router;
