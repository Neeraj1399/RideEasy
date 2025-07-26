// backend/routes/rideRoutes.js
import express from "express";
const router = express.Router();
import {
  createRide,
  getAvailableRides,
  getRideById,
  editRide,
  deleteRide,
  joinRide,
  getDriverRides,
  updatePassengerStatus, // Assuming you have this in your controller
  getCustomerJoinedRides, // Assuming you have this in your controller
  cancelJoinRequest, // Assuming you have this in your controller
} from "../controllers/rideController.js";

// Import your authentication/authorization middleware
import { requireAuth, authorizeRoles } from "../middlewares/authMiddleware.js"; // Adjust path if different

// Public routes (e.g., viewing rides - often allowed for unauthenticated users)
router.get("/", getAvailableRides); // Get all available rides

// Apply `requireAuth` middleware to all routes below this line
// This means a user MUST be authenticated (logged in via Clerk) to access them.
// The `requireAuth` middleware will populate `req.user` with the Mongoose user document.
router.use(requireAuth); // ALL routes below this require authentication

// Protected general ride routes (now requiring authentication)
router.get("/:id", getRideById); // Get a single ride by ID (now requires auth)

// Driver specific routes
// These also require the 'driver' role
router.post("/", authorizeRoles(["driver"]), createRide); // Create a new ride
router.put("/:id", authorizeRoles(["driver"]), editRide); // Edit a specific ride by ID
router.delete("/:id", authorizeRoles(["driver"]), deleteRide); // Delete a specific ride by ID
router.get("/driver/my-rides", authorizeRoles(["driver"]), getDriverRides); // Get rides created by the logged-in driver

// Driver actions on passenger requests
router.put(
  "/:rideId/passengers/:passengerId",
  authorizeRoles(["driver"]),
  updatePassengerStatus
);

// Customer specific routes
// These require the 'customer' role
router.post("/:id/join", authorizeRoles(["customer"]), joinRide); // Join a ride
router.get(
  "/customer/my-joined-rides",
  authorizeRoles(["customer"]),
  getCustomerJoinedRides
); // Get rides joined by the logged-in customer
router.delete(
  "/:rideId/cancel-join",
  authorizeRoles(["customer"]),
  cancelJoinRequest
); // Customer cancels their join request

export default router;
