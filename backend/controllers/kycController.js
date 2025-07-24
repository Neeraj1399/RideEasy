// backend/controllers/kycController.js
import Kyc from "../models/Kyc.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { body, validationResult } from "express-validator";

// Submit KYC application
export const submitKyc = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("phoneNumber").notEmpty().withMessage("Phone number is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  // IMPORTANT: Add validation for driverLicenseNumber, vehicleRegistrationNumber, idProofNumber
  body("driverLicenseNumber")
    .notEmpty()
    .withMessage("Driver License Number is required"),
  body("vehicleRegistrationNumber")
    .notEmpty()
    .withMessage("Vehicle Registration Number is required"),
  body("idProofNumber").notEmpty().withMessage("ID Proof Number is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure all text fields are destructured from req.body
    const {
      fullName,
      phoneNumber,
      email,
      driverLicenseNumber,
      vehicleRegistrationNumber,
      idProofNumber,
    } = req.body;
    const clerkId = req.auth.userId;

    // --- CRITICAL FIXES HERE ---
    // Correct way to access files from req.files when using upload.fields()
    // Use optional chaining (?.) to safely access properties
    // Use [0] to get the first (and only) file object from the array returned by Multer for each field
    const driverLicenseFile = req.files?.driverLicenseFile?.[0];
    const vehicleRegistrationFile = req.files?.vehicleRegistrationFile?.[0];
    const idProofFile = req.files?.idProofFile?.[0];

    // Check if all required files exist
    if (!driverLicenseFile || !vehicleRegistrationFile || !idProofFile) {
      return res.status(400).json({
        message:
          "All three documents (driver license, vehicle registration, ID proof) are required.",
      });
    }
    // --- END CRITICAL FIXES ---

    try {
      // Check if KYC already exists for this user
      let kyc = await Kyc.findOne({ clerkId });
      if (kyc) {
        return res.status(400).json({
          message: "KYC application already submitted for this user.",
        });
      }

      // Upload to Cloudinary - use the new file variables
      const uploadPromises = [
        cloudinary.uploader.upload(
          `data:${
            driverLicenseFile.mimetype
          };base64,${driverLicenseFile.buffer.toString("base64")}`,
          { folder: "rideeasy/kyc" }
        ),
        cloudinary.uploader.upload(
          `data:${
            vehicleRegistrationFile.mimetype
          };base64,${vehicleRegistrationFile.buffer.toString("base64")}`,
          { folder: "rideeasy/kyc" }
        ),
        cloudinary.uploader.upload(
          `data:${idProofFile.mimetype};base64,${idProofFile.buffer.toString(
            "base64"
          )}`,
          { folder: "rideeasy/kyc" }
        ),
      ];

      const [driverLicenseRes, vehicleRegistrationRes, idProofRes] =
        await Promise.all(uploadPromises);

      const user = await User.findOne({ clerkId });
      if (!user) {
        return res.status(404).json({
          message: "User not found in local DB. Please register first.",
        });
      }

      kyc = new Kyc({
        userId: user._id,
        clerkId,
        fullName,
        phoneNumber,
        email,
        driverLicenseNumber, // Pass these new fields to the model
        vehicleRegistrationNumber,
        idProofNumber,
        driverLicenseUrl: driverLicenseRes.secure_url,
        vehicleRegistrationUrl: vehicleRegistrationRes.secure_url,
        idProofUrl: idProofRes.secure_url,
        status: "pending",
      });

      await kyc.save();

      // Update user's kycStatus to pending
      user.kycStatus = "pending";
      await user.save();

      res.status(201).json({
        message: "KYC application submitted successfully. Awaiting approval.",
        kyc,
      });
    } catch (error) {
      console.error("Error submitting KYC:", error);
      res.status(500).json({
        message: "Server error during KYC submission or file upload.",
        error: error.message, // Provide more specific error in response for debugging
      });
    }
  },
];

// ... (rest of your kycController.js functions)
export const getKycApplication = async (req, res) => {
  // Converted to named export
  try {
    const clerkId = req.auth.userId;
    const kyc = await Kyc.findOne({ clerkId });

    if (!kyc) {
      return res
        .status(404)
        .json({ message: "KYC application not found for this user." });
    }
    res.json(kyc);
  } catch (error) {
    console.error("Error fetching KYC application:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Get all pending KYC applications
export const getAllPendingKyc = async (req, res) => {
  // Converted to named export
  try {
    const adminClerkId = req.auth.userId;
    const adminUser = await User.findOne({ clerkId: adminClerkId });
    if (!adminUser || adminUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    const pendingKycs = await Kyc.find({ status: "pending" }).populate(
      "userId",
      "email clerkId"
    );
    res.json(pendingKycs);
  } catch (error) {
    console.error("Error fetching pending KYCs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Approve or Reject KYC application
export const reviewKyc = [
  // Converted to named export
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage('Status must be "approved" or "rejected"'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // KYC application ID
    const { status } = req.body;

    try {
      const adminClerkId = req.auth.userId;
      const adminUser = await User.findOne({ clerkId: adminClerkId });
      if (!adminUser || adminUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Access denied. Admin privileges required." });
      }

      const kyc = await Kyc.findById(id);
      if (!kyc) {
        return res.status(404).json({ message: "KYC application not found" });
      }

      kyc.status = status;
      await kyc.save();

      // Update user's role to driver and kycStatus based on approval
      const user = await User.findById(kyc.userId);
      if (user) {
        user.kycStatus = status;
        if (status === "approved") {
          user.role = "driver";
        }
        await user.save();
      }

      res.json({ message: `KYC application ${status} successfully.`, kyc });
    } catch (error) {
      console.error("Error reviewing KYC:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];
