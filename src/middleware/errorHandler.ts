import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      errors: error.errors
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}; 