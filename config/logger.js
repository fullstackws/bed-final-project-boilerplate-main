// logger.js
import winston from "winston";

// Create a custom logger
const logger = winston.createLogger({
  level: "info", // Log all levels of info and above
  format: winston.format.combine(
    winston.format.colorize(), // Colorize the logs in the console
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(), // Logs to the console
    // You can also add file logging here if needed
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;
