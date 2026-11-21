import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { verifyUserToken } from '../lib/auth';
import { collections } from '../config/db';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token missing or invalid format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyUserToken(token);

  if (!payload || !payload.id) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });
    return;
  }

  try {
    // Fresh DB lookup to ensure user exists and is not blocked
    const user = await collections.users.findOne({ _id: new ObjectId(payload.id) });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User account not found',
      });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Your account has been suspended by an administrator',
      });
      return;
    }

    // Attach fresh sanitized payload to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      isBlocked: user.isBlocked,
      subscriptionPlan: user.subscriptionPlan,
      businessName: user.businessName,
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication check failed due to an internal error',
    });
  }
}
