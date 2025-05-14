import { useEffect, useState } from "react";

export default function FreelancerDashboard() {
  const [assigned, setAssigned] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    async function fetchUserAndJobs() {
      try {
        const userRes = await fetch("/api/me");
        const userData = await userRes.json();

        if (!userData.success || userData.user.role !== "freelancer") {
          console.error("User not authenticated or not a freelancer");
          return;
        }

        setEmail(userData.user.email);

        const res = await fetch("/api/get-inspection-requests");
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("❌ Unexpected API response:", data);
          return;
        }

        setAssigned(data.filter((r) =>
          ["Matched", "Paid"].includes(r.fields["Status"])
        ));
        setAccepted(data.filter((r) => r.fields["Status"] === "Accepted"));
      } catch (err) {
        console.error("Failed to load user or requests:", err);
      }
    }

    fetchUserAndJobs();
  }, []);

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
      <h1 className="text-3xl font-bold mb-4">Freelancer Dashboard</h1>

      {email && (
        <div className="mb-6 text-sm text-gray-600">
          Logged in as: <span className="font-mono text-blue-700">{email}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-4xl font-bold text-blue-800">{assigned.length}</p>
          <p className="text-sm mt-1 text-gray-600">New Assignments</p>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-4xl font-bold text-green-700">{accepted.length}</p>
          <p className="text-sm mt-1 text-gray-600">Accepted Jobs</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">📬 New Inspection Requests</h2>
        {assigned.length > 0 ? (
          <ul className="space-y-4">
            {assigned.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>ZIP:</strong> {r.fields["ZIP"]}</p>
                <p><strong>Status:</strong> {r.fields["Status"]}</p>
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

                <div className="mt-4">
                  <a
                    href={`/freelancer/report?id=${r.id}`}
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Submit Report
                  </a>
                </div>
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
        <p className="mt-4">
          <a
            href="/freelancer/completed-reports"
            className="text-blue-600 underline"
          >
            View Completed Reports
          </a>
        </p>
      </section>
    </div>
  );
}
