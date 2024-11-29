// routes/login.js
import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// POST /login - Log in a user using JWT and return a token
router.post("/", async (req, res) => {
  // Remove '/login' here
  const { username, password } = req.body;

  // Check if both username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" }); // 400 Bad Request if fields are missing
  }

  try {
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // If user not found, return an error
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" }); // 401 Unauthorized if user is not found
    }

    // Compare the provided password with the stored password (no hashing)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid credentials" }); // 401 Unauthorized if password doesn't match
    }

    // Generate a JWT token upon successful login
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7h" } // Token expires in 7 hours
    );

    // Return the token in the response
    return res.status(200).json({ token }); // 200 OK for successful login with the token
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error for unexpected errors
  }
});

export default router;
