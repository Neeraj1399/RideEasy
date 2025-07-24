// backend/controllers/userController.js
import User from "../models/User.js";
import Kyc from "../models/Kyc.js"; // Import the Kyc model

// CORRECT IMPORT: Import 'cloudinary' as a named export from your config file
import { v2 as cloudinary } from "cloudinary"; // Import v2 directly from the package

// Multer storage configuration (in-memory storage for Cloudinary upload)

// Export upload instance for routes

// @desc    Get user profile (for customers/drivers to view their own data)
// @route   GET /api/user/profile
// @access  Protected (requires authentication via requireAuth middleware)
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return res
        .status(404)
        .json({ message: "User not found in database after authentication." });
    }

    // Populate the kycApplication if it exists
    const userWithKyc = await User.findById(user._id).populate(
      "kycApplication"
    );

    res.json(userWithKyc); // Return the user with populated KYC data
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error fetching profile." });
  }
};

// @desc    Create or update user upon successful Clerk authentication (called from frontend)
// @route   POST /api/create-or-update
// @access  Protected (requires authentication via requireAuth middleware)
export const createOrUpdateUser = async (req, res) => {
  const { email } = req.body;
  const clerkId = req.user ? req.user.clerkId : null; // Ensure clerkId is from req.user

  console.log(
    `createOrUpdateUser: Request received. Email: ${email}, Clerk ID from req.user: ${clerkId}`
  );

  if (!clerkId || !email) {
    console.log(
      "createOrUpdateUser: Missing Clerk ID or email. Returning 400."
    );
    return res
      .status(400)
      .json({ message: "Clerk ID and email are required for sync." });
  }

  try {
    let user = await User.findOne({ clerkId });
    console.log(
      `createOrUpdateUser: Found existing user with Clerk ID ${clerkId}? ${!!user}`
    );

    if (user) {
      if (user.email !== email) {
        console.log(
          `createOrUpdateUser: Existing user email changed from ${user.email} to ${email}. Attempting to save...`
        );
        user.email = email;
        await user.save();
        console.log(
          `createOrUpdateUser: Existing user email updated and saved: ${user.email}`
        );
      } else {
        console.log(
          `createOrUpdateUser: Existing user found, no email change needed. Email: ${user.email}`
        );
      }
      return res
        .status(200)
        .json({ message: "User updated successfully", user });
    } else {
      const userCount = await User.countDocuments();
      console.log(
        `createOrUpdateUser: No user found for Clerk ID ${clerkId}. Total users in DB: ${userCount}. Preparing to create new user.`
      );

      let newRole = "customer";
      if (userCount === 0) {
        newRole = "admin";
        console.log(
          "createOrUpdateUser: First user signup. Assigning 'admin' role."
        );
      }

      console.log(
        `createOrUpdateUser: Attempting to create new user with data: {clerkId: ${clerkId}, email: ${email}, role: ${newRole}}`
      );
      user = await User.create({
        clerkId,
        email,
        role: newRole,
      });
      console.log(
        `createOrUpdateUser: ✅ New user successfully created in MongoDB:`,
        user
      );
      return res
        .status(201)
        .json({ message: "User created successfully", user });
    }
  } catch (error) {
    console.error(
      "createOrUpdateUser: ❌ Error caught during user sync operation:",
      error
    );
    if (error.code === 11000) {
      console.error(
        `createOrUpdateUser: Duplicate key error (11000). Key Pattern:`,
        error.keyPattern
      );
      if (error.keyPattern && error.keyPattern.email) {
        return res
          .status(409)
          .json({ message: "A user with this email already exists." });
      }
      if (error.keyPattern && error.keyPattern.clerkId) {
        return res
          .status(409)
          .json({ message: "A user with this Clerk ID already exists." });
      }
    }
    res.status(500).json({ message: "Server error during user sync." });
  }
};

