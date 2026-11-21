import { Router } from 'express';
import {
  createOrder,
  getCustomerOrders,
  cancelCustomerOrder,
  getVendorOrders,
  updateOrderStatus,
} from '../controllers/order.controller';
import { requireAuth } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';

const router = Router();

// Customer Routes
router.post('/', requireAuth, authorizeRoles('customer', 'vendor'), createOrder);
router.get('/customer', requireAuth, authorizeRoles('customer', 'vendor'), getCustomerOrders);
router.patch('/:id/cancel', requireAuth, authorizeRoles('customer', 'vendor'), cancelCustomerOrder);

// Vendor Routes
router.get('/vendor', requireAuth, authorizeRoles('vendor'), getVendorOrders);
router.patch('/:id/status', requireAuth, authorizeRoles('vendor'), updateOrderStatus);

export default router;
