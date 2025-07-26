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
} from "../controllers/rideController.js";

// You should also include your authentication/authorization middleware here
// For example:
// import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
// import { requireAuth, authorizeRoles } from "../middlewares/authMiddleware.js";

// Driver routes (assuming these need authentication and perhaps driver role)
// These routes will be accessed via /api/rides/create, /api/rides/:id, /api/rides/driver etc.
router.post(
  "/",
  /* ClerkExpressRequireAuth(), requireAuth, authorizeRoles(['driver']), */ createRide
); // Changed from /rides to /
router.put(
  "/:id",
  /* ClerkExpressRequireAuth(), requireAuth, authorizeRoles(['driver']), */ editRide
); // Changed from /rides/:id to /:id
router.delete(
  "/:id",
  /* ClerkExpressRequireAuth(), requireAuth, authorizeRoles(['driver']), */ deleteRide
); // Changed from /rides/:id to /:id
router.get(
  "/driver",
  /* ClerkExpressRequireAuth(), requireAuth, authorizeRoles(['driver']), */ getDriverRides
); // Changed from /rides/driver to /driver

// Customer/General routes
// These routes will be accessed via /api/rides/ (for available rides), /api/rides/:id, /api/rides/:id/join etc.
router.get("/", getAvailableRides); // Changed from /rides to /
router.get("/:id", getRideById); // Changed from /rides/:id to /:id
router.post("/:id/join", joinRide); // Changed from /rides/:id/join to /:id/join

export default router;
