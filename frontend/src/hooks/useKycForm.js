// frontend/src/hooks/useKycForm.js
import { useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

const useKycForm = () => {
  const { user } = useUser(); // Get Clerk user for initial email/name

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phoneNumber: "",
    email: user?.emailAddresses[0]?.emailAddress || "", // Initialize email here
    driverLicenseNumber: "",
    vehicleRegistrationNumber: "",
    idProofNumber: "",
    driverLicenseFile: null,
    vehicleRegistrationFile: null,
    idProofFile: null,
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  }, []);

  const handleFileChange = useCallback((e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setValidationErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.fullName) errors.fullName = "Full Name is required.";
    if (!formData.phoneNumber) errors.phoneNumber = "Phone Number is required.";
    // Basic phone number format check
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = "Phone Number must be 10 digits.";
    }
    if (!formData.driverLicenseNumber)
      errors.driverLicenseNumber = "Driver's License Number is required.";
    if (!formData.vehicleRegistrationNumber)
      errors.vehicleRegistrationNumber =
        "Vehicle Registration Number is required.";
    if (!formData.idProofNumber)
      errors.idProofNumber = "ID Proof Number is required.";
    if (!formData.driverLicenseFile)
      errors.driverLicenseFile = "Driver's License file is required.";
    if (!formData.vehicleRegistrationFile)
      errors.vehicleRegistrationFile = "Vehicle Registration file is required.";
    if (!formData.idProofFile)
      errors.idProofFile = "ID Proof file is required.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  return {
    formData,
    handleChange,
    handleFileChange,
    validateForm,
    validationErrors,
    setFormData, // Expose setFormData if you need to pre-fill dynamically
  };
};

export default useKycForm;
