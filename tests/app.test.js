import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid"; // Import uuid to generate a unique ID
import app from "../src/index.js"; // Import the app from index.js

const prisma = new PrismaClient();

describe("API Tests", () => {
  let token;
  let username; // Store the dynamically generated username

  // Setup: Create a user and get a JWT token to use for authenticated requests
  beforeAll(async () => {
    // Dynamically generate a unique username using uuid
    username = `testuser-${uuidv4()}`;

    // Create a user to get the token with a unique username
    const user = await prisma.user.create({
      data: {
        username: username, // Use the unique username
        name: "Test User", // Ensure name is provided
        email: "testuser@example.com",
        phoneNumber: "1234567890", // Ensure phoneNumber is provided
        profilePicture: null, // Optional, can be null
        password: "passw0rd12",
      },
    });

    // Generate a JWT token for this user
    const response = await request(app)
      .post("/login")
      .send({ username: username, password: "testpassword123" });

    token = response.body.token; // Store the token for use in subsequent requests
  });

  // User Tests
  it("should fetch a user by ID", async () => {
    const response = await request(app)
      .get(`/users/${1}`) // Replace with actual user ID if necessary
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("username");
    expect(response.body).toHaveProperty("email");
  });

  it("should create a new user", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: `newuser-${uuidv4()}`, // Use a dynamically generated username
        email: "newuser@example.com",
        password: "newpassword123",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("username");
    expect(response.body.username).toContain("newuser");
    expect(response.body).toHaveProperty("email");
  });

  // Host Tests
  it("should fetch all hosts", async () => {
    const response = await request(app)
      .get("/hosts")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Hosts should be an array
  });

  it("should create a new host", async () => {
    const response = await request(app)
      .post("/hosts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: `newhost-${uuidv4()}`,
        email: "newhost@example.com",
        password: "hostpassword123",
        aboutMe: "About the new host",
      });

    expect(response.status).toBe(201);
    expect(response.body.username).toBeDefined();
  });

  // Property Tests
  it("should fetch all properties", async () => {
    const response = await request(app)
      .get("/properties")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Properties should be an array
  });

  it("should create a new property", async () => {
    const response = await request(app)
      .post("/properties")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Beautiful House",
        description: "A lovely house in the city.",
        location: "Malibu, California",
        pricePerNight: 310.25,
        bedroomCount: 3,
        bathroomCount: 2,
        maxGuestCount: 6,
        rating: 4.5,
        hostId: 1, // Assume host with ID 1 exists
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Beautiful House");
  });

  // Amenity Tests
  it("should fetch all amenities", async () => {
    const response = await request(app)
      .get("/amenities")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Amenities should be an array
  });

  it("should create a new amenity", async () => {
    const response = await request(app)
      .post("/amenities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Wifi",
        description: "High-speed wireless internet",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Wifi");
  });

  // Booking Tests
  it("should fetch all bookings", async () => {
    const response = await request(app)
      .get("/bookings")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Bookings should be an array
  });

  it("should create a new booking", async () => {
    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        startDate: "2024-01-01",
        endDate: "2024-01-07",
        userId: 1, // Assume user with ID 1 exists
        propertyId: 1, // Assume property with ID 1 exists
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("startDate", "2024-01-01");
  });

  // Review Tests
  it("should fetch all reviews", async () => {
    const response = await request(app)
      .get("/reviews")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Reviews should be an array
  });

  it("should create a new review", async () => {
    const response = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        rating: 5,
        comment: "Excellent property!",
        userId: 1, // Assume user with ID 1 exists
        propertyId: 1, // Assume property with ID 1 exists
      });

    expect(response.status).toBe(201);
    expect(response.body.rating).toBe(5);
    expect(response.body.comment).toBe("Excellent property!");
  });

  // Test Query Parameters
  it("should filter properties by location and pricePerNight", async () => {
    const response = await request(app)
      .get("/properties?location=Malibu, California&pricePerNight=310.25")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].location).toBe("Malibu, California");
    expect(response.body[0].pricePerNight).toBe(310.25);
  });

  it("should filter bookings by userId", async () => {
    const response = await request(app)
      .get("/bookings?userId=a1234567-89ab-cdef-0123-456789abcdef")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].userId).toBe(
      "a1234567-89ab-cdef-0123-456789abcdef"
    );
  });

  it("should filter users by username", async () => {
    const response = await request(app)
      .get("/users?username=jdoe")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].username).toBe("jdoe");
  });

  it("should filter users by email", async () => {
    const response = await request(app)
      .get("/users?email=johndoe@example.com")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].email).toBe("johndoe@example.com");
  });

  it("should filter hosts by name", async () => {
    const response = await request(app)
      .get("/hosts?name=Linda+Smith")
      .set("Authorization", `Bearer ${token}`);

    console.log("Response status:", response.status); // Log the status code
    console.log("Response body:", response.body); // Log the response body

    expect(response.status).toBe(200);
    expect(response.body[0].username).toBe("Linda Smith");
  });
});
