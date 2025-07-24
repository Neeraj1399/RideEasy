// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Dashboard = ({ userRole, kycStatus }) => {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const [driverRides, setDriverRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [errorRides, setErrorRides] = useState(null);

  useEffect(() => {
    const fetchDriverRides = async () => {
      if (userRole === "driver" && kycStatus === "approved") {
        setLoadingRides(true);
        try {
          const token = await getToken();
          const response = await axios.get(`${backendUrl}/rides/driver`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDriverRides(response.data);
        } catch (error) {
          console.error("Error fetching driver rides:", error);
          setErrorRides("Failed to fetch your rides.");
        } finally {
          setLoadingRides(false);
        }
      }
    };

    fetchDriverRides();
  }, [userRole, kycStatus, getToken]);

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
            to="/rides/available"
            className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600"
          >
            Find Available Rides
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
                to="/rides/create"
                className="bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-600 mr-4"
              >
                Create a New Ride
              </Link>
              <h3 className="text-xl font-semibold mt-6 mb-3">Your Rides</h3>
              {loadingRides && <p>Loading your rides...</p>}
              {errorRides && <p className="text-red-500">{errorRides}</p>}
              {!loadingRides && driverRides.length === 0 && (
                <p>You haven't created any rides yet.</p>
              )}
              {!loadingRides && driverRides.length > 0 && (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driverRides.map((ride) => (
                    <li
                      key={ride._id}
                      className="bg-white p-4 rounded-lg shadow-md"
                    >
                      <h4 className="font-bold text-lg">
                        {ride.origin} to {ride.destination}
                      </h4>
                      <p>Vehicle: {ride.vehicleType}</p>
                      <p>Space: {ride.availableSpace}</p>
                      <p>Price: ${ride.price}</p>
                      <p>
                        Status:{" "}
                        <span className="capitalize">{ride.status}</span>
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <Link
                          to={`/rides/edit/${ride._id}`}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </Link>
                        {/* Implement delete functionality here */}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
