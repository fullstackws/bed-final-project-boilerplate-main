import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /properties - Fetch all properties with query parameters for filtering
router.get("/", async (req, res) => {
  const { location, pricePerNight, amenities } = req.query;

  try {
    const filters = {};

    // Filter by location (case-insensitive search)
    if (location) {
      filters.location = { contains: location, mode: "insensitive" };
    }

    // Filter by pricePerNight (exact match)
    if (pricePerNight) {
      filters.pricePerNight = { equals: parseFloat(pricePerNight) };
    }

    // Filter by amenities (multiple amenities can be provided, comma-separated)
    if (amenities) {
      const amenitiesArray = amenities.split(",");
      filters.amenities = {
        some: {
          name: { in: amenitiesArray },
        },
      };
    }

    const properties = await prisma.property.findMany({
      where: filters,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        pricePerNight: true,
        bedroomCount: true,
        bathroomCount: true,
        maxGuestCount: true,
        rating: true,
        hostId: true,
        createdAt: true,
      },
    });

    return res.status(200).json(properties); // 200 OK for successful retrieval
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /properties - Create a new property
// Apply JWT authentication middleware to this route
router.post("/", verifyToken, async (req, res) => {
  const {
    title,
    description,
    location,
    pricePerNight,
    bedroomCount,
    bathroomCount,
    maxGuestCount,
    rating,
    hostId,
  } = req.body;

  if (
    !title ||
    !description ||
    !location ||
    !pricePerNight ||
    !bedroomCount ||
    !bathroomCount ||
    !maxGuestCount ||
    !rating ||
    !hostId
  ) {
    return res.status(400).json({ message: "All fields are required" }); // 400 Bad Request for missing fields
  }

  try {
    // Check if the host exists before creating the property
    const hostExists = await prisma.host.findUnique({
      where: { id: hostId },
    });

    if (!hostExists) {
      return res.status(404).json({ message: "Host not found" }); // 404 Not Found if host doesn't exist
    }

    // Create the new property
    const newProperty = await prisma.property.create({
      data: {
        title,
        description,
        location,
        pricePerNight,
        bedroomCount,
        bathroomCount,
        maxGuestCount,
        rating,
        hostId,
      },
    });

    return res.status(201).json(newProperty); // 201 Created for successfully creating a new property
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// GET /properties/:id - Fetch a single property by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        pricePerNight: true,
        bedroomCount: true,
        bathroomCount: true,
        maxGuestCount: true,
        rating: true,
        hostId: true,
        createdAt: true,
      },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" }); // 404 Not Found if property doesn't exist
    }

    return res.status(200).json(property); // 200 OK for successful retrieval of the property
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /properties/:id - Update a property by id
// Apply JWT authentication middleware to this route
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    pricePerNight,
    bedroomCount,
    bathroomCount,
    maxGuestCount,
    rating,
    hostId,
  } = req.body;

  if (
    !title &&
    !description &&
    !location &&
    !pricePerNight &&
    !bedroomCount &&
    !bathroomCount &&
    !maxGuestCount &&
    !rating &&
    !hostId
  ) {
    return res.status(400).json({
      message:
        "At least one field (title, description, location, pricePerNight, bedroomCount, bathroomCount, maxGuestCount, rating, or hostId) is required", // 400 Bad Request for missing fields
    });
  }

  try {
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return res.status(404).json({ message: "Property not found" }); // 404 Not Found if property doesn't exist
    }

    const updatedData = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (location) updatedData.location = location;
    if (pricePerNight) updatedData.pricePerNight = pricePerNight;
    if (bedroomCount) updatedData.bedroomCount = bedroomCount;
    if (bathroomCount) updatedData.bathroomCount = bathroomCount;
    if (maxGuestCount) updatedData.maxGuestCount = maxGuestCount;
    if (rating) updatedData.rating = rating;
    if (hostId) updatedData.hostId = hostId;

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedProperty); // 200 OK for successful update
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /properties/:id - Delete a property by id
// Apply JWT authentication middleware to this route
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProperty = await prisma.property.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Property ${deletedProperty.title} deleted successfully`, // 200 OK for successful deletion
    });
  } catch (err) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Property not found" }); // 404 Not Found if property doesn't exist
    }
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

export default router;
