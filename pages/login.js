import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", formData.email);

      if (data.role === "freelancer") {
        localStorage.setItem("freelancerEmail", formData.email);
      } else if (data.role === "buyer") {
        localStorage.setItem("buyerEmail", formData.email);
      }

      // Redirect to homepage and force header re-render
      router.push("/").then(() => window.location.reload());
    } else {
      alert("Login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-gray-900 p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-blue-900">Log In</h2>

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

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Log In
        </button>

        <p className="text-center text-sm text-gray-700">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign up here
          </a>
        </p>
      </form>
    </div>
  );
}
