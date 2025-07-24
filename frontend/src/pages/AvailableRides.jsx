// frontend/src/pages/AvailableRides.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AvailableRides = () => {
  const { getToken } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`${backendUrl}/rides`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRides(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rides:", err);
        setError("Failed to load available rides.");
        setLoading(false);
      }
    };
    fetchRides();
  }, [getToken]);

  const handleJoinRide = async (rideId) => {
    setJoinMessage("");
    setJoinError("");
    try {
      const token = await getToken();
      const response = await axios.post(
        `${backendUrl}/rides/${rideId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setJoinMessage(response.data.message);
      // Optionally update the ride list to reflect reduced available space or joined status
      setRides((prevRides) =>
        prevRides.map(
          (ride) =>
            ride._id === rideId
              ? {
                  ...ride,
                  availableSpace: ride.availableSpace - 1,
                  passengers: [...ride.passengers, "YOU"],
                }
              : ride // Simplified 'YOU'
        )
      );
    } catch (err) {
      console.error("Error joining ride:", err);
      setJoinError(err.response?.data?.message || "Failed to join ride.");
    }
  };

  if (loading) return <div className="text-center py-10">Loading rides...</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Available Rides Near You
      </h1>
      {rides.length === 0 ? (
        <p className="text-center text-gray-600">
          No rides currently available. Check back later!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => (
            <div
              key={ride._id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
              <h2 className="text-xl font-semibold mb-2">
                {ride.origin} to {ride.destination}
              </h2>
              <p className="text-gray-700 mb-1">
                Vehicle Type:{" "}
                <span className="capitalize">{ride.vehicleType}</span>
              </p>
              <p className="text-gray-700 mb-1">
                Available Space: {ride.availableSpace}
              </p>
              <p className="text-gray-700 mb-4">
                Price: ${ride.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Driver: {ride.driver ? ride.driver.email : "N/A"}
              </p>

              {ride.availableSpace > 0 ? (
                <button
                  onClick={() => handleJoinRide(ride._id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={
                    ride.availableSpace <= 0 ||
                    (ride.passengers && ride.passengers.includes("YOU"))
                  } // Simple check
                >
                  {ride.passengers && ride.passengers.includes("YOU")
                    ? "Already Joined"
                    : "Join Ride"}
                </button>
              ) : (
                <p className="text-red-500">No space available</p>
              )}
            </div>
          ))}
        </div>
      )}
      {joinMessage && (
        <p className="mt-4 text-green-600 text-center">{joinMessage}</p>
      )}
      {joinError && (
        <p className="mt-4 text-red-600 text-center">{joinError}</p>
      )}
    </div>
  );
};

export default AvailableRides;
