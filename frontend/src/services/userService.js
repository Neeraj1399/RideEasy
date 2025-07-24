// frontend/src/services/userService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Sends a request to apply as a driver.
 * This primarily updates the user's role to 'driver' and kycStatus to 'pending' in the DB.
 * @param {string} token - The Clerk authentication token.
 */
export const applyAsDriverService = async (token) => {
  // <-- MODIFIED: Added 'token' parameter
  try {
    const response = await axios.post(
      `${API_URL}/api/user/apply-as-driver`,
      {}, // No specific data needed for this endpoint as it uses req.user from authMiddleware
      {
        headers: {
          Authorization: `Bearer ${token}`, // <-- MODIFIED: Added Authorization header
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in applyAsDriverService:", error);
    // Re-throw to allow component to handle specific error messages
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to send driver application."
    );
  }
};

/**
 * Submits comprehensive KYC details, including text data and files.
 * This will require a new backend endpoint to process the data and upload files to Cloudinary.
 * @param {Object} kycData - An object containing text fields and file objects.
 * @param {string} token - The Clerk authentication token. // <-- MODIFIED: Added 'token' parameter for consistency and future proofing
 */
export const submitKycDetailsService = async (kycData, token) => {
  // <-- MODIFIED: Added 'token' parameter
  try {
    const formData = new FormData();

    // Append text fields
    formData.append("fullName", kycData.fullName);
    formData.append("phoneNumber", kycData.phoneNumber);
    formData.append("email", kycData.email);
    formData.append("driverLicenseNumber", kycData.driverLicenseNumber);
    formData.append(
      "vehicleRegistrationNumber",
      kycData.vehicleRegistrationNumber
    );
    formData.append("idProofNumber", kycData.idProofNumber);

    // Append file objects
    if (kycData.driverLicenseFile) {
      formData.append("driverLicenseFile", kycData.driverLicenseFile);
    }
    if (kycData.vehicleRegistrationFile) {
      formData.append(
        "vehicleRegistrationFile",
        kycData.vehicleRegistrationFile
      );
    }
    if (kycData.idProofFile) {
      formData.append("idProofFile", kycData.idProofFile);
    }

    const response = await axios.post(
      `${API_URL}/api/kyc/submit`, // <-- We will create this NEW backend endpoint soon
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Essential for sending files
          Authorization: `Bearer ${token}`, // <-- MODIFIED: Added Authorization header
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in submitKycDetailsService:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to submit KYC details."
    );
  }
};
