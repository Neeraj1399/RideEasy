// backend/middlewares/authMiddleware.js
// No need to import ClerkExpressRequireAuth here, as it's handled in app.js
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  // At this point, ClerkExpressRequireAuth (from app.js) has already run.
  // If it passed, req.auth and req.auth.userId will be available.
  // If it failed authentication, this middleware would not even be reached
  // (ClerkExpressRequireAuth would have sent a 401/403).

  if (!req.auth || !req.auth.userId) {
    // This scenario should ideally not happen if ClerkExpressRequireAuth is working as expected.
    // It's a safeguard, just in case.
    console.error(
      "Auth Middleware (simplified): req.auth or userId missing unexpectedly."
    );
    return res
      .status(401)
      .json({
        message: "Unauthorized: Clerk authentication failed or missing.",
      });
  }

  const clerkUserId = req.auth.userId;
  const clerkUserEmail = req.auth.claims.email; // Access email from claims

  console.log(
    `Auth Middleware (simplified): Authenticated Clerk User ID: ${clerkUserId}`
  );
  console.log(
    `Auth Middleware (simplified): Request Original URL: ${req.originalUrl}`
  );

  try {
    let user = await User.findOne({ clerkId: clerkUserId });

    const isCreateOrUpdatePath =
      req.originalUrl === "/api/user/create-or-update"; // Use /api/user/ here

    if (!user) {
      console.log(
        `Auth Middleware (simplified): User NOT found in DB for Clerk ID ${clerkUserId}`
      );
      if (!isCreateOrUpdatePath) {
        console.log(
          "Auth Middleware (simplified): User not found in DB and NOT the create/update path. Returning 404."
        );
        return res.status(404).json({
          message:
            "User not found in application database. Please ensure signup/signin syncs your profile.",
        });
      }
      // If it IS the create/update path and user not found, that's expected.
      // Set req.user to a partial object for the createOrUpdateUser controller to handle.
      req.user = {
        clerkId: clerkUserId,
        email: clerkUserEmail,
        isNewUser: true,
      }; // Add isNewUser flag
      console.log(
        "Auth Middleware (simplified): Setting partial req.user for new user creation."
      );
    } else {
      console.log(
        `Auth Middleware (simplified): User found in DB for Clerk ID ${clerkUserId}`
      );
      req.user = user; // Attach the full Mongoose user document
    }

    console.log(
      `Auth Middleware (simplified): req.user set. Proceeding to next middleware/controller.`
    );
    next(); // Proceed to the next middleware or route handler
  } catch (dbError) {
    console.error(
      "Auth Middleware (simplified): Database lookup error:",
      dbError
    );
    return res
      .status(500)
      .json({ message: "Server error during user lookup." });
  }
};

// New Middleware: Checks if the authenticated user has an 'admin' role
export const adminAuth = (req, res, next) => {
  // req.user should be populated by the preceding requireAuth middleware
  if (req.user && req.user.role === "admin") {
    next(); // User is an admin, proceed to the next handler
  } else {
    // If user is not authenticated or not an admin
    res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
};
