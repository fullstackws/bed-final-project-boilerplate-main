// loggingMiddleware.js
import logger from "../config/logger.js"; // Correct path based on your structure

// Middleware to log the request duration
export const logRequestDuration = (req, res, next) => {
  const start = Date.now(); // Record the start time

  // When the request finishes, log the duration
  res.on("finish", () => {
    const duration = Date.now() - start; // Calculate duration
    const { method, originalUrl } = req; // Get request method and URL
    const status = res.statusCode; // Get the response status code

    // Log the request information and duration
    logger.info(`${method} ${originalUrl} ${status} - ${duration}ms`);
  });

  next(); // Pass the request to the next middleware/handler
};
