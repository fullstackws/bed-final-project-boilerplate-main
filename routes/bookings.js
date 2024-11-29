import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth.js"; // Import the JWT authentication middleware

const router = express.Router();
const prisma = new PrismaClient();

// GET /bookings - Fetch all bookings or filter by userId
router.get("/", async (req, res) => {
  const { userId } = req.query; // Get userId from query parameters

  try {
    const filters = {};

    // Apply userId filter if provided
    if (userId) {
      filters.userId = userId; // Filter bookings by userId
    }

    const bookings = await prisma.booking.findMany({
      where: filters,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        userId: true,
        propertyId: true,
        createdAt: true,
      },
    });

    return res.status(200).json(bookings); // 200 OK for successful retrieval
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// POST /bookings - Create a new booking
// Apply JWT authentication middleware to this route
router.post("/", verifyToken, async (req, res) => {
  const { startDate, endDate, userId, propertyId } = req.body;

  if (!startDate || !endDate || !userId || !propertyId) {
    return res.status(400).json({
      message: "Start date, end date, user ID, and property ID are required", // 400 Bad Request for missing fields
    });
  }

  try {
    // Check if the user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" }); // 404 Not Found if user doesn't exist
    }

    // Check if the property exists
    const propertyExists = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!propertyExists) {
      return res.status(404).json({ message: "Property not found" }); // 404 Not Found if property doesn't exist
    }

    // Create the new booking
    const newBooking = await prisma.booking.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId,
        propertyId,
      },
    });

    return res.status(201).json(newBooking); // 201 Created for successfully creating a new booking
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// GET /bookings/:id - Fetch a single booking by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        userId: true,
        propertyId: true,
        createdAt: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" }); // 404 Not Found if booking doesn't exist
    }

    return res.status(200).json(booking); // 200 OK for successful retrieval of the booking
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// PUT /bookings/:id - Update a booking by id
// Apply JWT authentication middleware to this route
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, userId, propertyId } = req.body;

  if (!startDate && !endDate && !userId && !propertyId) {
    return res.status(400).json({
      message:
        "At least one field (startDate, endDate, userId, propertyId) is required", // 400 Bad Request for missing fields
    });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" }); // 404 Not Found if booking doesn't exist
    }

    const updatedData = {};
    if (startDate) updatedData.startDate = new Date(startDate);
    if (endDate) updatedData.endDate = new Date(endDate);
    if (userId) updatedData.userId = userId;
    if (propertyId) updatedData.propertyId = propertyId;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updatedData,
    });

    return res.status(200).json(updatedBooking); // 200 OK for successful update
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

// DELETE /bookings/:id - Delete a booking by id
// Apply JWT authentication middleware to this route
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBooking = await prisma.booking.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Booking with ID ${deletedBooking.id} deleted successfully`, // 200 OK for successful deletion
    });
  } catch (err) {
    console.error(err);
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Booking not found" }); // 404 Not Found if booking doesn't exist
    }
    return res.status(500).json({ message: "Server error" }); // 500 Internal Server Error
  }
});

export default router;
