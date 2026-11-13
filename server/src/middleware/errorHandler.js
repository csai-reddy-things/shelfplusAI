import { ZodError } from 'zod';
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error(`❌ [API Error] ${req.method} ${req.originalUrl}:`, err);

  // Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Multer File Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum allowed size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload Error: ${err.message}`
    });
  }

  // Custom client-thrown errors with status codes
  if (err.status || err.statusCode) {
    return res.status(err.status || err.statusCode).json({
      success: false,
      error: err.message || 'An error occurred.'
    });
  }

  // Supabase / PostgreSQL Errors
  if (err.code && err.details) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.details
    });
  }

  // Fallback 500
  return res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}
