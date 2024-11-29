import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /users - Fetch all users, optionally filter by username or email
router.get("/", async (req, res) => {
  const { username, email } = req.query;

  try {
    const filters = {};

    if (username) {
      filters.username = { contains: username, mode: "insensitive" }; // Case-insensitive filter for username
    }

    if (email) {
      filters.email = { contains: email, mode: "insensitive" }; // Case-insensitive filter for email
    }

    const users = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return res.status(200).json(users); // Success response
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // Internal server error
  }
});

// GET /users/:id - Fetch a single user by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" }); // User not found
    }

    return res.status(200).json(user); // Success response
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // Internal server error
  }
});

// POST /users - Create a new user
router.post("/", verifyToken, async (req, res) => {
  const { username, email, password, name, phoneNumber, profilePicture } =
    req.body;

  // Validate the required fields
  if (!username || !email || !password || !name) {
    return res
      .status(400)
      .json({ message: "Username, email, password, and name are required" });
  }

  try {
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" });
    }

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password, // Store the plain-text password
        name,
        phoneNumber,
        profilePicture,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser; // Exclude password from the response
    return res.status(201).json(userWithoutPassword); // User created successfully
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /users/:id - Update a user by ID
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  if (!username && !email && !password) {
    return res.status(400).json({
      message: "At least one field is required (username, email, or password)",
    });
  }

  if (req.user.id !== id) {
    return res
      .status(403)
      .json({ message: "You can only update your own account" }); // Forbidden
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedData = {};
    if (username) updatedData.username = username;
    if (email) updatedData.email = email;
    if (password) updatedData.password = password;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /users/:id - Delete a user by ID
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== id) {
    return res
      .status(403)
      .json({ message: "You can only delete your own account" });
  }

  try {
    const deletedUser = await prisma.user.delete({ where: { id } });
    return res
      .status(200)
      .json({ message: `User ${deletedUser.username} deleted successfully` });
  } catch (err) {
    console.error(err);

    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
