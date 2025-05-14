import { useEffect, useState } from "react";

export default function BuyerDashboard() {
  const [pending, setPending] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    async function fetchUserAndRequests() {
      try {
        const userRes = await fetch("/api/me");
        const userData = await userRes.json();

        if (!userData.success || userData.user.role !== "buyer") {
          console.error("User not authenticated or not a buyer");
          return;
        }

        setEmail(userData.user.email);

        const res = await fetch("/api/get-inspection-requests");
        const result = await res.json();

        if (!Array.isArray(result)) {
          console.error("❌ Unexpected response format:", result);
          return;
        }

        setPending(result.filter((r) =>
          ["Submitted", "Matched"].includes(r.fields["Status"])
        ));

        setInProgress(result.filter((r) =>
          r.fields["Status"] === "Accepted"
        ));

        setCompleted(result.filter((r) =>
          r.fields["Status"] === "Completed"
        ));

        setDeclined(result.filter((r) =>
          r.fields["Status"] === "Declined"
        ));
      } catch (err) {
        console.error("Failed to load user or requests:", err);
      }
    }

    fetchUserAndRequests();
  }, []);

  const tierBadge = (tier) => (
    <span className="inline-block mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
      {tier || "Tier not selected"}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <h1 className="text-3xl font-bold mb-4">Buyer Dashboard</h1>
      {email && (
        <p className="mb-6 text-sm text-gray-600">
          Logged in as: <span className="font-mono text-blue-700">{email}</span>
        </p>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">📬 Pending Requests</h2>
        {pending.length > 0 ? (
          <ul className="space-y-4">
            {pending.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Status:</strong> {r.fields["Status"]}</p>
                <p><strong>Payment:</strong> {r.fields["Payment Status"] || "Unpaid"}</p>
                {tierBadge(r.fields["Tier Selected"])}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No pending requests at the moment.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">🛠 In Progress</h2>
        {inProgress.length > 0 ? (
          <ul className="space-y-4">
            {inProgress.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Status:</strong> {r.fields["Status"]}</p>
                <p><strong>Payment:</strong> {r.fields["Payment Status"] || "Unpaid"}</p>
                {tierBadge(r.fields["Tier Selected"])}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No active inspections yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">✅ Completed Reports</h2>
        {completed.length > 0 ? (
          <ul className="space-y-4">
            {completed.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Status:</strong> Completed</p>
                <p><strong>Payment:</strong> {r.fields["Payment Status"] || "Unknown"}</p>
                {tierBadge(r.fields["Tier Selected"])}
                <div className="mt-4">
                  <a
                    href={`/buyer/report?id=${r.id}`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    View Report
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No completed inspections yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">❌ Declined or Unavailable</h2>
        {declined.length > 0 ? (
          <ul className="space-y-4">
            {declined.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Status:</strong> Declined</p>
                {tierBadge(r.fields["Tier Selected"])}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No declined requests.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">👤 Account</h2>
        <p className="text-gray-600">Feature coming soon: view inspection history and manage account info.</p>
      </section>
    </div>
  );
}
