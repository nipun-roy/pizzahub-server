import { Router } from 'express';
import {
  getPublicMenuItems,
  getFeaturedMenuItems,
  getMenuItemById,
  createMenuItem,
  getVendorMenuItems,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menu.controller';
import { requireAuth } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';

const router = Router();

// Public Routes
router.get('/', getPublicMenuItems);
router.get('/featured', getFeaturedMenuItems);
router.get('/:id', getMenuItemById);

// Vendor Protected Routes
router.post('/', requireAuth, authorizeRoles('vendor'), createMenuItem);
router.get('/vendor/my-items', requireAuth, authorizeRoles('vendor'), getVendorMenuItems);
router.patch('/:id', requireAuth, authorizeRoles('vendor'), updateMenuItem);
router.delete('/:id', requireAuth, authorizeRoles('vendor'), deleteMenuItem);

export default router;
