// frontend/src/pages/DriverRides.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import EditRideModal from "../components/EditRideModal"; // We'll create this component

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const DriverRides = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRide, setCurrentRide] = useState(null); // To store the ride being edited

  const fetchDriverRides = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      const response = await axios.get(
        `${backendUrl}/api/rides/driver/my-rides`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRides(response.data);
    } catch (err) {
      console.error("Error fetching driver's rides:", err);
      setError(err.response?.data?.message || "Failed to fetch your rides.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverRides();
  }, []); // Fetch rides on component mount

  const handleDelete = async (rideId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this ride? This action cannot be undone."
      )
    ) {
      return;
    }
    setMessage("");
    setError("");
    try {
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Ride deleted successfully!");
      // Remove the deleted ride from the state
      setRides(rides.filter((ride) => ride._id !== rideId));
    } catch (err) {
      console.error("Error deleting ride:", err);
      setError(
        err.response?.data?.message ||
          "Failed to delete ride. Please try again."
      );
    }
  };

  const handleEdit = (ride) => {
    setCurrentRide(ride);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentRide(null);
    fetchDriverRides(); // Re-fetch rides to show updated data after edit/cancel
  };

  if (loading) {
    return <div className="text-center mt-8">Loading your rides...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Your Created Rides
      </h1>

      {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
      {rides.length === 0 ? (
        <p className="text-center text-gray-600">
          You haven't created any rides yet.{" "}
          <button
            onClick={() => navigate("/create-ride")}
            className="text-indigo-600 hover:underline"
          >
            Create one now!
          </button>
        </p>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div
              key={ride._id}
              className="border p-4 rounded-lg shadow-sm bg-gray-50"
            >
              <p className="text-lg font-semibold">
                {ride.origin} to {ride.destination}
              </p>
              <p className="text-sm text-gray-600">
                Vehicle: {ride.vehicleType} | Space: {ride.availableSpace} |
                Price: Rs. {ride.price} | Distance: {ride.distanceKm} km
              </p>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={`font-medium ${
                    ride.status === "scheduled"
                      ? "text-blue-500"
                      : ride.status === "active"
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {ride.status}
                </span>
              </p>

              <h3 className="font-semibold mt-3 mb-1">Passenger Requests:</h3>
              {ride.passengers && ride.passengers.length > 0 ? (
                <ul className="list-disc list-inside ml-4">
                  {ride.passengers.map((passengerEntry) => (
                    <li
                      key={passengerEntry.user._id}
                      className="text-sm text-gray-700"
                    >
                      {passengerEntry.user.email} - Status:{" "}
                      <span
                        className={`font-medium ${
                          passengerEntry.status === "accepted"
                            ? "text-green-600"
                            : passengerEntry.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {passengerEntry.status}
                      </span>
                      {passengerEntry.status === "pending" && (
                        <span className="ml-2 space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                const token = await getToken();
                                await axios.put(
                                  `${backendUrl}/api/rides/${ride._id}/passengers/${passengerEntry.user._id}`,
                                  { status: "accepted" },
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                setMessage(
                                  `Accepted ${passengerEntry.user.email} for ride ${ride._id}.`
                                );
                                fetchDriverRides(); // Re-fetch to update status and available space
                              } catch (err) {
                                console.error(
                                  "Error accepting passenger:",
                                  err
                                );
                                setError(
                                  err.response?.data?.message ||
                                    "Failed to accept passenger."
                                );
                              }
                            }}
                            className="text-green-600 hover:text-green-800 text-xs font-semibold"
                          >
                            (Accept)
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const token = await getToken();
                                await axios.put(
                                  `${backendUrl}/api/rides/${ride._id}/passengers/${passengerEntry.user._id}`,
                                  { status: "rejected" },
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                setMessage(
                                  `Rejected ${passengerEntry.user.email} for ride ${ride._id}.`
                                );
                                fetchDriverRides(); // Re-fetch to update status
                              } catch (err) {
                                console.error(
                                  "Error rejecting passenger:",
                                  err
                                );
                                setError(
                                  err.response?.data?.message ||
                                    "Failed to reject passenger."
                                );
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold"
                          >
                            (Reject)
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 ml-4">
                  No passenger requests yet.
                </p>
              )}

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleEdit(ride)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(ride._id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <EditRideModal
          ride={currentRide}
          onClose={handleModalClose}
          onSuccess={handleModalClose} // Close and re-fetch on successful edit
        />
      )}
    </div>
  );
};

export default DriverRides;
