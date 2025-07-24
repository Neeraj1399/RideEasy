// backend/models/Kyc.js
import mongoose from "mongoose";

const KycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true, // Should be unique as each user has one KYC
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    // Add these new fields for the numbers
    driverLicenseNumber: {
      type: String,
      required: true,
    },
    vehicleRegistrationNumber: {
      type: String,
      required: true,
    },
    idProofNumber: {
      type: String,
      required: true,
    },
    // File URLs
    driverLicenseUrl: {
      type: String,
      required: true,
    },
    vehicleRegistrationUrl: {
      type: String,
      required: true,
    },
    idProofUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Kyc = mongoose.model("Kyc", KycSchema);
export default Kyc;
