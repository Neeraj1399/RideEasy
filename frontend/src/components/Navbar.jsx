// frontend/src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { UserButton, useAuth } from "@clerk/clerk-react";

const Navbar = ({ userRole, kycStatus }) => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          RideEasy
        </Link>
        <ul className="flex space-x-4">
          {isSignedIn ? (
            <>
              <li>
                <Link to="/dashboard" className="hover:text-gray-300">
                  Dashboard
                </Link>
              </li>
              {userRole === "customer" && (
                <li>
                  <Link to="/rides/available" className="hover:text-gray-300">
                    Find a Ride
                  </Link>
                </li>
              )}
              {userRole === "driver" && kycStatus === "approved" && (
                <li>
                  <Link to="/rides/create" className="hover:text-gray-300">
                    Create Ride
                  </Link>
                </li>
              )}
              {userRole === "admin" && (
                <li>
                  <Link to="/admin/dashboard" className="hover:text-gray-300">
                    Admin Panel
                  </Link>
                </li>
              )}
              {(userRole === "customer" || userRole === "driver") &&
                kycStatus !== "approved" && (
                  <li>
                    <Link to="/kyc" className="hover:text-gray-300">
                      KYC Application
                    </Link>
                  </li>
                )}
              <li>
                <UserButton afterSignOutUrl="/" />
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/sign-in" className="hover:text-gray-300">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/sign-up" className="hover:text-gray-300">
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
