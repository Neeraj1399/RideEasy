// backend/models/Ride.js
import mongoose from "mongoose";

const RideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
    originCoords: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
    destination: {
      type: String,
      required: true,
    },
    destinationCoords: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
    vehicleType: {
      type: String,
      enum: ["two-wheeler", "truck", "car"], // Ensure these match your frontend options
      required: true,
    },
    availableSpace: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    distanceKm: {
      // <-- THIS IS THE NEW FIELD
      type: Number,
      required: true, // It's required since it's used for fare calculation
      min: 0,
    },
    passengers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    departureTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Ride = mongoose.model("Ride", RideSchema);
export default Ride;
