import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml"; // To parse YAML files
import { fileURLToPath } from "url";

// Setup ESM-friendly __dirname
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Load data from the OpenAPI YAML file
  const openApiPath = path.join(__dirname, "../openapi.yaml");
  const openApiData = yaml.load(await fs.readFile(openApiPath, "utf8"));

  // Helper function to safely access properties in OpenAPI YAML structure
  function getComponentsSchema(schemaName) {
    if (openApiData.components && openApiData.components.schemas) {
      return openApiData.components.schemas[schemaName]?.example || [];
    }
    return [];
  }

  // Seed users
  const users = getComponentsSchema("User");
  for (const user of users) {
    if (user) {
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            username: user.username,
            name: user.name,
            password: user.password,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
          },
        });
      } catch (err) {
        if (err.code === "P2002") {
          console.log(`Skipping duplicate user: ${user.username}`);
        } else {
          throw err;
        }
      }
    }
  }

  // Seed hosts
  const hosts = getComponentsSchema("Host");
  for (const host of hosts) {
    if (host) {
      await prisma.host.create({
        data: {
          id: host.id,
          username: host.username,
          name: host.name,
          email: host.email,
          phoneNumber: host.phoneNumber,
          profilePicture: host.profilePicture,
          aboutMe: host.aboutMe,
        },
      });
    }
  }

  // Seed properties
  const properties = getComponentsSchema("Property");
  for (const property of properties) {
    if (property) {
      try {
        const hostExists = await prisma.host.findUnique({
          where: { id: property.hostId },
        });

        if (hostExists) {
          await prisma.property.create({
            data: {
              id: property.id,
              title: property.title,
              description: property.description,
              location: property.location,
              pricePerNight: parseFloat(property.pricePerNight),
              bedroomCount: property.bedroomCount || 0,
              bathroomCount: property.bathroomCount || 0,
              maxGuestCount: property.maxGuestCount || 1,
              rating: property.rating || 0,
              host: { connect: { id: property.hostId } },
            },
          });
        } else {
          console.log(
            `Skipping property: ${property.title}, host not found: ${property.hostId}`
          );
        }
      } catch (err) {
        console.error(`Failed to create property: ${property.title}`, err);
      }
    }
  }

  // Seed bookings
  const bookings = getComponentsSchema("Booking");
  for (const booking of bookings) {
    if (booking) {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      if (isNaN(startDate) || isNaN(endDate)) {
        console.log(`Invalid dates for booking: ${booking.id}, skipping.`);
        continue;
      }

      await prisma.booking.create({
        data: {
          id: booking.id,
          startDate: startDate,
          endDate: endDate,
          user: { connect: { id: booking.userId } },
          property: { connect: { id: booking.propertyId } },
        },
      });
    }
  }

  // Seed reviews
  const reviews = getComponentsSchema("Review");
  for (const review of reviews) {
    if (review) {
      const propertyExists = await prisma.property.findUnique({
        where: { id: review.propertyId },
      });

      if (propertyExists) {
        await prisma.review.create({
          data: {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            property: { connect: { id: review.propertyId } },
            user: { connect: { id: review.userId } },
          },
        });
      } else {
        console.log(
          `Skipping review for property: ${review.propertyId}, property not found.`
        );
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
