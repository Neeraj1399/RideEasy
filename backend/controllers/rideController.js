// backend/controllers/rideController.js
import Ride from "../models/Ride.js";
import User from "../models/User.js"; // Converted to import
import { body, validationResult } from "express-validator"; // Converted to import
import * as geolib from "geolib"; // You imported geolib, but for calculating distance on backend, it's optional

export const createRide = async (req, res) => {
  try {
    const {
      origin,
      originCoords,
      destination,
      destinationCoords,
      vehicleType,
      availableSpace,
      price,
      distanceKm, // <--- NEW: Destructure distanceKm from the request body
      // Add other fields from your form like departureTime if you add them
    } = req.body;

    // Assuming req.user is populated by your authentication middleware
    const driverId = req.auth.userId; // Assuming req.auth.userId contains the Clerk user ID

    // First, find the Mongoose User document based on the Clerk ID
    const driverUser = await User.findOne({ clerkId: driverId });
    if (!driverUser) {
      return res.status(404).json({ message: "Driver user not found." });
    }
    if (driverUser.role !== "driver") {
      return res
        .status(403)
        .json({ message: "Access denied. Only drivers can create rides." });
    }

    // Basic validation, including for coordinates and distanceKm
    if (
      !origin ||
      !originCoords ||
      !destination ||
      !destinationCoords ||
      !vehicleType ||
      availableSpace === undefined ||
      price === undefined ||
      distanceKm === undefined || // <--- NEW: Validate distanceKm
      isNaN(distanceKm)
    ) {
      return res.status(400).json({
        message:
          "All ride details, including valid origin, destination selections, price, and distance, are required.",
      });
    }
    if (isNaN(availableSpace) || availableSpace < 1) {
      return res
        .status(400)
        .json({ message: "Available space must be at least 1." });
    }
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price cannot be negative." });
    }
    if (distanceKm <= 0) {
      // <--- NEW: Distance must be positive
      return res
        .status(400)
        .json({ message: "Distance must be greater than zero." });
    }

    // Optional: Recalculate distance on the backend as a security/integrity check
    // This adds a layer of robustness in case frontend calculation is tampered with.
    try {
      const backendCalculatedDistanceMeters = geolib.getDistance(
        { latitude: originCoords.lat, longitude: originCoords.lon },
        { latitude: destinationCoords.lat, longitude: destinationCoords.lon }
      );
      const backendCalculatedDistanceKm = parseFloat(
        (backendCalculatedDistanceMeters / 1000).toFixed(2)
      );

      // Allow for a small tolerance due to floating point arithmetic or slight API differences
      const DISTANCE_TOLERANCE_KM = 0.1; // 100 meters
      if (
        Math.abs(backendCalculatedDistanceKm - distanceKm) >
        DISTANCE_TOLERANCE_KM
      ) {
        console.warn(
          `Distance mismatch: Frontend ${distanceKm}km, Backend ${backendCalculatedDistanceKm}km`
        );
        // You can choose to:
        // 1. Return an error: return res.status(400).json({ message: "Calculated distance mismatch." });
        // 2. Log and proceed (using backend's calculated distance if desired):
        // req.body.distanceKm = backendCalculatedDistanceKm;
        // For now, we'll just log a warning.
      }
    } catch (calcError) {
      console.error("Error during backend distance calculation:", calcError);
      // Decide how to handle this:
      // return res.status(500).json({ message: "Server error during distance verification." });
    }

    const newRide = new Ride({
      driver: driverUser._id, // <--- Use the Mongoose User _id
      origin,
      originCoords,
      destination,
      destinationCoords,
      vehicleType,
      availableSpace,
      price,
      distanceKm, // <--- NEW: Add distanceKm to the new Ride instance
      // Add other fields like departureTime if you add them to your form and model
    });

    const savedRide = await newRide.save();

    res
      .status(201)
      .json({ message: "Ride created successfully!", ride: savedRide });
  } catch (error) {
    console.error("Error creating ride:", error);
    res.status(500).json({
      message: "Server error during ride creation.",
      error: error.message,
    });
  }
};

