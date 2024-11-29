import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup ESM-friendly __dirname
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Load data from JSON files
  const usersPath = path.join(__dirname, "../src/data", "users.json");
  const hostsPath = path.join(__dirname, "../src/data", "hosts.json");
  const propertiesPath = path.join(__dirname, "../src/data", "properties.json");
  const bookingsPath = path.join(__dirname, "../src/data", "bookings.json");
  const reviewsPath = path.join(__dirname, "../src/data", "reviews.json");
  const amenitiesPath = path.join(__dirname, "../src/data", "amenities.json");

  const users = JSON.parse(await fs.readFile(usersPath, "utf8")).users;
  const hosts = JSON.parse(await fs.readFile(hostsPath, "utf8")).hosts;
  const properties = JSON.parse(
    await fs.readFile(propertiesPath, "utf8")
  ).properties;
  const bookings = JSON.parse(await fs.readFile(bookingsPath, "utf8")).bookings;
  const reviews = JSON.parse(await fs.readFile(reviewsPath, "utf8")).reviews;
  const amenities = JSON.parse(
    await fs.readFile(amenitiesPath, "utf8")
  ).amenities;

  // Seed amenities
  for (const amenity of amenities) {
    try {
      await prisma.amenity.create({
        data: {
          id: amenity.id,
          name: amenity.name,
        },
      });
    } catch (err) {
      console.error(`Failed to create amenity: ${amenity.name}`, err);
    }
  }

  // Seed users with unique username check
  for (const userData of users) {
    try {
      await prisma.user.create({
        data: {
          username: userData.username,
          name: userData.name,
          password: userData.password,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          profilePicture: userData.profilePicture,
        },
      });
    } catch (err) {
      if (err.code === "P2002") {
        console.log(`Skipping duplicate user: ${userData.username}`);
      } else {
        console.error(`Error creating user ${userData.username}:`, err);
        throw err;
      }
    }
  }

  // Seed hosts
  for (const hostData of hosts) {
    try {
      await prisma.host.create({
        data: {
          username: hostData.username,
          name: hostData.name,
          email: hostData.email,
          phoneNumber: hostData.phoneNumber,
          profilePicture: hostData.profilePicture,
          aboutMe: hostData.aboutMe,
        },
      });
    } catch (err) {
      console.error(`Error creating host ${hostData.username}:`, err);
    }
  }

  // Seed properties
  // Seed properties
  // Seed properties
  for (const propertyData of properties) {
    try {
      // Log the property data and hostId for debugging
      console.log(
        `Checking host for property: ${propertyData.title}, Host ID: ${propertyData.hostId}`
      );

      // Ensure the host exists before creating the property
      const hostExists = await prisma.host.findUnique({
        where: { id: propertyData.hostId },
      });

      if (hostExists) {
        console.log(
          `Host found for property: ${propertyData.title}, Host: ${hostExists.username}`
        );

        await prisma.property.create({
          data: {
            id: propertyData.id,
            title: propertyData.title,
            description: propertyData.description,
            location: propertyData.location,
            pricePerNight: parseFloat(propertyData.pricePerNight),
            bedroomCount: propertyData.bedroomCount || 0,
            bathroomCount: propertyData.bathRoomCount || 0,
            maxGuestCount: propertyData.maxGuestCount || 1,
            rating: propertyData.rating || 0,
            host: { connect: { id: propertyData.hostId } }, // Ensure this is using 'hostId'
          },
        });
      } else {
        console.log(
          `Skipping property: ${propertyData.title}, host not found: ${propertyData.hostId}`
        );
      }
    } catch (err) {
      console.error(`Failed to create property: ${propertyData.title}`, err);
    }
  }

  // Seed bookings
  for (const bookingData of bookings) {
    const startDate = new Date(bookingData.checkinDate);
    const endDate = new Date(bookingData.checkoutDate);

    // Validate dates
    if (isNaN(startDate) || isNaN(endDate)) {
      console.log(`Invalid dates for booking: ${bookingData.id}, skipping.`);
      continue;
    }

    try {
      // Ensure the user exists before creating the booking
      const userExists = await prisma.user.findUnique({
        where: { id: bookingData.userId },
      });

      // Ensure the property exists before creating the booking
      const propertyExists = await prisma.property.findUnique({
        where: { id: bookingData.propertyId },
      });

      if (userExists && propertyExists) {
        await prisma.booking.create({
          data: {
            id: bookingData.id,
            startDate: startDate,
            endDate: endDate,
            user: { connect: { id: bookingData.userId } },
            property: { connect: { id: bookingData.propertyId } },
          },
        });
      } else {
        console.log(
          `Skipping booking: ${bookingData.id}, user or property not found.`
        );
      }
    } catch (err) {
      console.error(`Failed to create booking: ${bookingData.id}`, err);
    }
  }

  // Seed reviews
  for (const reviewData of reviews) {
    try {
      // Ensure the property exists before creating the review
      const propertyExists = await prisma.property.findUnique({
        where: { id: reviewData.propertyId },
      });

      // Ensure the user exists before creating the review
      const userExists = await prisma.user.findUnique({
        where: { id: reviewData.userId },
      });

      if (propertyExists && userExists) {
        await prisma.review.create({
          data: {
            id: reviewData.id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            user: { connect: { id: reviewData.userId } },
            property: { connect: { id: reviewData.propertyId } },
          },
        });
      } else {
        console.log(
          `Skipping review: ${reviewData.id}, property or user not found.`
        );
      }
    } catch (err) {
      console.error(`Failed to create review: ${reviewData.id}`, err);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
