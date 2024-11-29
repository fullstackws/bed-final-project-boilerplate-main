import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /amenities - Fetch all amenities
router.get("/", async (req, res) => {
  try {
    const amenities = await prisma.amenity.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(200).json(amenities); // 200 OK for successful retrieval of all amenities
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /amenities - Create a new amenity
// Apply the JWT authentication middleware to this route
router.post("/", verifyToken, async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Name and description are required" }); // 400 Bad Request for missing fields
  }

  try {
    // Create the new amenity
    const newAmenity = await prisma.amenity.create({
      data: {
        name,
        description,
      },
    });

    return res.status(201).json(newAmenity); // 201 Created for successfully creating a new amenity
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// GET /amenities/:id - Fetch a single amenity by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const amenity = await prisma.amenity.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    if (!amenity) {
      return res.status(404).json({ message: "Amenity not found" }); // 404 Not Found if amenity doesn't exist
    }

    return res.status(200).json(amenity); // 200 OK for successful retrieval
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /amenities/:id - Update an amenity by id
// Apply the JWT authentication middleware to this route
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name && !description) {
    return res.status(400).json({
      message: "At least one field (name or description) is required", // 400 Bad Request if no fields provided
    });
  }

  try {
    const amenity = await prisma.amenity.findUnique({ where: { id } });

    if (!amenity) {
      return res.status(404).json({ message: "Amenity not found" }); // 404 Not Found if amenity doesn't exist
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;

    const updatedAmenity = await prisma.amenity.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedAmenity); // 200 OK for successfully updating the amenity
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /amenities/:id - Delete an amenity by id
// Apply the JWT authentication middleware to this route
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAmenity = await prisma.amenity.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Amenity ${deletedAmenity.name} deleted successfully`, // 200 OK for successful deletion
    });
  } catch (err) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Amenity not found" }); // 404 Not Found if amenity doesn't exist
    }
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

export default router;
