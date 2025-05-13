import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Matches() {
  const router = useRouter();
  const [buyerZip, setBuyerZip] = useState("");
  const [matches, setMatches] = useState(null);
  const [selectedInspector, setSelectedInspector] = useState(null);
  const [tier, setTier] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const { recordId, zip } = router.query;
    if (!recordId || !zip) {
      console.warn("⚠️ Missing recordId or zip in query params");
      setMatches([]);
      return;
    }

    setBuyerZip(zip);

    fetch("/api/match-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, buyerZip: zip }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.matches || !Array.isArray(data.matches)) {
          console.warn("⚠️ No valid matches found.");
          setMatches([]);
          return;
        }
        setMatches(data.matches);
      })
      .catch((err) => {
        console.error("❌ Error fetching matches:", err);
        setMatches([]);
      });
  }, [router.isReady, router.query]);

  const handleContinue = () => {
    if (!selectedInspector || !tier) {
      alert("Please select both an inspector and a service tier.");
      return;
    }

    router.push({
      pathname: "/inspect/payment",
      query: {
        inspectorId: selectedInspector.id,
        tier,
      },
    });
  };

  return (
    <div className="min-h-screen px-4 py-16 bg-blue-900 text-white flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Choose Your Inspector</h1>
      <p className="mb-6 text-lg text-blue-100">Matches for Listing ZIP: {buyerZip}</p>

      {matches === null ? (
        <p className="text-blue-200">Loading...</p>
      ) : matches.length === 0 ? (
        <p className="text-blue-200">No available inspectors at this time.</p>
      ) : (
        <ul className="space-y-4 w-full max-w-md mb-8">
          {matches.map((m, idx) => (
            <li
              key={idx}
              className={`p-4 rounded shadow cursor-pointer ${
                selectedInspector?.email === m.email
                  ? "bg-green-100 text-blue-900 border-2 border-green-400"
                  : "bg-white text-blue-900"
              }`}
              onClick={() => setSelectedInspector(m)}
            >
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-gray-800">Email: {m.email}</p>
              <p className="text-sm text-gray-600">ZIP: {m.zip}</p>
              <p className="text-sm text-gray-600">Distance: {m.distance} mi</p>
            </li>
          ))}
        </ul>
      )}

      <div className="w-full max-w-md space-y-6 bg-white text-gray-900 p-6 rounded">
        <p className="text-lg font-semibold text-blue-900">Choose a Service Tier:</p>

        {["Remote Listing Review", "In-Person Inspection", "In-Person + Negotiation"].map((label) => (
          <label key={label} className="flex items-start space-x-3">
            <input
              type="radio"
              name="tier"
              value={label}
              checked={tier === label}
              onChange={(e) => setTier(e.target.value)}
              className="mt-1"
              aria-label={`Select ${label} tier`}
            />
            <div>
              <p className="font-semibold">{label}</p>
            </div>
          </label>
        ))}

        <button
          onClick={handleContinue}
          disabled={!tier || !selectedInspector}
          className={`w-full mt-2 py-2 rounded font-semibold text-white ${
            tier && selectedInspector
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