// Get all available rides (for customers to view)
export const getAvailableRides = async (req, res) => {
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
  body("distanceKm") // <--- NEW: Add validation for distanceKm
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),
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

    // Check if the customer has already requested to join or is a passenger
    const existingPassenger = ride.passengers.find(
      (p) => p.user.toString() === customerUser._id.toString()
    );
    if (existingPassenger) {
      return res
        .status(400)
        .json({
          message: "You have already sent a request or joined this ride.",
        });
    }

    if (ride.availableSpace <= 0) {
      return res
        .status(400)
        .json({ message: "No more space available on this ride." });
    }

    // Add passenger with 'pending' status
    ride.passengers.push({ user: customerUser._id, status: "pending" });
    // Don't decrement availableSpace immediately; do it when the driver accepts
    // ride.availableSpace -= 1; // Removed for now

    await ride.save();

    res.json({
      message:
        "Successfully requested to join the ride! Awaiting driver approval.",
      ride,
    });
  } catch (error) {
    console.error("Error joining ride:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get rides created by a specific driver
export const getDriverRides = async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const driverUser = await User.findOne({ clerkId });
    if (!driverUser || driverUser.role !== "driver") {
      return res
        .status(403)
        .json({ message: "Access denied. Only drivers can view their rides." });
    }

    const rides = await Ride.find({ driver: driverUser._id }).populate(
      "passengers.user", // Populate the 'user' field within the 'passengers' array
      "email" // Select only the email
    );
    res.json(rides);
  } catch (error) {
    console.error("Error fetching driver's rides:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// New: Accept/Reject Passenger Request
export const updatePassengerStatus = async (req, res) => {
  const clerkId = req.auth.userId;
  const { rideId, passengerId } = req.params;
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!["accepted", "rejected"].includes(status)) {
    return res
      .status(400)
      .json({
        message: "Invalid status provided. Must be 'accepted' or 'rejected'.",
      });
  }

  try {
    const driverUser = await User.findOne({ clerkId });
    if (!driverUser || driverUser.role !== "driver") {
      return res
        .status(403)
        .json({
          message: "Access denied. Only drivers can manage passenger requests.",
        });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    // Ensure the driver owns this ride
    if (ride.driver.toString() !== driverUser._id.toString()) {
      return res
        .status(403)
        .json({
          message:
            "Unauthorized. You can only manage requests for your own rides.",
        });
    }

    const passengerEntry = ride.passengers.find(
      (p) => p.user.toString() === passengerId
    );

    if (!passengerEntry) {
      return res
        .status(404)
        .json({ message: "Passenger not found in this ride's requests." });
    }

    // Prevent changing status if already accepted/rejected
    if (passengerEntry.status !== "pending") {
      return res
        .status(400)
        .json({
          message: `Passenger request is already ${passengerEntry.status}.`,
        });
    }

    passengerEntry.status = status;

    if (status === "accepted") {
      // Decrement availableSpace only if there's space left
      if (ride.availableSpace > 0) {
        ride.availableSpace -= 1;
      } else {
        passengerEntry.status = "pending"; // Revert status if no space
        return res
          .status(400)
          .json({
            message:
              "No more available space on this ride to accept more passengers.",
          });
      }
    }

    await ride.save();
    res.json({ message: `Passenger request ${status} successfully.`, ride });
  } catch (error) {
    console.error("Error updating passenger status:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// New: Get rides joined by a specific customer
export const getCustomerJoinedRides = async (req, res) => {
  const clerkId = req.auth.userId;
  try {
    const customerUser = await User.findOne({ clerkId });
    if (!customerUser || customerUser.role !== "customer") {
      return res
        .status(403)
        .json({
          message: "Access denied. Only customers can view their joined rides.",
        });
    }

    // Find rides where the customer's ID exists in the passengers array
    // We can further filter by status if needed (e.g., only 'accepted' or 'pending')
    const rides = await Ride.find({ "passengers.user": customerUser._id })
      .populate("driver", "email")
      .populate("passengers.user", "email"); // Populate the actual user details for passengers

    res.json(rides);
  } catch (error) {
    console.error("Error fetching customer's joined rides:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// New: Customer can cancel their request/booking for a ride
export const cancelJoinRequest = async (req, res) => {
  const clerkId = req.auth.userId;
  const { rideId } = req.params;

  try {
    const customerUser = await User.findOne({ clerkId });
    if (!customerUser || customerUser.role !== "customer") {
      return res
        .status(403)
        .json({
          message: "Access denied. Only customers can cancel ride requests.",
        });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    const passengerIndex = ride.passengers.findIndex(
      (p) => p.user.toString() === customerUser._id.toString()
    );

    if (passengerIndex === -1) {
      return res
        .status(400)
        .json({ message: "You have not joined this ride." });
    }

    const passengerEntry = ride.passengers[passengerIndex];

    // If the request was accepted, increment available space back
    if (passengerEntry.status === "accepted") {
      ride.availableSpace += 1;
    }

    // Remove the passenger entry from the array
    ride.passengers.splice(passengerIndex, 1);
    await ride.save();

    res.json({ message: "Successfully cancelled ride request/booking.", ride });
  } catch (error) {
    console.error("Error cancelling ride request:", error);
    res.status(500).json({ message: "Server error." });
  }
};
