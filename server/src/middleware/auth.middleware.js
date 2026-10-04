import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';

/**
 * Authentication Middleware.
 * Verifies Bearer JWT token from Authorization header and attaches identity (id, role) to req.user.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token required', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Authentication token required', 401));
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production_12345';
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId || !decoded.role) {
      return next(new AppError('Invalid token payload', 401));
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};

/**
 * Authorization Middleware.
 * Checks whether authenticated req.user role is present in allowedRoles array.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Role '${req.user.role}' is not authorized to perform this operation`,
          403
        )
      );
    }

    next();
  };
};
