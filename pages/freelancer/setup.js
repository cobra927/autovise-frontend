import { useState, useEffect } from "react";

export default function FreelancerSetup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    experience: "",
    tools: "",
    travel: "",
    zip: "",
  });

  // Load name/email from localStorage on mount
  useEffect(() => {
    const name = localStorage.getItem("freelancerName");
    const email = localStorage.getItem("freelancerEmail");

    setFormData((prev) => ({
      ...prev,
      name: name || "",
      email: email || "",
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/submit-freelancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        localStorage.removeItem("freelancerName");
        localStorage.removeItem("freelancerEmail");
        window.location.href = "/";
      } else {
        const { error } = await res.json();
        alert("Submission failed: " + error);
      }
    } catch (err) {
      console.error("❌ Submit failed:", err);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-16 bg-gray-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Freelancer Setup
        </h2>

        <textarea
          name="experience"
          placeholder="Your experience with cars"
          value={formData.experience}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <textarea
          name="tools"
          placeholder="Tools or equipment you own"
          value={formData.tools}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          name="travel"
          placeholder="Max distance you're willing to travel (miles)"
          value={formData.travel}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="text"
          name="zip"
          placeholder="Your ZIP code"
          value={formData.zip}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
