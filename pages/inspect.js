import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function InspectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    zip: "",
    listing: "",
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();

        if (!data.success) throw new Error("Not authenticated");

        const { role, email } = data.user;
        if (role !== "buyer") {
          router.replace("/wrong-role");
          return;
        }

        // Optionally preload name/email if you have them stored in Airtable
        setFormData((prev) => ({
          ...prev,
          email,
          name: "", // preload with Airtable name if stored and available
        }));
      } catch {
        router.replace("/login");
      }
    }

    fetchUser();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitRes = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        zip: formData.zip,
        vehicleInfo: formData.listing,
      }),
    });

    const { recordId } = await submitRes.json();
    if (!recordId) {
      alert("Failed to create inspection request.");
      return;
    }

    const matchRes = await fetch("/api/match-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerZip: formData.zip,
        recordId,
      }),
    });

    if (matchRes.ok) {
      router.push(`/inspect/matches?zip=${formData.zip}`);
    } else {
      alert("ZIP matching failed.");
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-gray-900 p-8 rounded shadow-md w-full max-w-lg space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-4">
          Request a Vehicle Inspection
        </h1>

        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded bg-white text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded bg-white text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Listing ZIP Code</label>
          <input
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded bg-white text-black"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Listing URL</label>
          <input
            name="listing"
            value={formData.listing}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded bg-white text-black"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
