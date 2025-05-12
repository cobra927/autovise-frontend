import { useEffect, useState } from "react";

export default function FreelancerDashboard() {
  const [assigned, setAssigned] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail =
        localStorage.getItem("freelancerEmail") ||
        localStorage.getItem("email") ||
        "";
      setEmail(storedEmail.toLowerCase());
    }
  }, []);

  useEffect(() => {
    if (!email) return;

    async function fetchJobs() {
      try {
        const res = await fetch(`/api/get-buyer-requests?email=${email}`);
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("❌ Unexpected API response:", data);
          return;
        }

        setAssigned(
          data.filter(
            (r) =>
              r.fields["Inspector Assigned"]?.toLowerCase() === email &&
              r.fields["Status"] === "Matched"
          )
        );

        setAccepted(
          data.filter(
            (r) =>
              r.fields["Inspector Assigned"]?.toLowerCase() === email &&
              r.fields["Status"] === "Accepted"
          )
        );
      } catch (err) {
        console.error("Failed to load requests:", err);
      }
    }

    fetchJobs();
  }, [email]);

  const acceptJob = async (recordId) => {
    try {
      const res = await fetch("/api/accept-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, inspectorEmail: email }),
      });

      if (res.ok) {
        alert("Job accepted.");
        window.location.reload();
      } else {
        alert("Failed to accept job.");
      }
    } catch (err) {
      console.error("Accept failed:", err);
      alert("Unexpected error accepting job.");
    }
  };

  const declineJob = async (recordId) => {
    try {
      const res = await fetch("/api/decline-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });

      if (res.ok) {
        alert("Job declined.");
        window.location.reload();
      } else {
        alert("Failed to decline job.");
      }
    } catch (err) {
      console.error("Decline failed:", err);
      alert("Unexpected error declining job.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <h1 className="text-3xl font-bold mb-6">Inspector Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">📬 New Inspection Requests</h2>
        {assigned.length > 0 ? (
          <ul className="space-y-4">
            {assigned.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>ZIP:</strong> {r.fields["ZIP"]}</p>
                <p><strong>Tier:</strong> {r.fields["Tier Selected"]}</p>
                <div className="flex space-x-4 mt-3">
                  <button
                    onClick={() => acceptJob(r.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Accept Job
                  </button>
                  <button
                    onClick={() => declineJob(r.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Decline Job
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No new requests assigned to you yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">✅ Accepted Jobs</h2>
        {accepted.length > 0 ? (
          <ul className="space-y-4">
            {accepted.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Status:</strong> Accepted</p>
                <p><strong>Tier:</strong> {r.fields["Tier Selected"]}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">You haven't accepted any jobs yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">👤 Account</h2>
        <p className="text-gray-600">Feature coming soon: edit profile, tools, travel radius, and availability.</p>
      </section>
    </div>
  );
}
