// import React from "react";

// const RideCard = ({ ride }) => {
//   return (
//     <div className="bg-white rounded shadow p-4 mb-4 w-full max-w-md mx-auto">
//       <div className="text-lg font-semibold text-gray-800">
//         {ride.origin} → {ride.destination}
//       </div>
//       <div className="text-sm text-gray-600">Vehicle: {ride.vehicleType}</div>
//       <div className="text-sm text-gray-600">Price: ₹{ride.price}</div>
//       <div className="text-sm text-green-600 font-medium">
//         Available Seats: {ride.availableSpace}
//       </div>
//     </div>
//   );
// };

// export default RideCard;

// src/components/RideCard.jsx
const RideCard = ({ ride }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <h2 className="text-xl font-semibold text-blue-600">
        {ride.origin} → {ride.destination}
      </h2>
      <p className="text-gray-600 mt-1">Vehicle: {ride.vehicleType}</p>
      <p className="text-gray-600">Available Seats: {ride.availableSpace}</p>
      <p className="text-gray-800 font-medium mt-1">Price: ₹{ride.price}</p>
      <Link
        to={`/join/${ride._id}`}
        className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Join Ride
      </Link>
    </div>
  );
};

export default RideCard;
