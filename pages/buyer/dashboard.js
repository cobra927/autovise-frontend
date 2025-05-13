import { useEffect, useState } from "react";

export default function BuyerDashboard() {
  const [pending, setPending] = useState([]);
  const [matched, setMatched] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("buyerEmail") || localStorage.getItem("email");
      if (stored) setEmail(stored.toLowerCase());
    }
  }, []);

  useEffect(() => {
    if (!email) return;

    async function fetchRequests() {
      try {
        const res = await fetch(`/api/get-inspection-requests?email=${email}&role=buyer`);
        const result = await res.json();

        if (!Array.isArray(result)) {
          console.error("❌ Unexpected response format:", result);
          return;
        }

        setPending(result.filter((r) =>
          r.fields["Status"] === "Matched" || r.fields["Status"] === "Paid"
        ));
        setMatched(result.filter((r) => r.fields["Status"] === "Accepted"));
        setDeclined(result.filter((r) => r.fields["Status"] === "Declined"));
      } catch (err) {
        console.error("Failed to load requests:", err);
      }
    }

    fetchRequests();
  }, [email]);

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
        <h2 className="text-xl font-semibold mb-2">📬 Pending Inspector Acceptance</h2>
        {pending.length > 0 ? (
          <ul className="space-y-4">
            {pending.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Inspector:</strong> {r.inspector?.Name || "—"}</p>
                <p><strong>Status:</strong> {r.fields["Status"]}</p>
                <p><strong>Payment:</strong> {r.fields["Payment Status"] || "Unpaid"}</p>
                {tierBadge(r.fields["Tier Selected"])}
                {r.fields["Payment Status"] !== "Paid" && (
                  <a
                    href="/buyer/payment"
                    className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Complete Payment
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No pending requests at the moment.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">✅ Accepted Requests</h2>
        {matched.length > 0 ? (
          <ul className="space-y-4">
            {matched.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Inspector:</strong> {r.inspector?.Name || "—"}</p>
                <p><strong>Status:</strong> Accepted</p>
                <p><strong>Payment:</strong> {r.fields["Payment Status"] || "Pending"}</p>
                {tierBadge(r.fields["Tier Selected"])}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">You have no accepted jobs yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">❌ Declined Requests</h2>
        {declined.length > 0 ? (
          <ul className="space-y-4">
            {declined.map((r) => (
              <li key={r.id} className="bg-white p-4 rounded shadow">
                <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
                <p><strong>Inspector:</strong> {r.inspector?.Name || "—"}</p>
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
