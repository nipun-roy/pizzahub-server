import { Router } from 'express';
import {
  getAdminStats,
  getUsers,
  toggleBlockUser,
  getAdminMenuItems,
  updateMenuItemStatus,
  deleteMenuItemAdmin,
  getTransactions,
} from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/role';

const router = Router();

// All routes require Admin role
router.use(requireAuth, authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/block', toggleBlockUser);
router.get('/menu-items', getAdminMenuItems);
router.patch('/menu-items/:id/status', updateMenuItemStatus);
router.delete('/menu-items/:id', deleteMenuItemAdmin);
router.get('/transactions', getTransactions); // Read-only

export default router;
