// backend/routes/adminRoutes.js
import express from "express";
// Import controller functions that handle admin actions
import { getAllPendingKyc, reviewKyc } from "../controllers/kycController.js";
import { updateUserRoleAndKycStatus } from "../controllers/userController.js"; // For user management by admin

// Import your authentication and authorization middleware
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { requireAuth, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply Clerk's authentication, your custom authentication,
// and role-based authorization (e.g., 'admin' role) to ALL routes in this file.
// This ensures only authenticated users with the 'admin' role can access these endpoints.
router.use(
  ClerkExpressRequireAuth(),
  requireAuth,
  authorizeRoles(["admin"]) // Make sure you have authorizeRoles implemented in authMiddleware.js
);

// KYC Administration Routes
// These routes will be prefixed with `/api/admin` when mounted in app.js
router.get("/kyc/pending", getAllPendingKyc);
router.put("/kyc/:id/review", reviewKyc);

// User Administration Routes
// This route will be prefixed with `/api/admin` when mounted in app.js
router.put("/user/:id/update", updateUserRoleAndKycStatus); // Changed to /user/:id/update for consistency

export default router;
