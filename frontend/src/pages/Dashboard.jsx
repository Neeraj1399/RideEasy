// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
// import axios from "axios";
import DriverRides from "./DriverRides"; // Import the DriverRides component

// const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Dashboard = ({ userRole, kycStatus }) => {
  const { user: clerkUser } = useUser();
  // const { getToken } = useAuth();

  if (!clerkUser) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {clerkUser.fullName}!
      </h1>
      <p className="text-lg mb-4">
        Your Role:{" "}
        <span className="font-semibold capitalize">
          {userRole || "Loading..."}
        </span>
      </p>
      {(userRole === "customer" || userRole === "driver") && (
        <p className="text-lg mb-4">
          KYC Status:{" "}
          <span
            className={`font-semibold capitalize ${
              kycStatus === "approved"
                ? "text-green-600"
                : kycStatus === "pending"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {kycStatus || "Not Submitted"}
          </span>
        </p>
      )}

      {userRole === "customer" && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Customer Actions</h2>
          <Link
            to="/available-rides" // Removed the comment here
            className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600"
          >
            Find Available Rides
          </Link>
          <Link
            to="/my-joined-rides" // Removed the comment here
            className="bg-purple-500 text-white px-5 py-2 rounded-md hover:bg-purple-600 ml-4"
          >
            My Joined Rides
          </Link>
          {kycStatus !== "approved" && (
            <p className="mt-4 text-gray-600">
              Consider applying for KYC if you wish to become a driver.
            </p>
          )}
        </div>
      )}

      {userRole === "driver" && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Driver Actions</h2>
          {kycStatus === "approved" ? (
            <>
              <Link
                to="/create-ride" // Removed the comment here
                className="bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-600 mr-4"
              >
                Create a New Ride
              </Link>
              <div className="mt-6">
                <DriverRides />
              </div>
            </>
          ) : (
            <p className="text-red-600">
              Your KYC application is {kycStatus}. You cannot create rides until
              it's approved.
            </p>
          )}
          {kycStatus !== "approved" && (
            <div className="mt-4">
              <Link
                to="/kyc"
                className="bg-yellow-500 text-white px-5 py-2 rounded-md hover:bg-yellow-600"
              >
                Go to KYC Application
              </Link>
            </div>
          )}
        </div>
      )}

      {userRole === "admin" && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Admin Actions</h2>
          <Link
            to="/admin/dashboard"
            className="bg-purple-500 text-white px-5 py-2 rounded-md hover:bg-purple-600"
          >
            Go to Admin Panel
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
