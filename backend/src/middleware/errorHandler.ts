import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0],
    });
  }

  return res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
