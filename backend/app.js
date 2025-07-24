// backend/app.js
import express from "express";
import cors from "cors";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// No need to import connectDB here anymore if it's called directly in server.js
// import connectDB from "./config/db.js"; // <-- You can remove this import too

// All initial configuration (dotenv, cloudinary, DB connection) is now handled in server.js
// import dotenv from "dotenv";
// import "./config/cloudinary.js";
// connectDB(); // <-- REMOVE THIS LINE! It's now called in server.js

// Import routes (these are fine here)
import userRoutes from "./routes/userRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";

const app = express();

// Define CORS options
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Apply Clerk's authentication middleware
app.use("/api", ClerkExpressRequireAuth());

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/rides", rideRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

export default app;
