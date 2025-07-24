import { useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

const KYCForm = () => {
  const { user } = useUser();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    license: null,
    registration: null,
    idProof: null,
  });

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("license", form.license);
    formData.append("registration", form.registration);
    formData.append("idProof", form.idProof);

    try {
      const res = await axios.post("/api/kyc", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.id}`, // Clerk ID
        },
      });

      setStatus("KYC submitted successfully!");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "KYC submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Driver KYC Verification</h2>

      {status && <p className="text-green-600 mb-3">{status}</p>}
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <label className="block font-medium">Upload License</label>
        <input
          type="file"
          name="license"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          required
        />

        <label className="block font-medium">Upload Vehicle Registration</label>
        <input
          type="file"
          name="registration"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          required
        />

        <label className="block font-medium">Upload ID Proof</label>
        <input
          type="file"
          name="idProof"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit KYC"}
        </button>
      </form>
    </div>
  );
};

export default KYCForm;
