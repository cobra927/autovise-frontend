import { useState } from "react";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.status === 409) {
      alert("An account with this email already exists.");
      return;
    }

    if (res.ok) {
      localStorage.setItem("role", formData.role);
      localStorage.setItem("email", formData.email);

      if (formData.role === "freelancer") {
        localStorage.setItem("freelancerName", formData.name);
        localStorage.setItem("freelancerEmail", formData.email);
        window.location.href = "/freelancer/setup";
      } else {
        window.location.href = "/buyer/dashboard";
      }
    } else {
      alert("Failed to create account.");
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-gray-900 p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-blue-900">Sign Up</h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded bg-white text-black"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded bg-white text-black"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded bg-white text-black"
          required
        />

        <div className="space-y-2">
          <label className="block font-medium text-gray-700 mb-1">I'm here to:</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="buyer"
                checked={formData.role === "buyer"}
                onChange={handleChange}
                className="mr-2"
              />
              Buy a Car
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="freelancer"
                checked={formData.role === "freelancer"}
                onChange={handleChange}
                className="mr-2"
              />
              Inspect Cars
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
