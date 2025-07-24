// frontend/src/routes/MainRoutes.jsx
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignIn, SignUp } from "@clerk/clerk-react";

// Pages
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import KycApplication from "../pages/KycApplication";
import CreateRide from "../pages/CreateRide";
import AvailableRides from "../pages/AvailableRides";
import AdminDashboard from "../pages/AdminDashboard";

// Components
import ProtectedRoute from "../components/ProtectedRoute";

const MainRoutes = ({ userRole, kycStatus, setKycStatus, isUserLoading }) => {
  // Accept isUserLoading prop
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Clerk Auth Routes - these handle their own UI */}
      <Route
        path="/sign-in/*"
        element={<SignIn routing="path" path="/sign-in" />}
      />
      <Route
        path="/sign-up/*"
        element={<SignUp routing="path" path="/sign-up" />}
      />

      {/* Protected routes - now wait for useUserSync */}
      <Route
        path="/dashboard"
        element={
          <SignedIn>
            {/* Pass isUserLoading to ProtectedRoute */}
            <ProtectedRoute isUserLoading={isUserLoading}>
              <Dashboard userRole={userRole} kycStatus={kycStatus} />
            </ProtectedRoute>
          </SignedIn>
        }
      />

      <Route
        path="/kyc"
        element={
          <SignedIn>
            <ProtectedRoute isUserLoading={isUserLoading}>
              <KycApplication
                userRole={userRole}
                kycStatus={kycStatus}
                setKycStatus={setKycStatus}
              />
            </ProtectedRoute>
          </SignedIn>
        }
      />

      <Route
        path="/rides/create"
        element={
          <SignedIn>
            <ProtectedRoute isUserLoading={isUserLoading}>
              <CreateRide />
            </ProtectedRoute>
          </SignedIn>
        }
      />

      <Route
        path="/rides/available"
        element={
          <SignedIn>
            <ProtectedRoute isUserLoading={isUserLoading}>
              <AvailableRides />
            </ProtectedRoute>
          </SignedIn>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <SignedIn>
            <ProtectedRoute isUserLoading={isUserLoading}>
              <AdminDashboard />
            </ProtectedRoute>
          </SignedIn>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default MainRoutes;
