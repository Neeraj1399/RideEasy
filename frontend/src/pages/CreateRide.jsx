// frontend/src/pages/CreateRide.jsx
import React, { useState, useEffect, useRef, useCallback } from "react"; // Add useCallback
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { getAddressSuggestions } from "../services/geocodingService"; // Import the service
import { getDistance } from "geolib"; // Import getDistance from geolib

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Define a base rate per kilometer
// You might want to fetch this from backend or make it configurable
const RATES_PER_KM = {
  "two-wheeler": 5, // Rs. 5 per km
  car: 12, // Rs. 12 per km
  truck: 25, // Rs. 25 per km (example, adjust as needed)
};

const CreateRide = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    origin: "",
    originCoords: null, // New state for origin coordinates {lat, lon}
    destination: "",
    destinationCoords: null, // New state for destination coordinates {lat, lon}
    vehicleType: "two-wheeler",
    availableSpace: 1,
    price: 0, // This will be calculated, but user might adjust
    distanceKm: 0, // New state for calculated distance
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // States for autocomplete suggestions
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  // Refs for debouncing timeouts
  const originTimeoutRef = useRef(null);
  const destinationTimeoutRef = useRef(null);

  // --- Price Calculation Logic ---
  const calculatePrice = useCallback(() => {
    if (formData.distanceKm > 0 && formData.vehicleType) {
      const rate =
        RATES_PER_KM[formData.vehicleType] || RATES_PER_KM["two-wheeler"]; // Fallback rate
      const calculatedPrice = (formData.distanceKm * rate).toFixed(2); // Keep 2 decimal places
      setFormData((prev) => ({ ...prev, price: parseFloat(calculatedPrice) }));
    } else {
      setFormData((prev) => ({ ...prev, price: 0 }));
    }
  }, [formData.distanceKm, formData.vehicleType]);

  // Effect to recalculate price when relevant data changes
  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  // --- Distance Calculation Logic ---
  const calculateDistance = useCallback(() => {
    if (formData.originCoords && formData.destinationCoords) {
      try {
        const distMeters = getDistance(
          {
            latitude: formData.originCoords.lat,
            longitude: formData.originCoords.lon,
          },
          {
            latitude: formData.destinationCoords.lat,
            longitude: formData.destinationCoords.lon,
          }
        );
        const distKm = distMeters / 1000; // Convert meters to kilometers
        setFormData((prev) => ({
          ...prev,
          distanceKm: parseFloat(distKm.toFixed(2)),
        }));
      } catch (e) {
        console.error("Error calculating distance:", e);
        setFormData((prev) => ({ ...prev, distanceKm: 0, price: 0 }));
      }
    } else {
      setFormData((prev) => ({ ...prev, distanceKm: 0, price: 0 }));
    }
  }, [formData.originCoords, formData.destinationCoords]);

  // Effect to recalculate distance when coords change
  useEffect(() => {
    calculateDistance();
  }, [calculateDistance]);

  // --- Handle changes for origin and destination with debouncing ---
  const handleOriginInputChange = async (e) => {
    const value = e.target.value;
    // Reset coords and distance/price if origin input changes
    setFormData((prev) => ({
      ...prev,
      origin: value,
      originCoords: null,
      distanceKm: 0,
      price: 0,
    }));
    if (originTimeoutRef.current) {
      clearTimeout(originTimeoutRef.current);
    }
    originTimeoutRef.current = setTimeout(async () => {
      const suggestions = await getAddressSuggestions(value);
      setOriginSuggestions(suggestions);
    }, 500); // Debounce for 500ms
  };

  const handleDestinationInputChange = async (e) => {
    const value = e.target.value;
    // Reset coords and distance/price if destination input changes
    setFormData((prev) => ({
      ...prev,
      destination: value,
      destinationCoords: null,
      distanceKm: 0,
      price: 0,
    }));
    if (destinationTimeoutRef.current) {
      clearTimeout(destinationTimeoutRef.current);
    }
    destinationTimeoutRef.current = setTimeout(async () => {
      const suggestions = await getAddressSuggestions(value);
      setDestinationSuggestions(suggestions);
    }, 500); // Debounce for 500ms
  };

  // --- Select a suggestion ---
  const selectOriginSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      origin: suggestion.displayName,
      originCoords: { lat: suggestion.lat, lon: suggestion.lon },
    }));
    setOriginSuggestions([]); // Clear suggestions after selection
  };

  const selectDestinationSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      destination: suggestion.displayName,
      destinationCoords: { lat: suggestion.lat, lon: suggestion.lon },
    }));
    setDestinationSuggestions([]); // Clear suggestions after selection
  };

  // --- Handle changes for other form fields (vehicleType, availableSpace, manual price adjust) ---
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Special handling for price to allow manual override but still show calculated as default
    if (name === "price") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value), // Allow user to directly set price
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? parseFloat(value) : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Basic validation to ensure coordinates are selected
    if (!formData.originCoords || !formData.destinationCoords) {
      setError(
        "Please select both origin and destination from the suggestions."
      );
      setLoading(false);
      return;
    }
    if (formData.distanceKm <= 0) {
      setError(
        "Invalid ride distance. Please ensure origin and destination are distinct and valid."
      );
      setLoading(false);
      return;
    }
    if (formData.price <= 0) {
      setError("Ride price cannot be zero. Please adjust if necessary.");
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(`${backendUrl}/api/rides`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(response.data.message);
      setError("");
      // Reset form including coordinates and calculated fields
      setFormData({
        origin: "",
        originCoords: null,
        destination: "",
        destinationCoords: null,
        vehicleType: "two-wheeler",
        availableSpace: 1,
        price: 0,
        distanceKm: 0, // Reset distance as well
      });
      setOriginSuggestions([]); // Clear any lingering suggestions
      setDestinationSuggestions([]);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("Error creating ride:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create ride. Please try again."
      );
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a New Ride</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="origin"
            className="block text-sm font-medium text-gray-700"
          >
            Origin
          </label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleOriginInputChange} // Use new handler for autocomplete
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
            autoComplete="off" // Disable browser's built-in autocomplete
          />
          {/* Origin Suggestions List */}
          {originSuggestions.length > 0 && (
            <ul className="border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto bg-white z-10 relative">
              {originSuggestions.map((sug, index) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-100 text-sm"
                  onClick={() => selectOriginSuggestion(sug)}
                >
                  {sug.displayName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="destination"
            className="block text-sm font-medium text-gray-700"
          >
            Destination
          </label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleDestinationInputChange} // Use new handler for autocomplete
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
            autoComplete="off"
          />
          {/* Destination Suggestions List */}
          {destinationSuggestions.length > 0 && (
            <ul className="border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto bg-white z-10 relative">
              {destinationSuggestions.map((sug, index) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-100 text-sm"
                  onClick={() => selectDestinationSuggestion(sug)}
                >
                  {sug.displayName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="vehicleType"
            className="block text-sm font-medium text-gray-700"
          >
            Vehicle Type
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange} // This will now trigger price recalculation via useEffect
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value="two-wheeler">Two-wheeler</option>
            <option value="car">Car</option>
            <option value="truck">Truck</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="availableSpace"
            className="block text-sm font-medium text-gray-700"
          >
            Available Space
          </label>
          <input
            type="number"
            id="availableSpace"
            name="availableSpace"
            value={formData.availableSpace}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        {/* Display Calculated Distance */}
        {formData.distanceKm > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Calculated Distance
            </label>
            <p className="mt-1 text-lg font-semibold text-indigo-700">
              {formData.distanceKm} km
            </p>
          </div>
        )}

        {/* Price Input - now populates automatically but can be overridden */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Price (Rs.)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange} // Allow manual override
            min="0"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Ride"}
        </button>
      </form>

      {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
    </div>
  );
};

export default CreateRide;
