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
} from "../controllers/rideController.js"; // Ensure these are named exports

// Driver routes
router.post("/rides", createRide);
router.put("/rides/:id", editRide);
router.delete("/rides/:id", deleteRide);
router.get("/rides/driver", getDriverRides);

// Customer/General routes
router.get("/rides", getAvailableRides);
router.get("/rides/:id", getRideById);
router.post("/rides/:id/join", joinRide);

export default router;