// @desc    Admin endpoint: Update user role and KYC status
// @route   PUT /api/admin/update-user/:id
// @access  Protected (requires authentication via requireAuth, and admin role check)
export const updateUserRoleAndKycStatus = async (req, res) => {
  const { id } = req.params; // This is the MongoDB _id of the user to update
  const { role, kycStatus } = req.body;

  try {
    const adminUser = req.user; // Assuming req.user is the authenticated admin
    if (!adminUser || adminUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    const userToUpdate = await User.findById(id).populate("kycApplication");
    if (!userToUpdate) {
      return res.status(404).json({ message: "User to update not found." });
    }

    // Update role
    if (role) {
      if (!["customer", "driver", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified." });
      }
      userToUpdate.role = role;
    }

    // Update KYC status for User model and linked Kyc document
    if (kycStatus) {
      if (!["pending", "approved", "rejected"].includes(kycStatus)) {
        return res
          .status(400)
          .json({ message: "Invalid KYC status specified." });
      }
      userToUpdate.kycStatus = kycStatus; // Update status on User model

      // If a KYC application exists, update its status too
      if (userToUpdate.kycApplication) {
        const kycDoc = await Kyc.findById(userToUpdate.kycApplication._id);
        if (kycDoc) {
          kycDoc.status = kycStatus;
          await kycDoc.save();
        }
      }

      // Special handling if KYC is rejected
      if (kycStatus === "rejected") {
        // Optionally revert role to customer if KYC is rejected
        userToUpdate.role = "customer";
        // You could also consider unsetting userToUpdate.kycApplication = null;
        // or setting userToUpdate.kycStatus = 'not_submitted'; if they need to reapply fully.
        // For now, we keep status as 'rejected' and allow re-submission to update it.
      }
    }

    await userToUpdate.save();
    res.json({ message: "User updated successfully", user: userToUpdate });
  } catch (error) {
    console.error("Error updating user role/KYC status:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// @desc    Allows a customer to apply to become a driver (initial application)
// @route   POST /api/user/apply-as-driver
// @access  Protected (requires authentication via requireAuth)
export const applyAsDriver = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user._id) {
      return res
        .status(404)
        .json({ message: "User not found or not fully synced." });
    }

    // --- ADDED LOGS HERE ---
    console.log(
      "applyAsDriver: User role BEFORE update:",
      user.role,
      "Clerk ID:",
      user.clerkId
    );
    // --- END ADDED LOGS ---

    if (user.role !== "customer") {
      return res
        .status(400)
        .json({ message: "Only customers can apply to become drivers." });
    }

    // If user already has a pending KYC, prevent re-application
    if (user.kycStatus === "pending") {
      return res.status(400).json({
        message:
          "You already have a pending KYC application. Please await review or submit details if prompted.",
      });
    }
    // If user already has an approved KYC, prevent re-application
    if (user.kycStatus === "approved") {
      return res
        .status(400)
        .json({ message: "Your KYC is already approved. You are a driver." });
    }

    // Set user's role to driver (temporarily until KYC is approved/rejected)
    // and kycStatus to pending.
    user.role = "driver";
    user.kycStatus = "pending";
    await user.save();

    // --- ADDED LOGS HERE ---
    console.log("applyAsDriver: User role AFTER save:", user.role);
    console.log("applyAsDriver: User object from DB after save:", user);
    // --- END ADDED LOGS ---

    res.status(200).json({
      message:
        "Application to become driver initiated. Please proceed to submit your KYC details.",
      user: user,
    });
  } catch (error) {
    // --- ADDED LOG HERE ---
    console.error("applyAsDriver: Error during processing:", error);
    // --- END ADDED LOG ---
    res
      .status(500)
      .json({ message: "Server error during driver application." });
  }
};

// @desc      Submit full KYC details and documents for a driver
// @route     POST /api/user/submit-kyc-details
// @access    Protected (requires authentication via requireAuth)
export const submitKycDetails = async (req, res) => {
  try {
    const user = req.user; // User document from requireAuth middleware

    if (!user || !user._id) {
      return res
        .status(404)
        .json({ message: "User not found or not authenticated." });
    }

    // Prevent submission if KYC is already approved
    if (user.kycStatus === "approved") {
      return res.status(400).json({
        message: "Your KYC application is already approved. Cannot resubmit.",
      });
    }

    // Ensure the user has started the application process (kycStatus is pending)
    // Or allow re-submission if it was rejected
    if (
      user.kycStatus !== "pending" &&
      user.kycStatus !== "rejected" &&
      user.kycStatus !== "not_submitted"
    ) {
      return res.status(400).json({
        message:
          "Invalid KYC status for submission. Please apply to be a driver first.",
      });
    }

    // Retrieve text fields from req.body
    const {
      fullName,
      phoneNumber,
      driverLicenseNumber,
      vehicleRegistrationNumber,
      idProofNumber,
    } = req.body;

    // Validate required text fields
    if (
      !fullName ||
      !phoneNumber ||
      !driverLicenseNumber ||
      !vehicleRegistrationNumber ||
      !idProofNumber
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required text fields for KYC." });
    }

    // Ensure files are present from multer middleware (req.files)
    const requiredFiles = [
      "driverLicenseFile",
      "vehicleRegistrationFile",
      "idProofFile",
    ];
    const uploadedFileKeys = Object.keys(req.files || {});
    const missingFiles = requiredFiles.filter(
      (key) => !uploadedFileKeys.includes(key)
    );

    if (missingFiles.length > 0) {
      return res.status(400).json({
        message: `Missing required files: ${missingFiles.join(", ")}`,
      });
    }

    let driverLicenseUrl, vehicleRegistrationUrl, idProofUrl;

    // Upload files to Cloudinary
    try {
      // --- !!! CRITICAL DEBUG LOGS ADDED HERE !!! ---
      console.log("--------------------------------------------------");
      console.log("DEBUG: Cloudinary config BEFORE uploader.upload:");
      console.log("DEBUG: cloud_name:", cloudinary.config().cloud_name);
      console.log(
        "DEBUG: api_key:",
        cloudinary.config().api_key ? "API_KEY_IS_SET" : "API_KEY_UNDEFINED"
      );
      console.log(
        "DEBUG: api_secret:",
        cloudinary.config().api_secret
          ? "API_SECRET_IS_SET"
          : "API_SECRET_UNDEFINED"
      );
      console.log("--------------------------------------------------");
      // --- !!! END CRITICAL DEBUG LOGS !!! ---

      const uploadPromises = [];
      const uploadedUrls = {};

      for (const key of requiredFiles) {
        const file = req.files[key][0]; // Multer stores single file for a field as an array of 1 object
        if (file) {
          uploadPromises.push(
            cloudinary.uploader
              .upload(file.buffer.toString("base64"), {
                resource_type: "auto", // auto-detect file type
                folder: `rideeasy/kyc_documents/${user.clerkId}`, // Organize by user's Clerk ID
                public_id: `${key}_${Date.now()}`, // Unique public ID
              })
              .then((result) => {
                uploadedUrls[key.replace("File", "Url")] = result.secure_url; // Convert 'driverLicenseFile' to 'driverLicenseUrl'
              })
          );
        }
      }

      await Promise.all(uploadPromises);

      driverLicenseUrl = uploadedUrls.driverLicenseUrl;
      vehicleRegistrationUrl = uploadedUrls.vehicleRegistrationUrl;
      idProofUrl = uploadedUrls.idProofUrl; // This has a lowercase 'i'

      // --- IMPORTANT: Double check the above line: idProofUrl = uploadedUrls.DproofUrl;
      // It should be: idProofUrl = uploadedUrls.idProofUrl;
      // If you find 'DproofUrl' in your original, change it to 'idProofUrl'.
      // I've fixed it in this provided code.
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      return res
        .status(500)
        .json({ message: "Failed to upload documents to Cloudinary." });
    }

    let kycApplication;
    // Check if a KYC application already exists for this user (e.g., rejected or initial pending)
    if (user.kycApplication) {
      kycApplication = await Kyc.findById(user.kycApplication);
      if (kycApplication) {
        // Update existing KYC application
        kycApplication.fullName = fullName;
        kycApplication.phoneNumber = phoneNumber;
        kycApplication.email = user.email; // Get email from User model
        kycApplication.driverLicenseUrl = driverLicenseUrl;
        kycApplication.driverLicenseNumber = driverLicenseNumber;
        kycApplication.vehicleRegistrationUrl = vehicleRegistrationUrl;
        kycApplication.vehicleRegistrationNumber = vehicleRegistrationNumber;
        kycApplication.idProofUrl = idProofUrl;
        kycApplication.idProofNumber = idProofNumber;
        kycApplication.status = "pending"; // Reset status to pending on resubmission
        await kycApplication.save();
      } else {
        // KYC application ID exists in User but the document is not found. Create a new one.
        // This can happen if a document was manually deleted from DB.
        console.warn(
          `User ${user._id} has kycApplication ref ${user.kycApplication} but Kyc document not found. Creating new.`
        );
        kycApplication = await Kyc.create({
          userId: user._id,
          clerkId: user.clerkId,
          fullName,
          phoneNumber,
          email: user.email,
          driverLicenseUrl,
          driverLicenseNumber,
          vehicleRegistrationUrl,
          vehicleRegistrationNumber,
          idProofUrl,
          idProofNumber,
          status: "pending",
        });
        user.kycApplication = kycApplication._id; // Link the new Kyc to User
      }
    } else {
      // No existing KYC application, create a new one
      kycApplication = await Kyc.create({
        userId: user._id,
        clerkId: user.clerkId,
        fullName,
        phoneNumber,
        email: user.email,
        driverLicenseUrl,
        driverLicenseNumber,
        vehicleRegistrationUrl,
        vehicleRegistrationNumber,
        idProofUrl,
        idProofNumber,
        status: "pending",
      });
      user.kycApplication = kycApplication._id; // Link to User
    }

    user.kycStatus = "pending"; // Update user's kycStatus to pending on successful submission
    await user.save();

    res.status(200).json({
      message: "KYC details and documents submitted successfully for review.",
      kycApplication,
    });
  } catch (error) {
    console.error("Error submitting KYC details:", error);
    res.status(500).json({ message: "Server error during KYC submission." });
  }
}; // @desc    Admin endpoint: Get all users with populated KYC applications
// @route   GET /api/admin/users-with-kyc
// @access  Protected (admin role)
export const getAllUsersWithKyc = async (req, res) => {
  try {
    const adminUser = req.user;
    if (!adminUser || adminUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    // Find users who have a kycApplication reference and populate it
    const users = await User.find({ kycApplication: { $ne: null } })
      .populate("kycApplication")
      .select("-password"); // Exclude password if it exists (good practice, though not in your current model)

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users with KYC applications:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};
