// frontend/src/hooks/useUserSync.js
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const useUserSync = () => {
  const { isSignedIn, userId, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [userRole, setUserRole] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const createOrUpdateUserInDb = async () => {
      if (isSignedIn && clerkUser) {
        setIsUserLoading(true);
        setError(null);
        try {
          const token = await getToken();
          const requestBody = {
            email: clerkUser.emailAddresses[0].emailAddress,
          };
          console.log("useUserSync: Sending request to backend."); // LOG F1
          console.log(
            "useUserSync: Request URL:",
            `${backendUrl}/api/user/create-or-update` // <--- CORRECTED URL HERE
          ); // LOG F2
          console.log("useUserSync: Request Body:", requestBody); // LOG F3
          console.log(
            "useUserSync: Authorization Token (first few chars):",
            token ? token.substring(0, 30) + "..." : "No token"
          ); // LOG F4

          const response = await axios.post(
            `${backendUrl}/api/user/create-or-update`, // <--- THIS IS THE KEY CHANGE
            requestBody,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("useUserSync: Backend response received:", response.data); // LOG F5
          setUserRole(response.data.user.role);
          setKycStatus(response.data.user.kycStatus);
          console.log("✅ User created/updated in DB:", response.data.user);
        } catch (err) {
          console.error(
            "❌ Error creating/updating user in DB:",
            err.response ? err.response.data : err.message
          ); // LOG F6 - Log full error
          setError("Failed to load user profile. Please try again.");
          setUserRole(null);
          setKycStatus(null);
        } finally {
          setIsUserLoading(false);
        }
      } else if (!isSignedIn) {
        setUserRole(null);
        setKycStatus(null);
        setError(null);
        setIsUserLoading(false);
        console.log("useUserSync: User signed out or not signed in."); // LOG F7
      }
    };

    createOrUpdateUserInDb();
  }, [isSignedIn, clerkUser, userId, getToken]);

  return { userRole, kycStatus, isUserLoading, setKycStatus, error };
};

export default useUserSync;
