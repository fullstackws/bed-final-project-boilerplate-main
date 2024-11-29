import jwt from "jsonwebtoken";

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  // Get the token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied" }); // 401 Unauthorized
  }

  try {
    // Verify the token using the JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user information to the request object
    req.user = decoded; // Example: { userId, username }

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" }); // 401 Unauthorized
  }
};
