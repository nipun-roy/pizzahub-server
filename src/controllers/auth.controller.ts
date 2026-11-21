import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/db';
import { User, UserRole } from '../models/types';
import { signUserToken } from '../lib/auth';

// Helper to validate password rules
function validatePassword(password: string): boolean {
  if (!password || password.length < 6) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  return hasUpper && hasLower;
}

// Public: Sign Up
export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, image, role, businessName } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
      return;
    }

    // Role check: Only customer or vendor allowed through public registration
    if (!['customer', 'vendor'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Public registration only allows Customer or Vendor accounts.',
      });
      return;
    }

    // Password validation rule: min 6 chars, 1 uppercase, 1 lowercase
    if (!validatePassword(password)) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long and contain at least one uppercase and one lowercase letter.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await collections.users.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const newUser: User = {
      _id: new ObjectId(),
      name: name.trim(),
      email: normalizedEmail,
      image: image || '',
      role: role as UserRole,
      isBlocked: false,
      businessName: role === 'vendor' ? (businessName || `${name.trim()}'s Pizza`) : undefined,
      subscriptionPlan: 'free',
      password, // In real-world hashed, or managed by Better Auth
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collections.users.insertOne(newUser);

    const token = signUserToken({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isBlocked: false,
      subscriptionPlan: newUser.subscriptionPlan,
      businessName: newUser.businessName,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
        role: newUser.role,
        subscriptionPlan: newUser.subscriptionPlan,
        businessName: newUser.businessName,
      },
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ success: false, message: 'Registration failed due to a server error' });
  }
}

// Public: Sign In
export async function signIn(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await collections.users.findOne({ email: normalizedEmail });

    if (!user || user.password !== password) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
      return;
    }

    const token = signUserToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isBlocked: user.isBlocked,
      subscriptionPlan: user.subscriptionPlan,
      businessName: user.businessName,
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ success: false, message: 'Login failed due to a server error' });
  }
}

// Google OAuth Sync / Exchange
export async function googleAuthSync(req: Request, res: Response): Promise<void> {
  try {
    let { email, name, image, role = 'customer', credential } = req.body;

    // If Google ID token credential is provided, decode payload
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          email = payload.email || email;
          name = payload.name || name;
          image = payload.picture || image;
        }
      } catch (decodeErr) {
        console.warn('Failed to decode Google credential token:', decodeErr);
      }
    }

    if (!email) {
      res.status(400).json({ success: false, message: 'Google account email is required' });
      return;
    }

    const finalName = name || email.split('@')[0];
    const normalizedEmail = email.toLowerCase().trim();
    let user = await collections.users.findOne({ email: normalizedEmail });

    if (!user) {
      const newUser: User = {
        _id: new ObjectId(),
        name: finalName.trim(),
        email: normalizedEmail,
        image: image || '',
        role: role === 'vendor' ? 'vendor' : 'customer',
        isBlocked: false,
        businessName: role === 'vendor' ? `${finalName.trim()}'s Pizzeria` : undefined,
        subscriptionPlan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await collections.users.insertOne(newUser);
      user = newUser;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator.',
      });
      return;
    }

    const token = signUserToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isBlocked: user.isBlocked,
      subscriptionPlan: user.subscriptionPlan,
      businessName: user.businessName,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Google authentication sync failed' });
  }
}

// Protected: Get Current Logged-in User Profile
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await collections.users.findOne(
      { _id: new ObjectId(req.user!.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
}

// Protected: Update Profile Details
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = new ObjectId(req.user!.id);
    const { name, image, businessName } = req.body;

    const updateFields: any = { updatedAt: new Date() };
    if (name) updateFields.name = name.trim();
    if (image !== undefined) updateFields.image = image;
    if (businessName && req.user!.role === 'vendor') {
      updateFields.businessName = businessName.trim();
    }

    // Role and subscriptionPlan are strictly ignored to prevent privilege escalation!
    await collections.users.updateOne({ _id: userId }, { $set: updateFields });

    const updatedUser = await collections.users.findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}
