// // frontend/src/pages/KycApplication.jsx
// import React, { useState } from "react";
// import { useUser } from "@clerk/clerk-react";
// import { useNavigate } from "react-router-dom";
// import {
//   applyAsDriverService,
//   submitKycDetailsService,
// } from "../services/userService";
// import useKycForm from "../hooks/useKycForm"; // Import the custom hook

// const KycApplication = ({ userRole, kycStatus, setKycStatus }) => {
//   const { user } = useUser();
//   const navigate = useNavigate();

//   // Use the custom hook for form management
//   const {
//     formData,
//     handleChange,
//     handleFileChange,
//     validateForm,
//     validationErrors,
//   } = useKycForm();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccessMessage("");

//     // Validate the form using the hook's function
//     if (!validateForm()) {
//       setError("Please correct the errors in the form.");
//       setLoading(false);
//       return;
//     }

//     try {
//       // Step 1: Call the service to update user's role and kycStatus to 'pending'
//       console.log("Calling applyAsDriverService...");
//       const applyResponse = await applyAsDriverService();
//       console.log("applyAsDriverService response:", applyResponse);
//       setSuccessMessage(
//         applyResponse.message || "Driver application initiated."
//       );
//       setKycStatus("pending"); // Update KYC status in local state and context

//       // Step 2: Call the service to submit detailed KYC information and files
//       console.log("Calling submitKycDetailsService...");
//       const submitDetailsResponse = await submitKycDetailsService(formData);
//       console.log("submitKycDetailsService response:", submitDetailsResponse);
//       setSuccessMessage(
//         submitDetailsResponse.message ||
//           "KYC details and documents submitted successfully!"
//       );

//       // Redirect after successful submission
//       navigate("/dashboard");
//     } catch (err) {
//       console.error("Error during KYC application:", err);
//       // Use err directly as service re-throws message (or adjust based on your service's error handling)
//       setError(err || "Failed to submit application. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Conditional rendering based on userRole and kycStatus
//   const renderStatusMessage = () => {
//     if (userRole === "driver" || userRole === "admin") {
//       return (
//         <div className="text-center py-8">
//           <h2 className="text-2xl font-bold mb-4">
//             You are already a {userRole}.
//           </h2>
//           <p>No need to apply for KYC again.</p>
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Go to Dashboard
//           </button>
//         </div>
//       );
//     }

//     if (kycStatus === "pending") {
//       return (
//         <div className="text-center py-8">
//           <h2 className="text-2xl font-bold mb-4">
//             Your KYC Application is Pending Review.
//           </h2>
//           <p>
//             We will notify you once it's approved or if more information is
//             needed.
//           </p>
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Go to Dashboard
//           </button>
//         </div>
//       );
//     }

//     if (kycStatus === "approved") {
//       return (
//         <div className="text-center py-8">
//           <h2 className="text-2xl font-bold mb-4">
//             Your KYC Application is Approved!
//           </h2>
//           <p>You are now a verified driver.</p>
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Go to Dashboard
//           </button>
//         </div>
//       );
//     }
//     return null; // Render nothing if none of the above conditions met
//   };

//   // Render the form only if not already a driver/admin and KYC is not pending/approved
//   if (renderStatusMessage()) {
//     return renderStatusMessage();
//   }

//   return (
//     <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
//         Apply to Be a Driver (KYC)
//       </h2>

//       {error && <p className="text-red-600 text-center mb-4">{error}</p>}
//       {successMessage && (
//         <p className="text-green-600 text-center mb-4">{successMessage}</p>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* Full Name */}
//         <div>
//           <label
//             htmlFor="fullName"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Full Name
//           </label>
//           <input
//             type="text"
//             id="fullName"
//             name="fullName"
//             value={formData.fullName}
//             onChange={handleChange}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//           />
//           {validationErrors.fullName && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.fullName}
//             </p>
//           )}
//         </div>

//         {/* Phone Number */}
//         <div>
//           <label
//             htmlFor="phoneNumber"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Phone Number
//           </label>
//           <input
//             type="tel"
//             id="phoneNumber"
//             name="phoneNumber"
//             value={formData.phoneNumber}
//             onChange={handleChange}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//           />
//           {validationErrors.phoneNumber && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.phoneNumber}
//             </p>
//           )}
//         </div>

//         {/* Email (Pre-filled and disabled) */}
//         <div>
//           <label
//             htmlFor="email"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Email
//           </label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={formData.email}
//             readOnly
//             disabled
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
//           />
//         </div>

