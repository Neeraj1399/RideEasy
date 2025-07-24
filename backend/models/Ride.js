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
    destination: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["two-wheeler", "truck", "car"],
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
    passengers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Ride = mongoose.model("Ride", RideSchema);
export default Ride; // <-- Ensure this is 'export default Ride;'
