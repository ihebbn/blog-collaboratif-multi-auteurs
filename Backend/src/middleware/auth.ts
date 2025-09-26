import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { id: string };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const payload = verifyAccessToken(token);
    
    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('_id email role isActive');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Add user info to request
    req.user = {
      ...payload,
      id: (user._id as any).toString()
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Role-specific middleware
export const requireAdmin = requireRole(['Admin']);
export const requireEditor = requireRole(['Admin', 'Editor']);
export const requireAuthor = requireRole(['Admin', 'Editor', 'Author']);
export const requireReader = requireRole(['Admin', 'Editor', 'Author', 'Reader']);

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId).select('_id email role isActive');
      
      if (user && user.isActive) {
        req.user = {
          ...payload,
          id: (user._id as any).toString()
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