//         {/* Driver's License Number */}
//         <div>
//           <label
//             htmlFor="driverLicenseNumber"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Driver's License Number
//           </label>
//           <input
//             type="text"
//             id="driverLicenseNumber"
//             name="driverLicenseNumber"
//             value={formData.driverLicenseNumber}
//             onChange={handleChange}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//           />
//           {validationErrors.driverLicenseNumber && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.driverLicenseNumber}
//             </p>
//           )}
//         </div>

//         {/* Vehicle Registration Number */}
//         <div>
//           <label
//             htmlFor="vehicleRegistrationNumber"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Vehicle Registration Number
//           </label>
//           <input
//             type="text"
//             id="vehicleRegistrationNumber"
//             name="vehicleRegistrationNumber"
//             value={formData.vehicleRegistrationNumber}
//             onChange={handleChange}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//           />
//           {validationErrors.vehicleRegistrationNumber && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.vehicleRegistrationNumber}
//             </p>
//           )}
//         </div>

//         {/* ID Proof Number (e.g., Aadhaar) */}
//         <div>
//           <label
//             htmlFor="idProofNumber"
//             className="block text-sm font-medium text-gray-700"
//           >
//             ID Proof Number (e.g., Aadhaar)
//           </label>
//           <input
//             type="text"
//             id="idProofNumber"
//             name="idProofNumber"
//             value={formData.idProofNumber}
//             onChange={handleChange}
//             required
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//           />
//           {validationErrors.idProofNumber && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.idProofNumber}
//             </p>
//           )}
//         </div>

//         {/* File Uploads */}
//         <div>
//           <label
//             htmlFor="driverLicenseFile"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Upload Driver's License (PDF, JPG, PNG)
//           </label>
//           <input
//             type="file"
//             id="driverLicenseFile"
//             name="driverLicenseFile"
//             accept=".pdf,.jpg,.jpeg,.png"
//             onChange={handleFileChange}
//             required
//             className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//           />
//           {validationErrors.driverLicenseFile && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.driverLicenseFile}
//             </p>
//           )}
//         </div>

//         <div>
//           <label
//             htmlFor="vehicleRegistrationFile"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Upload Vehicle Registration (PDF, JPG, PNG)
//           </label>
//           <input
//             type="file"
//             id="vehicleRegistrationFile"
//             name="vehicleRegistrationFile"
//             accept=".pdf,.jpg,.jpeg,.png"
//             onChange={handleFileChange}
//             required
//             className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//           />
//           {validationErrors.vehicleRegistrationFile && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.vehicleRegistrationFile}
//             </p>
//           )}
//         </div>

//         <div>
//           <label
//             htmlFor="idProofFile"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Upload ID Proof (PDF, JPG, PNG)
//           </label>
//           <input
//             type="file"
//             id="idProofFile"
//             name="idProofFile"
//             accept=".pdf,.jpg,.jpeg,.png"
//             onChange={handleFileChange}
//             required
//             className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//           />
//           {validationErrors.idProofFile && (
//             <p className="text-red-500 text-xs mt-1">
//               {validationErrors.idProofFile}
//             </p>
//           )}
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//         >
//           {loading ? "Submitting..." : "Submit KYC Application"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default KycApplication;

