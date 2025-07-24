// backend/routes/kycRoutes.js
import express from "express";
const router = express.Router();
import {
  submitKyc,
  getKycApplication,
  getAllPendingKyc,
  reviewKyc,
} from "../controllers/kycController.js"; // Ensure these are named exports
import upload from "../middlewares/upload.js";

router.post(
  "/submit",
  upload.fields([
    { name: "driverLicenseFile", maxCount: 1 },
    { name: "vehicleRegistrationFile", maxCount: 1 },
    { name: "idProofFile", maxCount: 1 },
  ]),
  submitKyc
);
router.get("/kyc", getKycApplication);
router.get("/admin/kyc/pending", getAllPendingKyc);
router.put("/admin/kyc/:id/review", reviewKyc);

export default router;
