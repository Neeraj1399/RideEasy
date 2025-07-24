// frontend/src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MainRoutes from "./routes/MainRoutes";
import useUserSync from "./hooks/useUserSync";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Publishable Key from Clerk. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file."
  );
}

function AppContent() {
  const { userRole, kycStatus, isUserLoading, error, setKycStatus } =
    useUserSync();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar userRole={userRole} kycStatus={kycStatus} />

      <main className="flex-grow container mx-auto p-4">
        {isUserLoading ? (
          <div className="text-center py-8 text-gray-700">
            Initializing user data...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error: {error}</div>
        ) : (
          <MainRoutes
            userRole={userRole}
            kycStatus={kycStatus}
            setKycStatus={setKycStatus}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
