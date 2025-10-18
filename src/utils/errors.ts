export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  /**
   * Creates a new application error with HTTP status code
   * @param message - Error message
   * @param statusCode - HTTP status code (400, 404, 500, etc.)
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
