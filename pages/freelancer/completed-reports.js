import { useEffect, useState } from "react";

export default function CompletedReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const auth = await fetch("/api/me");
        const authData = await auth.json();
        if (!authData.success || authData.user.role !== "freelancer") {
          window.location.href = "/login";
          return;
        }

        setEmail(authData.user.email);

        const res = await fetch("/api/get-inspection-requests");
        const data = await res.json();

        const completed = data.filter((r) => r.fields["Status"] === "Completed");
        setReports(completed);
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  if (loading) return <p className="p-8">Loading reports...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Completed Inspections</h1>
      <p className="mb-6 text-sm text-gray-600">Logged in as <span className="font-mono text-blue-700">{email}</span></p>

      {reports.length === 0 ? (
        <p className="text-gray-600">No completed reports yet.</p>
      ) : (
        <ul className="space-y-6">
          {reports.map((r) => (
            <li key={r.id} className="bg-white p-6 rounded shadow">
              <p><strong>Listing:</strong> {r.fields["Listing"]}</p>
              <p><strong>Tier:</strong> {r.fields["Tier Selected"]}</p>
              <p><strong>Notes:</strong> {r.fields["Inspection Report"] || "—"}</p>
              <p><strong>Submitted:</strong> {new Date(r.fields["Report Submitted At"]).toLocaleString()}</p>

              {r.fields["Inspection Photos"]?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {r.fields["Inspection Photos"].map((file, idx) => (
                    <img
                      key={idx}
                      src={file.url || file}
                      alt={`Photo ${idx + 1}`}
                      className="rounded border object-cover w-full h-40"
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
