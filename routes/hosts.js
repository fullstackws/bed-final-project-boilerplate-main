import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /hosts - Fetch all hosts, optionally filter by name
router.get("/", async (req, res) => {
  const { name } = req.query; // Get the 'name' query parameter

  try {
    // Prepare filters
    const filters = {};

    // Apply filter by name (username) if provided
    if (name) {
      filters.username = { contains: name, mode: "insensitive" }; // Case-insensitive search for username
    }

    const hosts = await prisma.host.findMany({
      where: filters, // Apply the filters here
      select: {
        id: true,
        username: true,
        email: true,
        aboutMe: true,
        createdAt: true,
      },
    });

    return res.status(200).json(hosts); // 200 OK for successful retrieval
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /hosts - Create a new host
router.post("/", verifyToken, async (req, res) => {
  const { username, email, password, aboutMe } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required" }); // 400 Bad Request for missing fields
  }

  try {
    // Check if username or email already exists
    const existingHost = await prisma.host.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingHost) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" }); // 400 Bad Request if username or email exists
    }

    // Create the new host (password is stored in plain text)
    const newHost = await prisma.host.create({
      data: {
        username,
        email,
        password, // Store the plain-text password
        aboutMe,
      },
    });

    // Exclude password from the response
    const { password: _, ...hostWithoutPassword } = newHost;

    return res.status(201).json(hostWithoutPassword); // 201 Created for successfully creating a new host
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// GET /hosts/:id - Fetch a single host by id (excluding password)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const host = await prisma.host.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        aboutMe: true,
        createdAt: true,
      },
    });

    if (!host) {
      return res.status(404).json({ message: "Host not found" }); // 404 Not Found if host doesn't exist
    }

    return res.status(200).json(host); // 200 OK for successful retrieval of the host
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /hosts/:id - Update a host by id
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, email, password, aboutMe } = req.body;

  if (!username && !email && !password && !aboutMe) {
    return res.status(400).json({
      message:
        "At least one field (username, email, password, or aboutMe) is required", // 400 Bad Request for missing fields
    });
  }

  try {
    const host = await prisma.host.findUnique({ where: { id } });

    if (!host) {
      return res.status(404).json({ message: "Host not found" }); // 404 Not Found if host doesn't exist
    }

    const updatedData = {};
    if (username) updatedData.username = username;
    if (email) updatedData.email = email;
    if (password) {
      updatedData.password = password; // Store the password in plain text
    }
    if (aboutMe) updatedData.aboutMe = aboutMe;

    const updatedHost = await prisma.host.update({
      where: { id },
      data: updatedData,
    });

    // Exclude password from the response
    const { password: _, ...hostWithoutPassword } = updatedHost;

    return res.status(200).json(hostWithoutPassword); // 200 OK for successful update
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /hosts/:id - Delete a host by id
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedHost = await prisma.host.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Host ${deletedHost.username} deleted successfully`, // 200 OK for successful deletion
    });
  } catch (err) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Host not found" }); // 404 Not Found if host doesn't exist
    }
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

export default router;
