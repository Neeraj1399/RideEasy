// frontend/src/components/ProtectedRoute.jsx
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

// Accept isUserLoading as a prop
const ProtectedRoute = ({ children, isUserLoading }) => {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // Only redirect if Clerk is loaded AND user is NOT signed in
    if (isLoaded && !isSignedIn) {
      window.location.href = "/sign-in"; // Redirect to Clerk's sign-in page
    }
  }, [isLoaded, isSignedIn]);

  // If Clerk is not loaded, show a loading message for auth
  if (!isLoaded) {
    return (
      <div className="text-center py-8 text-gray-700">
        Loading authentication...
      </div>
    );
  }

  // If user is not signed in after Clerk is loaded, do not render children (redirection handles this)
  if (!isSignedIn) {
    return null;
  }

  // NEW: Wait for useUserSync to finish loading (i.e., user data is synced to DB)
  if (isUserLoading) {
    return (
      <div className="text-center py-8 text-gray-700">
        Synchronizing user data... Please wait.
      </div>
    );
  }

  // If signed in and user data is loaded/synced, render the child component
  return children;
};

export default ProtectedRoute;
