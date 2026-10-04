/**
 * Custom Operational Error class for API responses.
 * Sets statusCode property consumed by the centralized errorHandler middleware.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
