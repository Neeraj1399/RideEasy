// backend/routes/userRoutes.js
import express from "express";
import {
  getProfile,
  createOrUpdateUser,
  applyAsDriver,
  submitKycDetails,
  // Removed 'upload' from here, as it's now imported from middlewares/upload.js
} from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js"; // Your custom middleware
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"; // IMPORT CLERK AUTH HERE

import upload from "../middlewares/upload.js"; // <== CORRECTED: IMPORT MULTER INSTANCE FROM ITS DEDICATED FILE

const router = express.Router();

// General User Routes
router.post(
  "/create-or-update",
  ClerkExpressRequireAuth(),
  requireAuth,
  createOrUpdateUser
);
router.get("/profile", ClerkExpressRequireAuth(), requireAuth, getProfile);

// Driver Application / KYC Routes
router.post(
  "/apply-as-driver",
  ClerkExpressRequireAuth(),
  requireAuth,
  applyAsDriver
);

// Route for submitting KYC details with file uploads
router.post(
  "/submit-kyc-details",
  ClerkExpressRequireAuth(), // ADDED CLERK'S AUTH MIDDLEWARE HERE!
  requireAuth, // Your custom middleware will run after Clerk's
  upload.fields([
    // 'upload' now correctly comes from ../middlewares/upload.js
    { name: "driverLicenseFile", maxCount: 1 },
    { name: "vehicleRegistrationFile", maxCount: 1 },
    { name: "idProofFile", maxCount: 1 },
  ]),
  submitKycDetails
);

// ...

export default router;