// frontend/src/pages/KycApplication.jsx
import React, { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react"; // Make sure useAuth is imported
import { useNavigate } from "react-router-dom";
import {
  applyAsDriverService,
  submitKycDetailsService,
} from "../services/userService";
import useKycForm from "../hooks/useKycForm"; // Import the custom hook

const backendUrl = import.meta.env.VITE_BACKEND_URL; // Define backendUrl

const KycApplication = ({ userRole, kycStatus, setKycStatus }) => {
  const { user } = useUser();
  const { getToken } = useAuth(); // Get getToken here
  const navigate = useNavigate();

  // Add these console logs to see the props coming into the component
  console.log("KycApplication Component Mounted/Rendered:");
  console.log("  Prop userRole:", userRole);
  console.log("  Prop kycStatus:", kycStatus);

  // Use the custom hook for form management
  const {
    formData,
    handleChange,
    handleFileChange,
    validateForm,
    validationErrors,
  } = useKycForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // Validate the form using the hook's function
    if (!validateForm()) {
      setError("Please correct the errors in the form.");
      setLoading(false);
      return;
    }

    try {
      const token = await getToken(); // Obtain token before any service calls

      // Step 1: Call the service to update user's role and kycStatus to 'pending'
      console.log("KycApplication: Calling applyAsDriverService...");
      console.log(
        "KycApplication: URL for applyAsDriver:",
        `${backendUrl}/api/user/apply-as-driver`
      );
      console.log(
        "KycApplication: Token for applyAsDriver (first 30 chars):",
        token ? token.substring(0, 30) + "..." : "No token"
      );
      const applyResponse = await applyAsDriverService(token); // Pass token
      console.log(
        "KycApplication: applyAsDriverService response:",
        applyResponse
      );
      setSuccessMessage(
        applyResponse.message || "Driver application initiated."
      );
      setKycStatus("pending"); // Update KYC status in local state and context

      // Step 2: Call the service to submit detailed KYC information and files
      console.log("KycApplication: Calling submitKycDetailsService...");
      console.log(
        "KycApplication: URL for submitKycDetails:",
        `${backendUrl}/api/kyc/submit`
      );
      console.log(
        "KycApplication: Token for submitKycDetails (first 30 chars):",
        token ? token.substring(0, 30) + "..." : "No token"
      );
      const submitDetailsResponse = await submitKycDetailsService(
        formData,
        token
      ); // Pass formData and token
      console.log(
        "KycApplication: submitKycDetailsService response:",
        submitDetailsResponse
      );
      setSuccessMessage(
        submitDetailsResponse.message ||
          "KYC details and documents submitted successfully!"
      );

      // Redirect after successful submission
      navigate("/dashboard");
    } catch (err) {
      console.error("Error during KYC application:", err);
      // Ensure error message is extracted correctly for display
      setError(
        err.message || "Failed to submit application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Conditional rendering based on userRole and kycStatus
  const renderStatusMessage = () => {
    if (userRole === "driver" || userRole === "admin") {
      return (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">
            You are already a {userRole}.
          </h2>
          <p>No need to apply for KYC again.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    if (kycStatus === "pending") {
      return (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">
            Your KYC Application is Pending Review.
          </h2>
          <p>
            We will notify you once it's approved or if more information is
            needed.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    if (kycStatus === "approved") {
      return (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">
            Your KYC Application is Approved!
          </h2>
          <p>You are now a verified driver.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return null; // Render nothing if none of the above conditions met
  };

  // Render the form only if not already a driver/admin and KYC is not pending/approved
  if (renderStatusMessage()) {
    return renderStatusMessage();
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Apply to Be a Driver (KYC)
      </h2>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      {successMessage && (
        <p className="text-green-600 text-center mb-4">{successMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {validationErrors.fullName && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.fullName}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {validationErrors.phoneNumber && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.phoneNumber}
            </p>
          )}
        </div>

        {/* Email (Pre-filled and disabled) */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            readOnly
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
          />
        </div>

        {/* Driver's License Number */}
        <div>
          <label
            htmlFor="driverLicenseNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Driver's License Number
          </label>
          <input
            type="text"
            id="driverLicenseNumber"
            name="driverLicenseNumber"
            value={formData.driverLicenseNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {validationErrors.driverLicenseNumber && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.driverLicenseNumber}
            </p>
          )}
        </div>

        {/* Vehicle Registration Number */}
        <div>
          <label
            htmlFor="vehicleRegistrationNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Vehicle Registration Number
          </label>
          <input
            type="text"
            id="vehicleRegistrationNumber"
            name="vehicleRegistrationNumber"
            value={formData.vehicleRegistrationNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {validationErrors.vehicleRegistrationNumber && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.vehicleRegistrationNumber}
            </p>
          )}
        </div>

        {/* ID Proof Number (e.g., Aadhaar) */}
        <div>
          <label
            htmlFor="idProofNumber"
            className="block text-sm font-medium text-gray-700"
          >
            ID Proof Number (e.g., Aadhaar)
          </label>
          <input
            type="text"
            id="idProofNumber"
            name="idProofNumber"
            value={formData.idProofNumber}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {validationErrors.idProofNumber && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.idProofNumber}
            </p>
          )}
        </div>

        {/* File Uploads */}
        <div>
          <label
            htmlFor="driverLicenseFile"
            className="block text-sm font-medium text-gray-700"
          >
            Upload Driver's License (PDF, JPG, PNG)
          </label>
          <input
            type="file"
            id="driverLicenseFile"
            name="driverLicenseFile"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {validationErrors.driverLicenseFile && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.driverLicenseFile}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="vehicleRegistrationFile"
            className="block text-sm font-medium text-gray-700"
          >
            Upload Vehicle Registration (PDF, JPG, PNG)
          </label>
          <input
            type="file"
            id="vehicleRegistrationFile"
            name="vehicleRegistrationFile"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {validationErrors.vehicleRegistrationFile && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.vehicleRegistrationFile}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="idProofFile"
            className="block text-sm font-medium text-gray-700"
          >
            Upload ID Proof (PDF, JPG, PNG)
          </label>
          <input
            type="file"
            id="idProofFile"
            name="idProofFile"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {validationErrors.idProofFile && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.idProofFile}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? "Submitting..." : "Submit KYC Application"}
        </button>
      </form>
    </div>
  );
};

export default KycApplication;
