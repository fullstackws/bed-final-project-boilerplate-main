import express from "express";
import dotenv from "dotenv";
import loginRoute from "../routes/login.js";
import usersRoute from "../routes/users.js";
import hostsRoute from "../routes/hosts.js";
import propertiesRoute from "../routes/properties.js";
import amenitiesRoute from "../routes/amenities.js";
import bookingsRoute from "../routes/bookings.js";
import reviewsRoute from "../routes/reviews.js";
import { logRequestDuration } from "../middleware/loggingMiddleWare.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import logger from "../config/logger.js"; // Ensure the path is correct

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

// Security and rate-limiting middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors()); // Allows cross-origin requests
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per windowMs
//   })
// );

// Logging middleware to log request durations and details
app.use(logRequestDuration);

app.use(express.json()); // Parse incoming JSON requests

// Use the routes
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/hosts", hostsRoute);
app.use("/properties", propertiesRoute);
app.use("/amenities", amenitiesRoute);
app.use("/bookings", bookingsRoute);
app.use("/reviews", reviewsRoute);

// Error handling middleware (catch-all)
app.use((err, req, res, next) => {
  // Log the error using Winston
  logger.error(`Error occurred: ${err.message}`);

  // Handle different error types
  if (err.status === 404) {
    return res.status(404).json({ message: "Resource not found" });
  }

  if (err.status === 400) {
    return res.status(400).json({ message: "Bad request" });
  }

  // Default 500 Internal Server Error response for other errors
  return res.status(500).json({
    message:
      "An error occurred on the server, please double-check your request!",
  });
});

// Start the server and log that it's working
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

export default app;
