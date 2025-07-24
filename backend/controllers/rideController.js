// backend/controllers/rideController.js
import Ride from "../models/Ride.js"; // Converted to import
import User from "../models/User.js"; // Converted to import
import { body, validationResult } from "express-validator"; // Converted to import

// Create a new ride (Driver only)
export const createRide = [
  // Ensure 'export const'
  body("origin").notEmpty().withMessage("Origin is required"),
  body("destination").notEmpty().withMessage("Destination is required"),
  body("vehicleType")
    .isIn(["two-wheeler", "truck", "car"])
    .withMessage("Invalid vehicle type"),
  body("availableSpace")
    .isInt({ min: 1 })
    .withMessage("Available space must be at least 1"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clerkId = req.auth.userId;
    try {
      const driverUser = await User.findOne({ clerkId });
      if (
        !driverUser ||
        driverUser.role !== "driver" ||
        driverUser.kycStatus !== "approved"
      ) {
        return res
          .status(403)
          .json({
            message: "Access denied. Only approved drivers can create rides.",
          });
      }

      const newRide = new Ride({
        driver: driverUser._id,
        ...req.body,
      });

      await newRide.save();
      res
        .status(201)
        .json({ message: "Ride created successfully", ride: newRide });
    } catch (error) {
      console.error("Error creating ride:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

// Get all available rides (for customers to view)
export const getAvailableRides = async (req, res) => {
  // Ensure 'export const'
  try {
    const rides = await Ride.find({ status: "active" }).populate(
      "driver",
      "email"
    );
    res.json(rides);
  } catch (error) {
    console.error("Error fetching available rides:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single ride by ID
export const getRideById = async (req, res) => {
  // Ensure 'export const'
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("driver", "email")
      .populate("passengers", "email");
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }
    res.json(ride);
  } catch (error) {
    console.error("Error fetching ride:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit an existing ride (Driver only, for their own rides)
export const editRide = [
  // Ensure 'export const'
  body("origin").optional().notEmpty().withMessage("Origin cannot be empty"),
  body("destination")
    .optional()
    .notEmpty()
    .withMessage("Destination cannot be empty"),
  body("vehicleType")
    .optional()
    .isIn(["two-wheeler", "truck", "car"])
    .withMessage("Invalid vehicle type"),
  body("availableSpace")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available space must be a non-negative integer"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("status")
    .optional()
    .isIn(["active", "completed", "cancelled"])
    .withMessage("Invalid ride status"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clerkId = req.auth.userId;
    const { id } = req.params;

    try {
      const driverUser = await User.findOne({ clerkId });
      if (!driverUser || driverUser.role !== "driver") {
        return res
          .status(403)
          .json({ message: "Access denied. Only drivers can edit rides." });
      }

      const ride = await Ride.findById(id);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      if (ride.driver.toString() !== driverUser._id.toString()) {
        return res
          .status(403)
          .json({ message: "Unauthorized. You can only edit your own rides." });
      }

      Object.assign(ride, req.body);
      await ride.save();
      res.json({ message: "Ride updated successfully", ride });
    } catch (error) {
      console.error("Error editing ride:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

// Delete a ride (Driver only, for their own rides)
export const deleteRide = async (req, res) => {
  // Ensure 'export const'
  const clerkId = req.auth.userId;
  const { id } = req.params;

  try {
    const driverUser = await User.findOne({ clerkId });
    if (!driverUser || driverUser.role !== "driver") {
      return res
        .status(403)
        .json({ message: "Access denied. Only drivers can delete rides." });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driver.toString() !== driverUser._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized. You can only delete your own rides." });
    }

    await Ride.deleteOne({ _id: id });
    res.json({ message: "Ride deleted successfully" });
  } catch (error) {
    console.error("Error deleting ride:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Join a ride (Customer only)
export const joinRide = async (req, res) => {
  // Ensure 'export const'
  const clerkId = req.auth.userId;
  const { id } = req.params;

  try {
    const customerUser = await User.findOne({ clerkId });
    if (!customerUser || customerUser.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Access denied. Only customers can join rides." });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "active") {
      return res
        .status(400)
        .json({ message: "This ride is not active and cannot be joined." });
    }

    if (ride.passengers.includes(customerUser._id)) {
      return res
        .status(400)
        .json({ message: "You have already joined this ride." });
    }

    if (ride.availableSpace <= 0) {
      return res
        .status(400)
        .json({ message: "No more space available on this ride." });
    }

    ride.passengers.push(customerUser._id);
    ride.availableSpace -= 1;
    await ride.save();

    res.json({ message: "Successfully joined the ride!", ride });
  } catch (error) {
    console.error("Error joining ride:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get rides created by a specific driver
export const getDriverRides = async (req, res) => {
  // Ensure 'export const'
  const clerkId = req.auth.userId;
  try {
    const driverUser = await User.findOne({ clerkId });
    if (!driverUser || driverUser.role !== "driver") {
      return res
        .status(403)
        .json({ message: "Access denied. Only drivers can view their rides." });
    }

    const rides = await Ride.find({ driver: driverUser._id }).populate(
      "passengers",
      "email"
    );
    res.json(rides);
  } catch (error) {
    console.error("Error fetching driver's rides:", error);
    res.status(500).json({ message: "Server error" });
  }
};
