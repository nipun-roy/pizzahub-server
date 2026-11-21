import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/db';
import { MenuItemStatus } from '../models/types';

// Admin: Overview platform statistics
export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      totalVendors,
      totalCustomers,
      totalMenuItems,
      pendingMenuItems,
      approvedMenuItems,
      transactions,
    ] = await Promise.all([
      collections.users.countDocuments({}),
      collections.users.countDocuments({ role: 'vendor' }),
      collections.users.countDocuments({ role: 'customer' }),
      collections.menuItems.countDocuments({}),
      collections.menuItems.countDocuments({ status: 'pending' }),
      collections.menuItems.countDocuments({ status: 'approved' }),
      collections.transactions.find({ status: 'completed' }).toArray(),
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        totalCustomers,
        totalMenuItems,
        pendingMenuItems,
        approvedMenuItems,
        totalTransactions: transactions.length,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
}

// Admin: List all users with search and role filter
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const { search, role } = req.query;
    const query: any = {};

    if (role && ['vendor', 'customer', 'admin'].includes(role as string)) {
      query.role = role;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const users = await collections.users
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user list' });
  }
}

// Admin: Block / Unblock user
export async function toggleBlockUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    if (id === adminId) {
      res.status(400).json({ success: false, message: 'Admins cannot block their own account' });
      return;
    }

    const targetUser = await collections.users.findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser.role === 'admin') {
      res.status(403).json({ success: false, message: 'Cannot modify status of another admin' });
      return;
    }

    const newBlockedState = !targetUser.isBlocked;
    await collections.users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isBlocked: newBlockedState, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `User ${targetUser.name} has been ${newBlockedState ? 'blocked' : 'unblocked'}`,
      isBlocked: newBlockedState,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user block state' });
  }
}

// Admin: Manage Menu Items (View, search, filter)
export async function getAdminMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.itemName = { $regex: search.trim(), $options: 'i' };
    }

    const items = await collections.menuItems.find(query).sort({ createdAt: -1 }).toArray();

    const vendorIds = Array.from(new Set(items.map((i) => i.vendorId)));
    const vendors = await collections.users
      .find({ _id: { $in: vendorIds } }, { projection: { name: 1, businessName: 1, email: 1 } })
      .toArray();

    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));
    const populated = items.map((item) => ({
      ...item,
      vendor: vendorMap.get(item.vendorId.toString()) || null,
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu items for administration' });
  }
}

// Admin: Approve or Reject Menu Item
export async function updateMenuItemStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: MenuItemStatus };

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    if (!['approved', 'rejected', 'inactive'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status update request' });
      return;
    }

    const item = await collections.menuItems.findOne({ _id: new ObjectId(id) });
    if (!item) {
      res.status(404).json({ success: false, message: 'Menu item not found' });
      return;
    }

    await collections.menuItems.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `Menu item '${item.itemName}' status updated to ${status}`,
      status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update item status' });
  }
}

// Admin: Delete inappropriate menu item
export async function deleteMenuItemAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const result = await collections.menuItems.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Menu item not found' });
      return;
    }

    res.json({ success: true, message: 'Menu item successfully deleted by admin' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
}

// Admin: View platform transactions (Strictly Read-Only!)
export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const transactions = await collections.transactions.find({}).sort({ createdAt: -1 }).toArray();

    const vendorIds = Array.from(new Set(transactions.map((t) => t.vendorId)));
    const vendors = await collections.users
      .find({ _id: { $in: vendorIds } }, { projection: { name: 1, email: 1, businessName: 1 } })
      .toArray();

    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));
    const populated = transactions.map((t) => ({
      ...t,
      vendor: vendorMap.get(t.vendorId.toString()) || null,
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
}
