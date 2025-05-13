import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const tierChecklistMap = {
  "Remote Listing Review": [
    { id: "marketAnalysis", label: "Market comparison complete" },
    { id: "photoReview", label: "Listing photo review done" },
    { id: "recommendation", label: "Final go/no-go recommendation provided" },
  ],
  "In-Person Inspection": [
    { id: "exterior", label: "Exterior photos + inspection complete" },
    { id: "interior", label: "Interior photos + inspection complete" },
    { id: "engine", label: "Underhood photos and notes" },
    { id: "testDrive", label: "Test drive completed" },
    { id: "photos", label: "All required photos uploaded" },
  ],
  "In-Person + Negotiation": [
    { id: "exterior", label: "Exterior photos + inspection complete" },
    { id: "interior", label: "Interior photos + inspection complete" },
    { id: "engine", label: "Underhood photos and notes" },
    { id: "testDrive", label: "Test drive completed" },
    { id: "photos", label: "All required photos uploaded" },
    { id: "negotiation", label: "Negotiation completed + transcript provided" },
  ],
};

export default function ReportPage() {
  const router = useRouter();
  const { id: recordId } = router.query;

  const [tier, setTier] = useState("");
  const [checklist, setChecklist] = useState({});
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !recordId) return;

    async function init() {
      try {
        const authRes = await fetch("/api/me");
        const auth = await authRes.json();
        if (!auth.success || auth.user.role !== "freelancer") {
          router.replace("/login");
          return;
        }

        const res = await fetch(`/api/inspect-request?id=${recordId}`);
        const data = await res.json();
        if (!data.fields || data.fields["Inspector Assigned"]?.[0] !== auth.user.id) {
          setError("You are not assigned to this request.");
          return;
        }

        setTier(data.fields["Tier Selected"] || "Unknown");
      } catch (err) {
        console.error(err);
        setError("Failed to load request.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router.isReady, recordId]);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async () => {
    // Airtable expects files in this format: [{ url: "...", filename: "..." }]
    const attachmentData = await Promise.all(
      Array.from(files).map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = () => {
            resolve({ base64: reader.result.split(",")[1], filename: file.name, type: file.type });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    const body = {
      recordId,
      notes,
      checklist,
      photos: attachmentData, // base64 uploads with file names
    };

    const res = await fetch("/api/freelancer/submit-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (result.success) {
      alert("Report submitted successfully!");
      router.push("/freelancer/dashboard");
    } else {
      console.error(result);
      alert("Failed to submit: " + (result.error || "Unknown error"));
    }
  };

  const checklistItems = tierChecklistMap[tier] || [];

  if (loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-red-600 font-semibold">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <h1 className="text-3xl font-bold mb-4">Inspection Report</h1>
      <p className="mb-4">Tier: <strong>{tier}</strong></p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Checklist</h2>
        <ul className="space-y-2">
          {checklistItems.map((item) => (
            <li key={item.id}>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={checklist[item.id] || false}
                  onChange={(e) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked,
                    }))
                  }
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Notes</h2>
        <textarea
          rows="6"
          className="w-full border rounded p-3"
          placeholder="Write your findings here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Upload Photos (PNG/JPG)</h2>
        <input type="file" multiple accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
        {files.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {Array.from(files).map((f, i) => (
              <li key={i}>📷 {f.name}</li>
            ))}
          </ul>
        )}
      </section>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold"
      >
        Submit Report
      </button>
    </div>
  );
}
