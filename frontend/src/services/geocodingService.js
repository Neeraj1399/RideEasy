// frontend/src/services/geocodingService.js
// Removed the import { Geocode } from "react-geocode"; as it's not being used directly
// and it's causing confusion with Nominatim's response format.

// We will stick to direct fetch/axios for Nominatim, which is more reliable.

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

export const getAddressSuggestions = async (address) => {
  if (!address || address.length < 3) {
    // Good to have a minimum length
    return [];
  }
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(
        address
      )}&format=json&addressdetails=1&limit=5&countrycodes=in`
      // Added countrycodes=in directly in the URL params for clarity and consistency
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data.map((item) => ({
      // Nominatim's response structure
      displayName: item.display_name, // Changed from display_name to displayName for consistency with frontend
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      // You can add more details from 'item' if needed
    }));
  } catch (error) {
    console.error("Error fetching address suggestions:", error);
    return [];
  }
};

// Removed `export default Geocode;` as `Geocode` is no longer imported or used.
