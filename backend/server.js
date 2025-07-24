// backend/server.js

console.log("SERVER.JS EXECUTION START: Before any imports");

// 1. Import dotenv and call config() IMMEDIATELY.
import dotenv from "dotenv";
console.log("SERVER.JS DEBUG: After dotenv import");
dotenv.config();
console.log("SERVER.JS DEBUG: After dotenv.config() call");

// 2. Import and CALL connectDB() AFTER dotenv.config()
import connectDB from "./config/db.js"; // Import the function
console.log("SERVER.JS DEBUG: After connectDB import");
connectDB(); // Call the function to connect to MongoDB
console.log("SERVER.JS DEBUG: After connectDB() function call");

// --- CRITICAL CHANGE FOR CLOUDINARY ---
// 3. Import Cloudinary v2 directly here and configure it AFTER dotenv has run.
//    We are no longer importing './config/cloudinary.js' as a file that *calls* config,
//    instead we call config directly in server.js.
import { v2 as cloudinary } from "cloudinary"; // Import cloudinary directly
console.log("SERVER.JS DEBUG: After cloudinary import (for direct config)");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
console.log("SERVER.JS DEBUG: After cloudinary.config() called directly");

// --- END CRITICAL CHANGE ---

// 4. Import your main express app
import app from "./app.js";
console.log("SERVER.JS DEBUG: After app import");

// Now, process.env.PORT will be available
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log("SERVER.JS EXECUTION END: Server listen command issued");
