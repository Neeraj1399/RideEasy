// frontend/src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const [pendingKycs, setPendingKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPendingKycs();
  }, []);

  const fetchPendingKycs = async () => {
    setLoading(true);
    setError(null);
    setMessage("");
    try {
      const token = await getToken();
      const response = await axios.get(`${backendUrl}/api/admin/kyc/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingKycs(response.data);
    } catch (err) {
      console.error("Error fetching pending KYCs:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch pending KYC applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReviewKyc = async (kycId, status) => {
    try {
      const token = await getToken();
      const response = await axios.put(
        `${backendUrl}/api/admin/kyc/${kycId}/review`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(response.data.message);
      fetchPendingKycs(); // Refresh the list
    } catch (err) {
      console.error(`Error ${status}ing KYC:`, err);
      setError(
        err.response?.data?.message || `Failed to ${status} KYC application.`
      );
    }
  };

  if (loading)
    return <div className="text-center py-10">Loading admin dashboard...</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

      {message && <p className="mb-4 text-green-600 text-center">{message}</p>}

      <h2 className="text-2xl font-semibold mb-4">Pending KYC Applications</h2>
      {pendingKycs.length === 0 ? (
        <p className="text-gray-600">No pending KYC applications.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingKycs.map((kyc) => (
            <div
              key={kyc._id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
              <h3 className="text-xl font-bold mb-2">
                Applicant: {kyc.fullName}
              </h3>
              <p>Email: {kyc.email}</p>
              <p>Phone: {kyc.phoneNumber}</p>
              <p className="mt-2 font-semibold">Documents:</p>
              <ul className="list-disc list-inside text-sm">
                <li>
                  <a
                    href={kyc.driverLicenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Driver's License
                  </a>
                </li>
                <li>
                  <a
                    href={kyc.vehicleRegistrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Vehicle Registration
                  </a>
                </li>
                <li>
                  <a
                    href={kyc.idProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    ID Proof
                  </a>
                </li>
              </ul>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleReviewKyc(kyc._id, "approved")}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReviewKyc(kyc._id, "rejected")}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
