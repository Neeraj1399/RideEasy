// backend/routes/kycRoutes.js
import express from "express";
const router = express.Router();
import { submitKyc, getKycApplication } from "../controllers/kycController.js"; // Ensure these are named exports
import upload from "../middlewares/upload.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"; // Import Clerk auth
import { requireAuth } from "../middlewares/authMiddleware.js";

router.post(
  "/submit",
  upload.fields([
    { name: "driverLicenseFile", maxCount: 1 },
    { name: "vehicleRegistrationFile", maxCount: 1 },
    { name: "idProofFile", maxCount: 1 },
  ]),
  submitKyc
);
router.get(
  "/", // Changed from "/kyc" to "/" because it will be mounted under "/api/kyc"
  ClerkExpressRequireAuth(), // Add Clerk's auth middleware
  requireAuth, // Add your custom auth middleware
  getKycApplication
);
router.get("/kyc", getKycApplication);

export default router;
