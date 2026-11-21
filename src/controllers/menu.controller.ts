import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/db';
import { MenuItem, MenuCategory, MenuItemStatus } from '../models/types';

// Public: Get all approved menu items with search, filter, and sort (Challenge 1)
export async function getPublicMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { search, category, location, sort, page = '1', limit = '12' } = req.query;

    const query: any = { status: 'approved' };

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.itemName = { $regex: search.trim(), $options: 'i' };
    }

    if (category && typeof category === 'string' && category !== 'All') {
      query.category = category;
    }

    if (location && typeof location === 'string' && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const total = await collections.menuItems.countDocuments(query);
    const items = await collections.menuItems
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Populate vendor info
    const vendorIds = Array.from(new Set(items.map((i) => i.vendorId)));
    const vendors = await collections.users
      .find({ _id: { $in: vendorIds } }, { projection: { name: 1, businessName: 1, email: 1, subscriptionPlan: 1 } })
      .toArray();
    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));

    const populatedItems = items.map((item) => ({
      ...item,
      vendor: vendorMap.get(item.vendorId.toString()) || null,
    }));

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: populatedItems,
    });
  } catch (error) {
    console.error('Error fetching public menu items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
}

// Public: Get Featured Menu Items for Homepage (at least 6)
export async function getFeaturedMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const items = await collections.menuItems
      .find({ status: 'approved' })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(8)
      .toArray();

    const vendorIds = Array.from(new Set(items.map((i) => i.vendorId)));
    const vendors = await collections.users
      .find({ _id: { $in: vendorIds } }, { projection: { name: 1, businessName: 1, subscriptionPlan: 1 } })
      .toArray();
    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));

    const populated = items.map((item) => ({
      ...item,
      vendor: vendorMap.get(item.vendorId.toString()) || null,
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured items' });
  }
}

// Public: Get Single Item Details
export async function getMenuItemById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID format' });
      return;
    }

    const item = await collections.menuItems.findOne({ _id: new ObjectId(id) });
    if (!item) {
      res.status(404).json({ success: false, message: 'Menu item not found' });
      return;
    }

    // Only approved items are publicly visible, unless user is the vendor or admin
    if (item.status !== 'approved') {
      const isVendor = req.user && req.user.id === item.vendorId.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isVendor && !isAdmin) {
        res.status(404).json({ success: false, message: 'Menu item is not currently active or approved' });
        return;
      }
    }

    const vendor = await collections.users.findOne(
      { _id: item.vendorId },
      { projection: { name: 1, businessName: 1, email: 1, subscriptionPlan: 1 } }
    );

    res.json({
      success: true,
      data: {
        ...item,
        vendor: vendor || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve menu item details' });
  }
}

// Vendor: Add New Menu Item (with Free Plan <= 3 items check)
export async function createMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = new ObjectId(req.user!.id);
    const { itemName, category, description, price, location, images } = req.body;

    if (!itemName || !category || !description || price === undefined || !location || !images || images.length === 0) {
      res.status(400).json({ success: false, message: 'All required fields including at least one image must be provided' });
      return;
    }

    // Check Vendor Subscription Plan and active items limit
    const vendor = await collections.users.findOne({ _id: vendorId });
    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor account not found' });
      return;
    }

    const isPremium = vendor.subscriptionPlan === 'premium';
    if (!isPremium) {
      const activeCount = await collections.menuItems.countDocuments({
        vendorId,
        status: { $in: ['approved', 'pending'] },
      });

      if (activeCount >= 3) {
        res.status(403).json({
          success: false,
          message: 'Free tier limit reached! Free vendors can have at most 3 active items. Please upgrade to Premium for unlimited items.',
          limitReached: true,
        });
        return;
      }
    }

    const newItem: MenuItem = {
      _id: new ObjectId(),
      vendorId,
      itemName: itemName.trim(),
      category: category as MenuCategory,
      description: description.trim(),
      price: Number(price),
      location: location.trim(),
      images: Array.isArray(images) ? images : [images],
      status: 'pending', // Default pending until Admin review
      isFeatured: isPremium,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collections.menuItems.insertOne(newItem);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully and submitted for admin approval',
      data: newItem,
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ success: false, message: 'Failed to create menu item' });
  }
}

// Vendor: Get All My Menu Items
export async function getVendorMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = new ObjectId(req.user!.id);
    const items = await collections.menuItems.find({ vendorId }).sort({ createdAt: -1 }).toArray();

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor menu items' });
  }
}

// Vendor: Update My Menu Item
export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = new ObjectId(req.user!.id);

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const existing = await collections.menuItems.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Menu item not found' });
      return;
    }

    if (existing.vendorId.toString() !== vendorId.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden: You do not own this menu item' });
      return;
    }

    const { itemName, category, description, price, location, images, status } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (itemName) updateData.itemName = itemName.trim();
    if (category) updateData.category = category;
    if (description) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (location) updateData.location = location.trim();
    if (images) updateData.images = Array.isArray(images) ? images : [images];
    
    // Vendor can toggle active/inactive if already approved
    if (status && ['inactive', 'approved'].includes(status) && existing.status !== 'rejected') {
      updateData.status = status;
    }

    await collections.menuItems.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    res.json({ success: true, message: 'Menu item updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
}

// Vendor: Delete My Menu Item
export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = new ObjectId(req.user!.id);

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const existing = await collections.menuItems.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Menu item not found' });
      return;
    }

    if (existing.vendorId.toString() !== vendorId.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot delete another vendor\'s menu item' });
      return;
    }

    await collections.menuItems.deleteOne({ _id: new ObjectId(id) });

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
}
