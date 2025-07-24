// backend/models/userModel.js
import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["admin", "customer", "driver"],
      default: "customer",
    },
    kycStatus: {
      // Keep kycStatus here for quick lookup without populating Kyc doc
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    // Reference to the Kyc document
    kycApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kyc",
      default: null, // Will be set once a KYC application is submitted
    },
    // The following fields were previously in User, but are now managed in Kyc.js
    // fullName: { type: String, default: null },
    // phoneNumber: { type: String, default: null },
    // driverLicenseNumber: { type: String, default: null },
    // vehicleRegistrationNumber: { type: String, default: null },
    // idProofNumber: { type: String, default: null },
    // driverLicenseUrl: { type: String, default: null },
    // vehicleRegistrationUrl: { type: String, default: null },
    // idProofUrl: { type: String, default: null },

    // Keep these fields for driver-specific operations
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index for geospatial queries
userSchema.index({ currentLocation: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;
