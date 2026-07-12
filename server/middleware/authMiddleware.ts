import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'transitops-secret-key-1092';

export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user to request, omit password
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      return next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }
    next();
  };
}
