import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';
import { UserRole } from '../entities/User';

// Extend Express Request type
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hankoAuthToken = req.headers['x-auth-token'];

    if (!hankoAuthToken) {
      throw new AppError(401, 'No token provided');
    }

    // The Hanko token contains user information in its payload
    // We can trust this token as it's already validated by Hanko's middleware
    const tokenPayload = JSON.parse(Buffer.from(hankoAuthToken.toString().split('.')[1], 'base64').toString());

    // Attach user info to request
    req.user = {
      id: tokenPayload.sub,
      email: tokenPayload.email?.address,
      role: tokenPayload.role || UserRole.TECHNICIAN, // Default to TECHNICIAN if role not specified
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action')
      );
    }

    next();
  };
}; 