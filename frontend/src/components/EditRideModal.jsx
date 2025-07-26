// frontend/src/components/EditRideModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { getAddressSuggestions } from "../services/geocodingService";
import { getDistance } from "geolib";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const RATES_PER_KM = {
  "two-wheeler": 5,
  car: 12,
  truck: 25,
};

const EditRideModal = ({ ride, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    origin: ride.origin,
    originCoords: ride.originCoords,
    destination: ride.destination,
    destinationCoords: ride.destinationCoords,
    vehicleType: ride.vehicleType,
    availableSpace: ride.availableSpace,
    price: ride.price,
    distanceKm: ride.distanceKm,
    status: ride.status, // Allow editing status (e.g., active/completed/cancelled)
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const originTimeoutRef = useRef(null);
  const destinationTimeoutRef = useRef(null);

  // --- Price Calculation Logic ---
  const calculatePrice = useCallback(() => {
    if (formData.distanceKm > 0 && formData.vehicleType) {
      const rate =
        RATES_PER_KM[formData.vehicleType] || RATES_PER_KM["two-wheeler"];
      const calculatedPrice = (formData.distanceKm * rate).toFixed(2);
      setFormData((prev) => ({ ...prev, price: parseFloat(calculatedPrice) }));
    } else {
      setFormData((prev) => ({ ...prev, price: 0 }));
    }
  }, [formData.distanceKm, formData.vehicleType]);

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
        const distKm = distMeters / 1000;
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

  useEffect(() => {
    calculateDistance();
  }, [calculateDistance]);

  // --- Handlers for autocomplete inputs ---
  const handleOriginInputChange = async (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      origin: value,
      originCoords: null,
      distanceKm: 0,
      price: 0,
    }));
    if (originTimeoutRef.current) clearTimeout(originTimeoutRef.current);
    originTimeoutRef.current = setTimeout(async () => {
      const suggestions = await getAddressSuggestions(value);
      setOriginSuggestions(suggestions);
    }, 500);
  };

  const handleDestinationInputChange = async (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      destination: value,
      destinationCoords: null,
      distanceKm: 0,
      price: 0,
    }));
    if (destinationTimeoutRef.current)
      clearTimeout(destinationTimeoutRef.current);
    destinationTimeoutRef.current = setTimeout(async () => {
      const suggestions = await getAddressSuggestions(value);
      setDestinationSuggestions(suggestions);
    }, 500);
  };

  const selectOriginSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      origin: suggestion.displayName,
      originCoords: { lat: suggestion.lat, lon: suggestion.lon },
    }));
    setOriginSuggestions([]);
  };

  const selectDestinationSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      destination: suggestion.displayName,
      destinationCoords: { lat: suggestion.lat, lon: suggestion.lon },
    }));
    setDestinationSuggestions([]);
  };

  // --- General change handler for other fields ---
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

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
      await axios.put(`${backendUrl}/api/rides/${ride._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Ride updated successfully!");
      onSuccess(); // Call onSuccess to close modal and refresh parent list
    } catch (err) {
      console.error("Error updating ride:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update ride. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Edit Ride</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

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
              onChange={handleOriginInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
              autoComplete="off"
            />
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
              onChange={handleDestinationInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
              autoComplete="off"
            />
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
              onChange={handleChange}
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
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Ride Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Ride"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-green-600 text-center">{message}</p>
        )}
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default EditRideModal;
