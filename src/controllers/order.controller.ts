import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/db';
import { Order, OrderStatus } from '../models/types';

// Customer: Place a new pizza order
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const customerId = new ObjectId(req.user!.id);
    const userRole = req.user!.role;

    if (userRole === 'admin') {
      res.status(403).json({ success: false, message: 'Admins cannot place customer food orders' });
      return;
    }

    const { itemId, deliveryDate, deliveryAddress, message } = req.body;

    if (!itemId || !deliveryDate || !deliveryAddress) {
      res.status(400).json({ success: false, message: 'Item ID, delivery date, and delivery address are required' });
      return;
    }

    if (!ObjectId.isValid(itemId)) {
      res.status(400).json({ success: false, message: 'Invalid item ID' });
      return;
    }

    const item = await collections.menuItems.findOne({ _id: new ObjectId(itemId) });
    if (!item) {
      res.status(404).json({ success: false, message: 'Selected menu item does not exist' });
      return;
    }

    // Only approved and active items can be ordered
    if (item.status !== 'approved') {
      res.status(400).json({ success: false, message: 'Only active and approved menu items can be ordered' });
      return;
    }

    // Rule: Prevent vendor from ordering their own item
    if (item.vendorId.toString() === customerId.toString()) {
      res.status(403).json({ success: false, message: 'You cannot place an order for your own menu item' });
      return;
    }

    // Rule: Prevent duplicate active order for same item and delivery date by same customer
    const existingOrder = await collections.orders.findOne({
      customerId,
      itemId: item._id,
      deliveryDate: deliveryDate.trim(),
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingOrder) {
      res.status(409).json({
        success: false,
        message: 'You already have an active order for this item on the selected delivery date',
      });
      return;
    }

    const newOrder: Order = {
      _id: new ObjectId(),
      itemId: item._id,
      vendorId: item.vendorId,
      customerId,
      deliveryDate: deliveryDate.trim(),
      deliveryAddress: deliveryAddress.trim(),
      message: message ? message.trim() : '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collections.orders.insertOne(newOrder);

    res.status(201).json({
      success: true,
      message: 'Pizza order submitted successfully! The restaurant will review your order.',
      data: newOrder,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
}

// Customer: Get my order history
export async function getCustomerOrders(req: Request, res: Response): Promise<void> {
  try {
    const customerId = new ObjectId(req.user!.id);
    const orders = await collections.orders.find({ customerId }).sort({ createdAt: -1 }).toArray();

    // Populate item details and vendor details
    const itemIds = Array.from(new Set(orders.map((o) => o.itemId)));
    const vendorIds = Array.from(new Set(orders.map((o) => o.vendorId)));

    const [items, vendors] = await Promise.all([
      collections.menuItems.find({ _id: { $in: itemIds } }).toArray(),
      collections.users.find({ _id: { $in: vendorIds } }, { projection: { name: 1, businessName: 1, email: 1 } }).toArray(),
    ]);

    const itemMap = new Map(items.map((i) => [i._id.toString(), i]));
    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));

    const populated = orders.map((order) => ({
      ...order,
      item: itemMap.get(order.itemId.toString()) || null,
      vendor: vendorMap.get(order.vendorId.toString()) || null,
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customer orders' });
  }
}

// Customer: Cancel pending order
export async function cancelCustomerOrder(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const customerId = new ObjectId(req.user!.id);

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID' });
      return;
    }

    const order = await collections.orders.findOne({ _id: new ObjectId(id) });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.customerId.toString() !== customerId.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot cancel another customer\'s order' });
      return;
    }

    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.status}'. Only pending orders can be cancelled.`,
      });
      return;
    }

    await collections.orders.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Order has been successfully cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
}

// Vendor: Get incoming customer orders
export async function getVendorOrders(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = new ObjectId(req.user!.id);
    const orders = await collections.orders.find({ vendorId }).sort({ createdAt: -1 }).toArray();

    const itemIds = Array.from(new Set(orders.map((o) => o.itemId)));
    const customerIds = Array.from(new Set(orders.map((o) => o.customerId)));

    const [items, customers] = await Promise.all([
      collections.menuItems.find({ _id: { $in: itemIds } }).toArray(),
      collections.users.find({ _id: { $in: customerIds } }, { projection: { name: 1, email: 1, image: 1 } }).toArray(),
    ]);

    const itemMap = new Map(items.map((i) => [i._id.toString(), i]));
    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));

    const populated = orders.map((order) => ({
      ...order,
      item: itemMap.get(order.itemId.toString()) || null,
      customer: customerMap.get(order.customerId.toString()) || null,
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor orders' });
  }
}

// Vendor: Update Order Status (Accept or Reject)
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body as { status: OrderStatus };
    const vendorId = new ObjectId(req.user!.id);

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid order ID' });
      return;
    }

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be either accepted or rejected' });
      return;
    }

    const order = await collections.orders.findOne({ _id: new ObjectId(id) });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.vendorId.toString() !== vendorId.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot modify orders of another vendor' });
      return;
    }

    // Only pending orders can be accepted or rejected, and only once
    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Order is already '${order.status}'. Only pending orders can be accepted or rejected.`,
      });
      return;
    }

    await collections.orders.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `Order #${id.slice(-6)} has been ${status}`,
      status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
}
