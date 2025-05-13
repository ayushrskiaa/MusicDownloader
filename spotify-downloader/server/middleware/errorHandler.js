/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Default error status is 500
  const statusCode = err.statusCode || 500;
  
  // Format error message
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  };
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;